import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  const premium = user.subscriptions.some((subscription) => subscription.status === "ACTIVE");
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      premium,
    },
  });
}
