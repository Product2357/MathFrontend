import Link from "next/link";
import { notFound } from "next/navigation";
import { getDbClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/session";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();

  const db = getDbClient();
  const [courseCount, studentCount, publishedCount] = await Promise.all([
    db.course.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.course.count({ where: { isPublished: true } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Private workspace</p>
        <h1 className="mt-2 text-4xl font-bold">Администрация</h1>
        <p className="mt-3 text-slate-600">Управляйте учебными материалами и доступом клиентов. Эта панель доступна только администраторам.</p>

        <div className="my-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Все курсы", value: courseCount },
            { label: "Опубликованные курсы", value: publishedCount },
            { label: "Клиенты", value: studentCount },
          ].map((item) => (
            <div key={item.label} className="border-t-2 border-slate-900 bg-white p-5">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/admin/courses" className="border border-slate-200 bg-white p-6 transition hover:border-sky-400">
            <h2 className="text-xl font-bold">Курсы и уроки</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Создавайте курсы, модули, уроки, задания и добавляйте внешние ссылки на видео.</p>
            <span className="mt-5 inline-block text-sm font-semibold text-sky-700">Открыть редактор →</span>
          </Link>
          <Link href="/admin/students" className="border border-slate-200 bg-white p-6 transition hover:border-sky-400">
            <h2 className="text-xl font-bold">Клиенты и доступ</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Создавайте клиентские аккаунты, фиксируйте оплаты и выдавайте доступ на выбранное число дней.</p>
            <span className="mt-5 inline-block text-sm font-semibold text-sky-700">Управлять доступом →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
