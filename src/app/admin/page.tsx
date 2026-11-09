import { adminMetrics, adminUsers } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Admin Panel</p>
          <h1 className="mt-2 text-4xl font-bold">Панель администратора</h1>
        </div>

        <div className="mb-10 grid gap-5 md:grid-cols-4">
          {adminMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-bold">Пользователи</h2>
          </div>

          <table className="min-w-full text-left">
            <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-6 py-4">Имя</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4">Активен</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.email} className="border-t border-slate-200 text-sm text-slate-700">
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 font-medium text-sky-700">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={user.active ? "text-emerald-600" : "text-rose-500"}>
                      {user.active ? "Да" : "Нет"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
