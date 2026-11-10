import { NextResponse } from "next/server";
import { getCurrentUser, hasActiveAccess } from "@/lib/server/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  const activeSubscription = user.subscriptions
    .filter((subscription) => subscription.status === "ACTIVE" && subscription.expiresAt && subscription.expiresAt > new Date())
    .sort((first, second) => (second.expiresAt?.getTime() ?? 0) - (first.expiresAt?.getTime() ?? 0))[0];
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      premium: hasActiveAccess(user),
      accessExpiresAt: activeSubscription?.expiresAt ?? null,
    },
  });
}
