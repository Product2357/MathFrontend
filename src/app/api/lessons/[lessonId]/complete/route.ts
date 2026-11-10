import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser, hasActiveAccess } from "@/lib/server/session";
import { hasCourseAccess } from "@/lib/server/course-access";

export async function POST(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  if (!hasActiveAccess(user)) {
    return NextResponse.json({ error: "Срок доступа закончился. Обратитесь к администратору." }, { status: 403 });
  }

  const { lessonId } = await context.params;
  const db = getDbClient();
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, module: { course: { isPublished: true } } },
    select: { id: true, module: { select: { courseId: true } }, _count: { select: { questions: true } } },
  });
  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  if (!await hasCourseAccess(user.id, user.role, lesson.module.courseId)) {
    return NextResponse.json({ error: "Этот курс не назначен вашему аккаунту." }, { status: 403 });
  }
  if (lesson._count.questions > 0) {
    return NextResponse.json({ error: "Сначала выполните задания урока." }, { status: 409 });
  }

  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, completed: true, progress: 100 },
    update: { completed: true, progress: 100 },
    select: { completed: true, progress: true },
  });

  return NextResponse.json({ progress });
}
