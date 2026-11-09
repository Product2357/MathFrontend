import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const progress = await getDbClient().lessonProgress.findMany({
    where: { userId: user.id },
    select: {
      lessonId: true,
      completed: true,
      progress: true,
      updatedAt: true,
      lesson: { select: { title: true, module: { select: { course: { select: { title: true, slug: true } } } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ progress });
}