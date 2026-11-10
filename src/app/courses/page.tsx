"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";

type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  level: string | null;
  price: number | null;
  modules: { id: string; lessons: { id: string }[] }[];
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    void fetch("/api/courses")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Не удалось загрузить курсы");
        return result;
      })
      .then((result) => {
        if (active) setCourses(result.courses);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Не удалось загрузить ваши курсы.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
              Catalog
            </p>
            <h1 className="text-4xl font-bold tracking-tight">Каталог курсов</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            На главную
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const lessonsCount = course.modules.reduce((total, module) => total + module.lessons.length, 0);

            return (
            <article
              key={course.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="h-40 bg-cover bg-center"
                style={{
                  backgroundImage: course.coverImage
                    ? `linear-gradient(0deg, rgba(15, 23, 42, .65), rgba(15, 23, 42, .05)), url("${course.coverImage}")`
                    : "linear-gradient(135deg, #0284c7, #7c3aed)",
                }}
              >
                <div className="flex h-full items-end justify-between p-5 text-white">
                  <GraduationCap className="h-10 w-10 opacity-90" />
                  <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    {course.level ?? "Все уровни"}
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{course.title}</h2>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {lessonsCount} уроков
                  </span>
                </div>

                <p className="text-sm leading-6 text-slate-600">{course.description ?? "Описание скоро появится."}</p>

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {course.modules.length} модулей
                  </div>
                  <span className="text-lg font-bold text-slate-900">{course.price === null ? "Бесплатно" : `$${course.price}`}</span>
                </div>

                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Перейти к курсу
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
            );
          })}
          {!loading && courses.length === 0 ? (
            <div className="text-sm text-slate-600">
              <p>{loadError || "Администратор пока не назначил вам курсы."}</p>
              {loadError.includes("вход") ? <Link href="/auth/sign-in" className="mt-2 inline-block font-semibold text-sky-700">Перейти ко входу →</Link> : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
