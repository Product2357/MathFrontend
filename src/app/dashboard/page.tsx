"use client";

import { useEffect, useState } from "react";
import { progressData } from "@/lib/mock-data";

type DashboardUser = {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "ADMIN";
  premium: boolean;
};

type ProgressEntry = {
  lessonId: string;
  completed: boolean;
  progress: number;
  lesson: { title: string; module: { course: { title: string; slug: string } } };
};

export default function DashboardPage() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([
      fetch("/api/auth/session").then((response) => response.ok ? response.json() : null),
      fetch("/api/progress").then((response) => response.ok ? response.json() : null),
    ]).then(([session, progressResult]) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setProgress(progressResult?.progress ?? []);
      setLoading(false);
    });

    return () => { active = false; };
  }, []);

  if (loading) {
    return <main className="min-h-screen bg-slate-50" aria-busy="true" />;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold">Войдите в систему</h1>
          <p className="mt-3 text-slate-600">Чтобы увидеть кабинет, зарегистрируйтесь или войдите в аккаунт.</p>
        </div>
      </main>
    );
  }

  const completedLessons = progress.filter((entry) => entry.completed).length;
  const courseProgress = progressData.map((course) => {
    const entries = progress.filter((entry) => entry.lesson.module.course.title === course.title);
    return {
      ...course,
      progress: entries.length
        ? Math.round(entries.reduce((total, entry) => total + entry.progress, 0) / entries.length)
        : 0,
    };
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
              My Learning
            </p>
            <h1 className="mt-2 text-4xl font-bold">Личный кабинет студента</h1>
          </div>

          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/sign-out", { method: "POST" });
              setUser(null);
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
          >
            Выйти
          </button>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Аккаунт</p>
          <h2 className="mt-2 text-2xl font-bold">{user.name ?? user.email}</h2>
          <p className="text-slate-600">{user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {courseProgress.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <span className="text-sm font-medium text-slate-500">{item.progress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold">Последние активности</h2>
            <div className="space-y-4">
              {progress.length ? progress.slice(0, 4).map((entry) => (
                <div key={entry.lessonId} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  {entry.lesson.module.course.title}: {entry.lesson.title} · {entry.progress}%
                </div>
              )) : (
                <p className="text-sm text-slate-500">Здесь появится прогресс после первого задания.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Progress</p>
            <h2 className="mt-3 text-4xl font-bold">{Math.min(100, completedLessons * 25)}%</h2>
            <p className="mt-2 text-sm text-slate-300">Средний уровень завершения курсов за текущий месяц.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
