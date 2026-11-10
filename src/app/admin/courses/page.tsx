import { Suspense } from "react";
import { notFound } from "next/navigation";
import CourseEditor from "./course-editor";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/session";

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" aria-busy="true" />}>
      <AdminCoursesContent />
    </Suspense>
  );
}

async function AdminCoursesContent() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    notFound();
  }

  const courses = await getDbClient().course.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      level: true,
      price: true,
      isPublished: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          coverImage: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              videoUrl: true,
              theory: true,
              questions: { orderBy: { createdAt: "asc" }, select: { id: true, prompt: true, type: true } },
            },
          },
        },
      },
    },
  });

  return <CourseEditor initialCourses={courses} />;
}
