import Link from "next/link";

export function SiteHeader() {
  return (
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
  );
}
