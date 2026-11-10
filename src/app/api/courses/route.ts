import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { getCurrentUser, hasActiveAccess } from "@/lib/server/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  if (!hasActiveAccess(user)) {
    return NextResponse.json({ error: "Срок доступа закончился. Обратитесь к администратору." }, { status: 403 });
  }

  const backendURL = process.env.GO_BACKEND_URL ?? "http://localhost:8080";
  const backendToken = process.env.GO_BACKEND_API_TOKEN;
  if (!backendToken) {
    return NextResponse.json({ error: "Course backend authentication is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`${backendURL}/api/v1/courses`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${backendToken}` },
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Go backend could not load courses" }, { status: 502 });
    }
    const data = await response.json() as { courses: { id: string }[] };
    if (user.role === "ADMIN") return NextResponse.json(data);

    const enrollments = await getDbClient().enrollment.findMany({
      where: { userId: user.id, status: "ACTIVE", course: { isPublished: true } },
      select: { courseId: true },
    });
    const assignedCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId));
    return NextResponse.json({
      courses: data.courses.filter((course) => assignedCourseIds.has(course.id)),
    });
  } catch {
    return NextResponse.json({ error: "Go backend is unavailable" }, { status: 503 });
  }
}
