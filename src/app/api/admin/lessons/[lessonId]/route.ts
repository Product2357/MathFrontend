import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";
import { deleteVideoObject } from "@/lib/server/r2";

const updateLessonSchema = z.object({
  title: z.string().trim().min(2).max(160),
  videoUrl: z.union([z.url(), z.literal("")]).nullable(),
  theory: z.string().max(12000).nullable(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = updateLessonSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте название, ссылку на видео и теорию урока" }, { status: 400 });
  }

  const { lessonId } = await context.params;
  const db = getDbClient();
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { id: true, videoObjectKey: true } });
  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });

  const replacesUploadedVideo = Boolean(parsed.data.videoUrl) && Boolean(lesson.videoObjectKey);
  if (replacesUploadedVideo && lesson.videoObjectKey) {
    await deleteVideoObject(lesson.videoObjectKey).catch(() => undefined);
  }

  const updatedLesson = await db.lesson.update({
    where: { id: lessonId },
    data: {
      title: parsed.data.title,
      videoUrl: parsed.data.videoUrl || null,
      ...(replacesUploadedVideo ? { videoObjectKey: null } : {}),
      theory: parsed.data.theory,
    },
    select: { id: true, title: true, videoUrl: true, theory: true },
  });

  return NextResponse.json({ lesson: updatedLesson });
}
