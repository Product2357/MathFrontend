import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser, hasActiveAccess } from "@/lib/server/session";
import { hasCourseAccess } from "@/lib/server/course-access";
import { createVideoPlaybackUrl } from "@/lib/server/r2";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  if (!hasActiveAccess(user)) {
    return NextResponse.json({ error: "Срок доступа закончился. Обратитесь к администратору." }, { status: 403 });
  }

  const { lessonId } = await context.params;
  const lesson = await getDbClient().lesson.findFirst({
    where: { id: lessonId, module: { course: { isPublished: true } } },
    select: {
      id: true,
      title: true,
      videoUrl: true,
      videoObjectKey: true,
      theory: true,
      module: {
        select: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              modules: {
                orderBy: { order: "asc" },
                select: {
                  lessons: {
                    orderBy: { order: "asc" },
                    select: { id: true, title: true },
                  },
                },
              },
            },
          },
        },
      },
      questions: {
        orderBy: { createdAt: "asc" },
        select: { id: true, prompt: true, type: true, choices: true },
      },
    },
  });

  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  if (!await hasCourseAccess(user.id, user.role, lesson.module.course.id)) {
    return NextResponse.json({ error: "Этот курс не назначен вашему аккаунту." }, { status: 403 });
  }

  const videoUrl = lesson.videoObjectKey
    ? await createVideoPlaybackUrl(lesson.videoObjectKey)
    : lesson.videoUrl;

  const sequence = lesson.module.course.modules.flatMap((module) => module.lessons);
  const lessonIndex = sequence.findIndex((item) => item.id === lesson.id);
  const progress = await getDbClient().lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    select: { completed: true, progress: true },
  });

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      videoUrl,
      theory: lesson.theory,
      course: {
        id: lesson.module.course.id,
        slug: lesson.module.course.slug,
        title: lesson.module.course.title,
        totalLessons: sequence.length,
        lessonNumber: lessonIndex + 1,
        previousLesson: lessonIndex > 0 ? sequence[lessonIndex - 1] : null,
        nextLesson: lessonIndex >= 0 && lessonIndex < sequence.length - 1 ? sequence[lessonIndex + 1] : null,
      },
      progress: progress ?? { completed: false, progress: 0 },
      questions: lesson.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        choices: Array.isArray(question.choices)
          ? question.choices.filter((choice): choice is string => typeof choice === "string")
          : [],
      })),
    },
  });
}