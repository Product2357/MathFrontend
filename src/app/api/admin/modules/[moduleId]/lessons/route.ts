import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

const lessonSchema = z.object({
  title: z.string().trim().min(2).max(160),
  theory: z.string().trim().max(12000).optional().default(""),
  videoUrl: z.union([z.url(), z.literal("")]).optional().default(""),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ moduleId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = lessonSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Проверьте название, теорию и ссылку на видео" }, { status: 400 });

  const { moduleId } = await context.params;
  const db = getDbClient();
  const parentModule = await db.module.findUnique({ where: { id: moduleId }, select: { id: true } });
  if (!parentModule) return NextResponse.json({ error: "Модуль не найден" }, { status: 404 });

  const lastLesson = await db.lesson.aggregate({ where: { moduleId }, _max: { order: true } });
  const lesson = await db.lesson.create({
    data: {
      moduleId,
      title: parsed.data.title,
      theory: parsed.data.theory || null,
      videoUrl: parsed.data.videoUrl || null,
      order: (lastLesson._max.order ?? 0) + 1,
    },
    select: { id: true, title: true, order: true },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}