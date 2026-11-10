import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 MathMentor AI</p>
        <div className="flex items-center gap-6">
          <Link href="/courses" className="hover:text-slate-700">Курсы</Link>
          <Link href="/dashboard" className="hover:text-slate-700">Личный кабинет</Link>
        </div>
      </div>
    </footer>
  );
}
