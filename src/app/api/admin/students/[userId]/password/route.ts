import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";
import { hashPassword } from "@/lib/server/passwords";

const passwordSchema = z.object({
  password: z.string().min(10).max(128),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = passwordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Пароль должен содержать от 10 до 128 символов" }, { status: 400 });
  }

  const { userId } = await context.params;
  const db = getDbClient();
  const student = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
