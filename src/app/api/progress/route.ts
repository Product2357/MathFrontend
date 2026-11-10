import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser, hasActiveAccess } from "@/lib/server/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  if (!hasActiveAccess(user)) return NextResponse.json({ courses: [], activity: [] });

  const db = getDbClient();
  const [enrollments, progresses, attempts] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id, status: "ACTIVE", course: { isPublished: true } },
      orderBy: { createdAt: "asc" },
      select: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            coverImage: true,
            level: true,
            modules: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                coverImage: true,
                lessons: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    title: true,
                    progresses: {
                      where: { userId: user.id },
                      select: { completed: true, progress: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.lessonProgress.findMany({
      where: {
        userId: user.id,
        lesson: {
          module: {
            course: {
              isPublished: true,
              enrollments: { some: { userId: user.id, status: "ACTIVE" } },
            },
          },
        },
      },
      select: {
        lessonId: true,
        completed: true,
        progress: true,
        updatedAt: true,
        lesson: {
          select: {
            title: true,
            module: { select: { course: { select: { title: true } } } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.quizAttempt.findMany({
      where: {
        userId: user.id,
        lesson: {
          module: {
            course: {
              isPublished: true,
              enrollments: { some: { userId: user.id, status: "ACTIVE" } },
            },
          },
        },
      },
      select: {
        id: true,
        score: true,
        total: true,
        submittedAt: true,
        lesson: {
          select: {
            title: true,
            module: { select: { course: { select: { title: true } } } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 8,
    }),
  ]);

  const activity = [
    ...progresses.map((entry) => ({
      id: `progress-${entry.lessonId}`,
      kind: "LESSON_PROGRESS" as const,
      title: entry.lesson.title,
      courseTitle: entry.lesson.module.course.title,
      date: entry.updatedAt.toISOString(),
      progress: entry.progress,
      completed: entry.completed,
    })),
    ...attempts.map((attempt) => ({
      id: `attempt-${attempt.id}`,
      kind: "QUIZ_ATTEMPT" as const,
      title: attempt.lesson.title,
      courseTitle: attempt.lesson.module.course.title,
      date: attempt.submittedAt.toISOString(),
      score: attempt.score,
      total: attempt.total,
    })),
  ].sort((first, second) => second.date.localeCompare(first.date)).slice(0, 8);

  return NextResponse.json({
    courses: enrollments.map((enrollment) => enrollment.course),
    activity,
  });
}
