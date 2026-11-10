import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

const moduleSchema = z.object({
  title: z.string().trim().min(2).max(160),
  coverImage: z.url().nullable().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = moduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Введите название модуля" }, { status: 400 });

  const { courseId } = await context.params;
  const db = getDbClient();
  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });

  const lastModule = await db.module.aggregate({ where: { courseId }, _max: { order: true } });
  const createdModule = await db.module.create({
    data: { courseId, ...parsed.data, order: (lastModule._max.order ?? 0) + 1 },
    select: { id: true, title: true, coverImage: true, order: true },
  });

  return NextResponse.json({ module: createdModule }, { status: 201 });
}