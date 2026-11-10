import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { getCurrentUser, hasActiveAccess } from "@/lib/server/session";
import { hasCourseAccess } from "@/lib/server/course-access";

const submissionSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number()])),
});

function normalizeAnswer(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  if (!hasActiveAccess(user)) {
    return NextResponse.json({ error: "Срок доступа закончился. Обратитесь к администратору." }, { status: 403 });
  }

  const parsed = submissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректные ответы" }, { status: 400 });

  const { lessonId } = await context.params;
  const db = getDbClient();
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId, module: { course: { isPublished: true } } },
    select: {
      id: true,
      module: { select: { courseId: true } },
      questions: { select: { id: true, correctAnswer: true } },
    },
  });

  if (!lesson || lesson.questions.length === 0) {
    return NextResponse.json({ error: "Урок или задания не найдены" }, { status: 404 });
  }
  if (!await hasCourseAccess(user.id, user.role, lesson.module.courseId)) {
    return NextResponse.json({ error: "Этот курс не назначен вашему аккаунту." }, { status: 403 });
  }

  const correctCount = lesson.questions.reduce((count, question) => {
    const expected = question.correctAnswer;
    return normalizeAnswer(parsed.data.answers[question.id]) === normalizeAnswer(expected)
      ? count + 1
      : count;
  }, 0);
  const total = lesson.questions.length;
  const score = Math.round((correctCount / total) * 100);
  const completed = score >= 70;
  const answers = Object.fromEntries(
    Object.entries(parsed.data.answers).map(([questionId, answer]) => [questionId, String(answer)]),
  );

  const [attempt] = await db.$transaction([
    db.quizAttempt.create({
      data: { userId: user.id, lessonId, score, total, answers },
      select: { id: true, score: true, total: true, submittedAt: true },
    }),
    db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, completed, progress: score },
      update: { completed, progress: score },
    }),
  ]);

  return NextResponse.json({ attempt, completed });
}