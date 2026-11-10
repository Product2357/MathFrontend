import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";
import {
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
  createVideoKey,
  createVideoUploadUrl,
  deleteVideoObject,
  getVideoObjectSize,
} from "@/lib/server/r2";

const requestUploadSchema = z.object({
  contentType: z.enum(Object.keys(ALLOWED_VIDEO_TYPES) as [string, ...string[]]),
  size: z.number().int().positive().max(MAX_VIDEO_BYTES),
});

const confirmUploadSchema = z.object({
  key: z.string().min(1).max(300),
});

type RouteContext = { params: Promise<{ lessonId: string }> };

async function findLesson(lessonId: string) {
  return getDbClient().lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, videoObjectKey: true },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { lessonId } = await context.params;
  const parsed = requestUploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Выберите видео MP4, WebM или MOV размером до 2 ГБ" }, { status: 400 });
  }
  if (!await findLesson(lessonId)) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });

  const key = createVideoKey(lessonId, parsed.data.contentType);
  const uploadUrl = await createVideoUploadUrl(key, parsed.data.contentType);
  return NextResponse.json({ key, uploadUrl });
}

export async function PUT(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { lessonId } = await context.params;
  const parsed = confirmUploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.key.startsWith(`lessons/${lessonId}/`)) {
    return NextResponse.json({ error: "Некорректный файл видео" }, { status: 400 });
  }

  const lesson = await findLesson(lessonId);
  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });

  const size = await getVideoObjectSize(parsed.data.key);
  if (size === null) {
    return NextResponse.json({ error: "Файл не найден в хранилище. Загрузите его ещё раз." }, { status: 400 });
  }
  if (size > MAX_VIDEO_BYTES) {
    await deleteVideoObject(parsed.data.key);
    return NextResponse.json({ error: "Файл больше 2 ГБ" }, { status: 400 });
  }

  const previousKey = lesson.videoObjectKey;
  await getDbClient().lesson.update({
    where: { id: lessonId },
    data: { videoObjectKey: parsed.data.key, videoUrl: null },
  });
  if (previousKey && previousKey !== parsed.data.key) {
    await deleteVideoObject(previousKey).catch(() => undefined);
  }

  return NextResponse.json({ videoObjectKey: parsed.data.key });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { lessonId } = await context.params;
  const lesson = await findLesson(lessonId);
  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });

  if (lesson.videoObjectKey) {
    await deleteVideoObject(lesson.videoObjectKey);
    await getDbClient().lesson.update({ where: { id: lessonId }, data: { videoObjectKey: null } });
  }
  return NextResponse.json({ ok: true });
}
