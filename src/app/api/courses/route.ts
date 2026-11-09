import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export async function GET() {
  const courses = await getDbClient().course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      level: true,
      price: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, order: true, videoUrl: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ courses });
}
