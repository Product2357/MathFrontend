import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/session";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Требуется вход" }, { status: 401 }) };
  }

  if (user.role !== "ADMIN") {
    return { user: null, response: NextResponse.json({ error: "Недостаточно прав" }, { status: 403 }) };
  }

  return { user, response: null };
}