"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, Clock3, Trophy } from "lucide-react";

type DashboardUser = {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "ADMIN";
  premium: boolean;
  accessExpiresAt: string | null;
};

type DashboardCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  modules: {
    id: string;
    title: string;
    coverImage: string | null;
    lessons: {
      id: string;
      title: string;
      progresses: { completed: boolean; progress: number }[];
    }[];
  }[];
};

type Activity = {
  id: string;
  kind: "LESSON_PROGRESS" | "QUIZ_ATTEMPT";
  title: string;
  courseTitle: string;
  date: string;
  progress?: number;
  completed?: boolean;
  score?: number;
  total?: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value));
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    void Promise.all([
      fetch("/api/auth/session").then((response) => response.ok ? response.json() : null),
      fetch("/api/progress").then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Не удалось загрузить кабинет");
        return result;
      }),
    ]).then(([session, learning]) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setCourses(learning.courses);
      setActivity(learning.activity);
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Не удалось загрузить кабинет");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  if (loading) return <main className="min-h-screen bg-slate-50" aria-busy="true" />;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold">Войдите в систему</h1>
          <p className="mt-3 text-slate-600">Войдите в аккаунт, который выдал администратор.</p>
          <Link href="/auth/sign-in" className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Перейти ко входу</Link>
        </div>
      </main>
    );
  }

  const allLessons = courses.flatMap((course) => course.modules.flatMap((module) => module.lessons.map((lesson) => ({
    ...lesson,
    slug: course.slug,
  }))));
  const completedLessons = allLessons.filter((lesson) => lesson.progresses.some((progress) => progress.completed)).length;
  const coursePercent = allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0;
  const nextLesson = allLessons.find((lesson) => !lesson.progresses.some((progress) => progress.completed));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Моё обучение</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Здравствуйте, {user.name || "ученик"}!</h1>
            <p className="mt-2 text-slate-600">Продолжайте с того места, где остановились.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/sign-out", { method: "POST" });
              router.replace("/auth/sign-in");
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300"
          >
            Выйти
          </button>
        </header>

        {loadError ? <p role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}</p> : null}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <span className="rounded-xl bg-sky-50 p-3 text-sky-700"><BookOpenCheck className="h-5 w-5" /></span>
            <div><p className="text-sm text-slate-500">Мои курсы</p><p className="text-2xl font-bold">{courses.length}</p></div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Trophy className="h-5 w-5" /></span>
            <div><p className="text-sm text-slate-500">Пройдено уроков</p><p className="text-2xl font-bold">{completedLessons} / {allLessons.length}</p></div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <span className="rounded-xl bg-violet-50 p-3 text-violet-700"><Clock3 className="h-5 w-5" /></span>
            <div>
              <p className="text-sm text-slate-500">Доступ до</p>
              <p className="text-lg font-bold">{user.premium && user.accessExpiresAt ? formatDate(user.accessExpiresAt) : "Не активен"}</p>
            </div>
          </div>
        </section>

        {user.premium && nextLesson ? (
          <Link
            href={`/courses/${nextLesson.slug}/${nextLesson.id}`}
            className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-slate-900 px-6 py-6 text-white transition hover:bg-slate-800 sm:px-8"
          >
            <span>
              <span className="block text-sm font-medium text-slate-300">Следующий урок</span>
              <span className="mt-1 block text-xl font-bold">{nextLesson.title}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900">
              Продолжить <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ) : null}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">Ваш учебный план</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Назначенные курсы</h2>
            </div>
            {courses.length ? <span className="text-sm text-slate-500">{coursePercent}% общего прогресса</span> : null}
          </div>

          {courses.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => {
                const lessons = course.modules.flatMap((module) => module.lessons);
                const completed = lessons.filter((lesson) => lesson.progresses.some((progress) => progress.completed)).length;
                const percent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
                const firstIncomplete = course.modules.flatMap((module) => module.lessons)
                  .find((lesson) => !lesson.progresses.some((progress) => progress.completed));

                return (
                  <article key={course.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div
                      className="flex h-40 items-end justify-between bg-cover bg-center p-5 text-white"
                      style={{
                        backgroundImage: course.coverImage
                          ? `linear-gradient(0deg, rgba(15, 23, 42, .78), rgba(15, 23, 42, .05)), url("${course.coverImage}")`
                          : "linear-gradient(135deg, #0284c7, #7c3aed)",
                      }}
                    >
                      <div><p className="text-sm text-white/80">{course.modules.length} модулей · {lessons.length} уроков</p><h3 className="mt-1 text-2xl font-bold">{course.title}</h3></div>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">{percent}%</span>
                    </div>
                    <div className="p-5">
                      <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{course.description || "Ваш курс готов к изучению."}</p>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <Link
                        href={firstIncomplete ? `/courses/${course.slug}/${firstIncomplete.id}` : `/courses/${course.slug}`}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        {percent === 100 ? "Повторить курс" : percent ? "Продолжить курс" : "Начать курс"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="text-xl font-bold">Курсы пока не назначены</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Администратор добавит ваши курсы в личный кабинет. Если вы уже оплатили обучение, обратитесь к администратору платформы.</p>
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">Последняя активность</h2>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5">
            {activity.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{item.kind === "QUIZ_ATTEMPT" ? "Проверка заданий" : item.completed ? "Урок завершён" : "Прогресс урока"}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.courseTitle} · {item.title}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{item.kind === "QUIZ_ATTEMPT" ? `Результат ${item.score}% (${item.total} заданий)` : `${item.progress}%`}</p>
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                </div>
              </div>
            ))}
            {!activity.length ? <p className="py-6 text-sm text-slate-500">Активность появится после начала первого урока.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
