import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { hashPassword } from "@/lib/server/passwords";
import { requireAdmin } from "@/lib/server/admin";

const createStudentSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(128),
  days: z.number().int().min(1).max(3650),
  amount: z.number().finite().positive(),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
});

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = createStudentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте данные клиента, срок доступа и сумму оплаты" }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + parsed.data.days * 24 * 60 * 60 * 1000);

  try {
    const student = await getDbClient().user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        subscriptions: {
          create: {
            status: "ACTIVE",
            planName: `manual_${parsed.data.days}_days`,
            startedAt: now,
            purchasedAt: now,
            expiresAt,
          },
        },
        payments: {
          create: {
            amount: parsed.data.amount,
            currency: parsed.data.currency,
            status: "PAID",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        enrollments: { select: { courseId: true } },
        subscriptions: { select: { status: true, expiresAt: true } },
      },
    });

    const { subscriptions, ...studentInfo } = student;
    const { enrollments, ...studentDetails } = studentInfo;
    return NextResponse.json({
      student: {
        ...studentDetails,
        access: subscriptions[0] ?? null,
        courseIds: enrollments.map((enrollment) => enrollment.courseId),
      },
    }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Аккаунт с таким email уже существует" }, { status: 409 });
    }
    throw error;
  }
}
