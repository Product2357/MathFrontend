import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const db = getDbClient();
  const [users, students, courses, publishedCourses, lessons, activeEnrollments, payments] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.course.count(),
    db.course.count({ where: { isPublished: true } }),
    db.lesson.count(),
    db.enrollment.count({ where: { status: "ACTIVE", course: { isPublished: true } } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    metrics: { users, students, courses, publishedCourses, lessons, activeEnrollments },
    payments: { totalPaid: payments._sum.amount?.toString() ?? "0" },
  });
}
