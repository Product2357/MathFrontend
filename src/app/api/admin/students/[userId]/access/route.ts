import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

const grantAccessSchema = z.object({
  days: z.number().int().min(1).max(3650),
  amount: z.number().finite().positive(),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = grantAccessSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Укажите корректные срок доступа и сумму оплаты" }, { status: 400 });
  }

  const { userId } = await context.params;
  const db = getDbClient();
  const student = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      subscriptions: {
        where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
        orderBy: { expiresAt: "desc" },
        take: 1,
        select: { expiresAt: true },
      },
    },
  });

  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
  }

  const now = new Date();
  const startsAt = student.subscriptions[0]?.expiresAt ?? now;
  const expiresAt = new Date(startsAt.getTime() + parsed.data.days * 24 * 60 * 60 * 1000);

  const [subscription] = await db.$transaction([
    db.subscription.create({
      data: {
        userId,
        status: "ACTIVE",
        planName: `manual_${parsed.data.days}_days`,
        startedAt: startsAt,
        purchasedAt: now,
        expiresAt,
      },
      select: { status: true, expiresAt: true },
    }),
    db.payment.create({
      data: {
        userId,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        status: "PAID",
      },
      select: { id: true },
    }),
  ]);

  return NextResponse.json({ subscription });
}
