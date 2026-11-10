import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { getDbClient } from "@/lib/db";
import { getCurrentUser, hasActiveAccess } from "@/lib/server/session";
import { hasCourseAccess } from "@/lib/server/course-access";

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" aria-busy="true" />}>
      <CourseDetailContent params={params} />
    </Suspense>
  );
}

async function CourseDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  if (!hasActiveAccess(user)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold">Доступ закончился</h1>
          <p className="mt-3 text-slate-600">Чтобы продолжить обучение, свяжитесь с администратором.</p>
        </div>
      </main>
    );
  }

  const { slug } = await params;
  const course = await getDbClient().course.findUnique({
    where: { slug, isPublished: true },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              questions: { select: { id: true } },
              progresses: { where: { userId: user.id }, select: { completed: true } },
            },
          },
        },
      },
    },
  });

  if (!course || !await hasCourseAccess(user.id, user.role, course.id)) notFound();

  const allLessons = course.modules.flatMap((module) => module.lessons);
  const completedLessons = allLessons.filter((lesson) => lesson.progresses.some((progress) => progress.completed)).length;
  const coursePercent = allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0;
  const nextLesson = allLessons.find((lesson) => !lesson.progresses.some((progress) => progress.completed));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div
            className="bg-cover bg-center p-8 text-white sm:p-10"
            style={{
              backgroundImage: course.coverImage
                ? `linear-gradient(90deg, rgba(15, 23, 42, .82), rgba(15, 23, 42, .3)), url("${course.coverImage}")`
                : "linear-gradient(110deg, #0284c7, #0f766e)",
            }}
          >
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">{course.level ?? "Все уровни"}</p>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="text-4xl font-bold">{course.title}</h1>
                <p className="mt-3 max-w-2xl leading-7 text-white/85">{course.description || "Ваш учебный курс."}</p>
              </div>
              {nextLesson ? (
                <Link href={`/courses/${course.slug}/${nextLesson.id}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-sky-50">
                  {completedLessons ? "Продолжить" : "Начать обучение"} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <section className="mb-8 rounded-2xl border border-sky-100 bg-sky-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-56 flex-1">
                  <div className="flex items-center justify-between gap-3 text-sm font-medium text-sky-900">
                    <span>Ваш прогресс</span>
                    <span>{completedLessons} из {allLessons.length} уроков · {coursePercent}%</span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${coursePercent}%` }} />
                  </div>
                </div>
                {allLessons.length > 0 && coursePercent === 100 ? <span className="font-semibold text-emerald-700">Курс пройден!</span> : null}
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section>
                <h2 className="mb-5 text-2xl font-bold">Программа курса</h2>
                <div className="space-y-5">
                  {course.modules.map((module, moduleIndex) => (
                    <section key={module.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {module.coverImage ? (
                        <div
                          className="h-36 bg-cover bg-center"
                          style={{ backgroundImage: `url("${module.coverImage}")` }}
                          role="img"
                          aria-label={`Обложка модуля ${module.title}`}
                        />
                      ) : null}
                      <div className="p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Модуль {moduleIndex + 1}</p>
                        <h3 className="mb-4 mt-1 text-lg font-bold">{module.title}</h3>
                        <div className="space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => {
                            const completed = lesson.progresses.some((progress) => progress.completed);
                            return (
                              <Link
                                key={lesson.id}
                                href={`/courses/${course.slug}/${lesson.id}`}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-sky-300 hover:shadow-sm"
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  {completed ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <PlayCircle className="h-5 w-5 shrink-0 text-sky-600" />}
                                  <span className="min-w-0">
                                    <span className="block truncate font-medium text-slate-800">{lessonIndex + 1}. {lesson.title}</span>
                                    <span className="block text-xs text-slate-500">{lesson.questions.length} заданий{completed ? " · Пройден" : ""}</span>
                                  </span>
                                </span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                              </Link>
                            );
                          })}
                          {!module.lessons.length ? <p className="text-sm text-slate-500">Уроки скоро появятся.</p> : null}
                        </div>
                      </div>
                    </section>
                  ))}
                  {!course.modules.length ? <p className="text-sm text-slate-500">Программа курса скоро появится.</p> : null}
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-bold">В этом курсе</h3>
                  <p className="mt-3 text-sm text-slate-600">{course.modules.length} модулей</p>
                  <p className="mt-1 text-sm text-slate-600">{allLessons.length} уроков</p>
                  <p className="mt-1 text-sm text-slate-600">{allLessons.reduce((total, lesson) => total + lesson.questions.length, 0)} практических заданий</p>
                </div>
                {nextLesson ? (
                  <Link href={`/courses/${course.slug}/${nextLesson.id}`} className="flex items-center justify-between rounded-2xl bg-slate-900 p-5 text-white hover:bg-slate-800">
                    <span><span className="block text-sm text-slate-300">Следующий урок</span><span className="mt-1 block font-semibold">{nextLesson.title}</span></span>
                    <ArrowRight className="h-5 w-5 shrink-0" />
                  </Link>
                ) : null}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
