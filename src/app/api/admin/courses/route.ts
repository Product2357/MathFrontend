import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

const createCourseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: z.string().trim().max(4000).optional().default(""),
  coverImage: z.url().nullable().optional(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  price: z.number().finite().min(0).nullable(),
});

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const courses = await getDbClient().course.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      level: true,
      price: true,
      isPublished: true,
      updatedAt: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              videoUrl: true,
              theory: true,
              questions: { orderBy: { createdAt: "asc" }, select: { id: true, prompt: true, type: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = createCourseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте название, адрес курса, уровень и цену" }, { status: 400 });
  }

  try {
    const course = await getDbClient().course.create({
      data: { ...parsed.data, isPublished: false },
      select: { id: true, slug: true, title: true, isPublished: true, coverImage: true, description: true, level: true, price: true },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Этот адрес курса уже занят" }, { status: 409 });
    }
    throw error;
  }
}