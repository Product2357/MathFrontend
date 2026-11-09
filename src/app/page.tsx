import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { courses, pricing } from "@/lib/mock-data";

const features = [
  { icon: Video, title: "Видеоуроки", description: "Объяснения по шагам и понятные примеры в формате онлайн-курсов." },
  { icon: BookOpen, title: "Практические задания", description: "Тренировочные задачи с автоматической проверкой и подсказками." },
  { icon: TrendingUp, title: "Интерактивные графики", description: "Desmos-графики для визуализации функций и решений." },
  { icon: BrainCircuit, title: "AI-помощник", description: "Подсказки и разбор ошибок без выдачи готового решения." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 text-lg font-bold text-white">
              M
            </div>
            <div>
              <p className="text-lg font-bold">MathMentor AI</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link href="/courses" className="transition hover:text-slate-900">Курсы</Link>
            <Link href="/dashboard" className="transition hover:text-slate-900">Личный кабинет</Link>
            <Link href="/admin" className="transition hover:text-slate-900">Админ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
            >
              Войти
            </Link>
            <Link
              href="/courses"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Начать обучение
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_22%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700">
              <Sparkles className="h-4 w-4" />
              Подготовка к экзаменам по математике с AI
            </div>
            <h1 className="max-w-xl text-5xl font-black tracking-tight text-slate-900 md:text-6xl">
              Подготовка к экзаменам по математике с AI
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Видеоуроки, задачи, тесты и персональный анализ ошибок — всё в одном месте для уверенной подготовки.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-base font-medium text-white transition hover:bg-slate-800"
              >
                Начать обучение
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-base font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
              >
                Личный кабинет
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
            <div className="overflow-hidden rounded-[24px] bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 p-6 text-white">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/15 p-2 backdrop-blur-sm">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Current track</p>
                    <p className="font-semibold">Algebra Fundamentals</p>
                  </div>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  65% complete
                </span>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm text-white/80">Урок 4</p>
                <h2 className="mt-2 text-3xl font-bold">Решение линейных уравнений</h2>
                <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-[65%] rounded-full bg-white" />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/10 p-4 text-sm text-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  12 min lesson
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  8 tasks solved
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Преимущества</p>
          <h2 className="mt-3 text-4xl font-bold text-slate-900">Глубокое обучение без перегруза</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-violet-100 text-sky-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Courses</p>
              <h2 className="mt-3 text-4xl font-bold">Популярные курсы</h2>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-sky-700 transition hover:text-sky-800">
              Все курсы →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {courses.slice(0, 3).map((course) => (
              <article key={course.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className={`h-40 bg-gradient-to-br ${course.accent}`} />
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-bold">{course.title}</h3>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {course.level}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{course.lessonsCount} уроков</span>
                    <span className="text-lg font-bold text-slate-900">${course.price}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Тарифы</p>
          <h2 className="mt-3 text-4xl font-bold">Выберите удобный формат</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-8 shadow-sm ${plan.featured ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white"}`}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                {plan.featured && (
                  <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Popular
                  </span>
                )}
              </div>

              <div className="mb-6 flex items-end gap-1">
                <span className="text-4xl font-black">${plan.price}</span>
                <span className="pb-2 text-sm text-slate-500">/ month</span>
              </div>

              <p className="mb-5 text-sm leading-6 text-slate-600">{plan.description}</p>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Premium" ? "/courses" : "/auth/sign-in"}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition ${
                  plan.featured
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {plan.name === "Premium" ? "Выбрать Premium" : "Попробовать бесплатно"}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
