import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

const updateCourseSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  coverImage: z.url().nullable().optional(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  price: z.number().finite().min(0).nullable().optional(),
  isPublished: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = updateCourseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Проверьте поля курса" }, { status: 400 });

  const { courseId } = await context.params;
  const db = getDbClient();
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, modules: { select: { lessons: { select: { id: true } } } } },
  });

  if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
  const hasLessons = course.modules.some((module) => module.lessons.length > 0);
  if (parsed.data.isPublished === true && !hasLessons) {
    return NextResponse.json({ error: "Добавьте хотя бы один урок перед публикацией" }, { status: 409 });
  }

  let updatedCourse;
  try {
    updatedCourse = await db.course.update({
      where: { id: courseId },
      data: parsed.data,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImage: true,
        level: true,
        price: true,
        isPublished: true,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Этот адрес курса уже занят" }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ course: updatedCourse });
}