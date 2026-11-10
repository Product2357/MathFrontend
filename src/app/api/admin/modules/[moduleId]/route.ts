import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

const updateModuleSchema = z.object({
  title: z.string().trim().min(2).max(160),
  coverImage: z.url().nullable(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ moduleId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = updateModuleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте название модуля и ссылку на обложку" }, { status: 400 });
  }

  const { moduleId } = await context.params;
  const db = getDbClient();
  const existing = await db.module.findUnique({ where: { id: moduleId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Модуль не найден" }, { status: 404 });

  const updatedModule = await db.module.update({
    where: { id: moduleId },
    data: parsed.data,
    select: { id: true, title: true, coverImage: true },
  });

  return NextResponse.json({ module: updatedModule });
}
