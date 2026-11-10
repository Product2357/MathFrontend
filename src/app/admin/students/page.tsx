import { notFound } from "next/navigation";
import Link from "next/link";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/session";
import StudentManager, { type AdminCourseOption, type AdminStudent } from "./student-manager";

export default async function AdminStudentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();

  const db = getDbClient();
  const [users, availableCourses] = await Promise.all([
    db.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      subscriptions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { status: true, expiresAt: true },
      },
      enrollments: {
        where: { status: "ACTIVE", course: { isPublished: true } },
        select: { courseId: true },
      },
    },
    }),
    db.course.findMany({
      where: { isPublished: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true, coverImage: true },
    }),
  ]);

  const students: AdminStudent[] = users.map((student) => ({
    ...student,
    createdAt: student.createdAt.toISOString(),
    access: student.subscriptions[0]
      ? {
          status: student.subscriptions[0].status,
          expiresAt: student.subscriptions[0].expiresAt?.toISOString() ?? null,
        }
      : null,
    courseIds: student.enrollments.map((enrollment) => enrollment.courseId),
  }));
  const courses: AdminCourseOption[] = availableCourses;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-sky-700">← Админ-панель</Link>
        <header className="mb-8 mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Admin / Access</p>
          <h1 className="mt-2 text-3xl font-bold">Клиенты и доступ</h1>
          <p className="mt-2 text-slate-600">Создайте аккаунт после получения оплаты или продлите доступ существующему клиенту.</p>
        </header>
        <StudentManager initialStudents={students} availableCourses={courses} />
      </div>
    </main>
  );
}
