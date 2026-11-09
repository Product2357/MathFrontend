import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { hashPassword } from "@/lib/server/passwords";
import { createSession } from "@/lib/server/session";

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = signUpSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте имя, email и пароль (не менее 8 символов)" }, { status: 400 });
  }

  try {
    const user = await getDbClient().user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Аккаунт с таким email уже существует" }, { status: 409 });
    }
    throw error;
  }
}