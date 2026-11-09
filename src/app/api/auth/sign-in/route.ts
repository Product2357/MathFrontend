import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { verifyPassword } from "@/lib/server/passwords";
import { createSession } from "@/lib/server/session";

const signInSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const parsed = signInSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Введите корректный email и пароль" }, { status: 400 });
  }

  const user = await getDbClient().user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user?.passwordHash || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}