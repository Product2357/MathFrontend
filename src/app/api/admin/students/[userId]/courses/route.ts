import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

const assignmentSchema = z.object({
  courseIds: z.array(z.string().min(1)).max(100),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || new Set(parsed.data?.courseIds).size !== parsed.data?.courseIds.length) {
    return NextResponse.json({ error: "Выберите корректный список курсов" }, { status: 400 });
  }

  const { userId } = await context.params;
  const db = getDbClient();
  const student = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
  }

  const courseIds = parsed.data.courseIds;
  const publishedCourses = await db.course.findMany({
    where: { id: { in: courseIds }, isPublished: true },
    select: { id: true },
  });
  if (publishedCourses.length !== courseIds.length) {
    return NextResponse.json({ error: "Можно назначать только опубликованные курсы" }, { status: 400 });
  }

  await db.$transaction(async (transaction) => {
    await transaction.enrollment.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "REVOKED" },
    });

    for (const courseId of courseIds) {
      await transaction.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, status: "ACTIVE" },
        update: { status: "ACTIVE" },
      });
    }
  });

  return NextResponse.json({ courseIds });
}
