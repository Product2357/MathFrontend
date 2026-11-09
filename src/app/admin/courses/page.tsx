import { Sparkles } from "lucide-react";

const coursesDraft = [
  { title: "Алгебра", lessons: 18, status: "Published" },
  { title: "Геометрия", lessons: 15, status: "Draft" },
  { title: "SAT Math", lessons: 27, status: "Published" },
];

export default function AdminCoursesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Admin</p>
            <h1 className="mt-2 text-4xl font-bold">Управление курсами</h1>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
            <Sparkles className="h-4 w-4" />
            Создать курс
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold">Новый курс</h2>
            <form className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Название</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white" placeholder="Например: Алгебра" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Описание</label>
                <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white" placeholder="Описание курса" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Цена</label>
                  <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white" placeholder="$49" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Уровень</label>
                  <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>

              <button className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-700">
                Сохранить курс
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold">Список курсов</h2>
            <div className="space-y-4">
              {coursesDraft.map((course) => (
                <div key={course.title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-lg font-semibold">{course.title}</p>
                    <p className="text-sm text-slate-500">{course.lessons} уроков</p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                    {course.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
