import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { courses } from "@/lib/mock-data";

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" aria-busy="true" />}>
      <CourseDetailContent params={params} />
    </Suspense>
  );
}

async function CourseDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = courses.find((item) => item.slug === slug);

  if (!course) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/courses"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться к курсам
        </Link>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className={`bg-gradient-to-r ${course.accent} p-8 text-white`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                  {course.level}
                </p>
                <h1 className="text-4xl font-bold">{course.title}</h1>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-sm text-white/80">Цена</p>
                <p className="text-2xl font-bold">${course.price}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-8 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-8">
              <section>
                <h2 className="mb-4 text-2xl font-bold">Описание курса</h2>
                <p className="text-base leading-7 text-slate-600">{course.description}</p>
              </section>

              <section>
                <h2 className="mb-5 text-2xl font-bold">Структура</h2>
                <div className="space-y-5">
                  {course.modules.map((module) => (
                    <div key={module.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="mb-4 text-lg font-semibold">{module.title}</h3>
                      <div className="space-y-3">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <PlayCircle className="h-5 w-5 text-sky-600" />
                              <div>
                                <p className="font-medium text-slate-800">{lesson.title}</p>
                                <p className="text-sm text-slate-500">{lesson.duration}</p>
                              </div>
                            </div>
                            {lesson.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                New
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-3 text-lg font-semibold">Что внутри</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>• Видеоуроки</li>
                  <li>• Интерактивные задания</li>
                  <li>• Графики Desmos</li>
                  <li>• AI-подсказки</li>
                  <li>• Тесты после уроков</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white">
                <p className="mb-2 text-sm text-slate-300">Материал урока</p>
                <p className="text-2xl font-bold">ax² + bx + c = 0</p>
                <p className="mt-3 text-sm text-slate-300">
                  Формула отображается в красивом виде с KaTeX и готова для объяснения на занятиях.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
