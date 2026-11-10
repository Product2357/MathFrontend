"use client";

import { useState, type FormEvent } from "react";

export type AdminStudent = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  access: { status: string; expiresAt: string | null } | null;
  courseIds: string[];
};

export type AdminCourseOption = { id: string; title: string; coverImage: string | null };

const fieldClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500";
const buttonClass = "rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50";

async function parseResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Не удалось выполнить запрос");
  return result as T;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Не выдан";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value));
}

export default function StudentManager({
  initialStudents,
  availableCourses,
}: {
  initialStudents: AdminStudent[];
  availableCourses: AdminCourseOption[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const result = await parseResponse<{ student: AdminStudent }>(await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
          days: Number(data.get("days")),
          amount: Number(data.get("amount")),
          currency: data.get("currency"),
        }),
      }));
      setStudents((current) => [result.student, ...current]);
      setNotice("Аккаунт создан, оплата записана, срок доступа активирован. Передайте клиенту email и пароль.");
      form.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось создать аккаунт");
    } finally {
      setSaving(false);
    }
  }

  async function extendAccess(event: FormEvent<HTMLFormElement>, studentId: string) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const result = await parseResponse<{ subscription: AdminStudent["access"] }>(
        await fetch(`/api/admin/students/${studentId}/access`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            days: Number(data.get("days")),
            amount: Number(data.get("amount")),
            currency: data.get("currency"),
          }),
        }),
      );
      setStudents((current) => current.map((student) => student.id === studentId
        ? { ...student, access: result.subscription }
        : student));
      setNotice("Оплата записана, срок доступа продлён.");
      form.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось продлить доступ");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>, studentId: string) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await parseResponse<{ ok: true }>(await fetch(`/api/admin/students/${studentId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.get("password") }),
      }));
      setNotice("Пароль обновлён, клиент выйдет из всех устройств. Передайте ему новый пароль.");
      form.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить пароль");
    } finally {
      setSaving(false);
    }
  }

  async function saveCourses(event: FormEvent<HTMLFormElement>, studentId: string) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    const formData = new FormData(event.currentTarget);
    const courseIds = formData.getAll("courseIds").map(String);

    try {
      const result = await parseResponse<{ courseIds: string[] }>(await fetch(`/api/admin/students/${studentId}/courses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds }),
      }));
      setStudents((current) => current.map((student) => student.id === studentId
        ? { ...student, courseIds: result.courseIds }
        : student));
      setNotice("Назначения курсов сохранены.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось назначить курсы");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <section className="border-t-2 border-slate-900 bg-white p-5 sm:p-6">
        <h2 className="mb-1 text-xl font-bold">Новый клиент</h2>
        <p className="mb-5 text-sm text-slate-600">Выдайте клиенту логин, пароль и срок доступа после подтверждения оплаты.</p>
        <form className="space-y-4" onSubmit={createStudent}>
          <label className="block text-sm font-medium">Имя
            <input name="name" required maxLength={80} className={`${fieldClass} mt-1.5`} />
          </label>
          <label className="block text-sm font-medium">Email
            <input name="email" type="email" required className={`${fieldClass} mt-1.5`} />
          </label>
          <label className="block text-sm font-medium">Временный пароль
            <input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className={`${fieldClass} mt-1.5`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">Дней доступа
              <input name="days" type="number" min={1} max={3650} required defaultValue={30} className={`${fieldClass} mt-1.5`} />
            </label>
            <label className="block text-sm font-medium">Сумма оплаты
              <input name="amount" type="number" min="0.01" step="0.01" required className={`${fieldClass} mt-1.5`} />
            </label>
          </div>
          <label className="block text-sm font-medium">Валюта
            <input name="currency" required minLength={3} maxLength={3} defaultValue="KZT" className={`${fieldClass} mt-1.5 uppercase`} />
          </label>
          <button type="submit" disabled={saving} className={`${buttonClass} w-full`}>
            {saving ? "Сохраняем..." : "Создать аккаунт и выдать доступ"}
          </button>
        </form>
      </section>

      <section className="border-t-2 border-slate-900 bg-white p-5 sm:p-6">
        <h2 className="mb-5 text-xl font-bold">Клиенты <span className="text-sm font-normal text-slate-500">{students.length}</span></h2>
        {error ? <p role="alert" className="mb-4 border-l-4 border-rose-500 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        {notice ? <p role="status" className="mb-4 border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
        <div className="divide-y divide-slate-200">
          {students.map((student) => {
            const expiresAt = student.access?.expiresAt ?? null;
            const active = student.access?.status === "ACTIVE" && expiresAt !== null && new Date(expiresAt) > new Date();

            return (
              <article key={student.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{student.name || student.email}</h3>
                    <p className="text-sm text-slate-600">{student.email}</p>
                    <p className={`mt-1 text-sm ${active ? "text-emerald-700" : "text-rose-700"}`}>
                      {active ? `Доступ до ${formatDate(expiresAt)}` : "Доступ не активен"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">Добавлен {formatDate(student.createdAt)}</span>
                </div>
                <form onSubmit={(event) => extendAccess(event, student.id)} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_0.75fr_auto]">
                  <input name="days" type="number" min={1} max={3650} required defaultValue={30} aria-label="Дней доступа" className={fieldClass} />
                  <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Сумма оплаты" aria-label="Сумма оплаты" className={fieldClass} />
                  <input name="currency" required minLength={3} maxLength={3} defaultValue="KZT" aria-label="Валюта" className={fieldClass} />
                  <button type="submit" disabled={saving} className={buttonClass}>Продлить</button>
                </form>
                <form onSubmit={(event) => resetPassword(event, student.id)} className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" placeholder="Новый пароль (от 10 символов)" aria-label="Новый пароль" className={fieldClass} />
                  <button type="submit" disabled={saving} className={buttonClass}>Сменить пароль</button>
                </form>
                <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Назначенные курсы ({student.courseIds.length})
                  </summary>
                  <form onSubmit={(event) => saveCourses(event, student.id)} className="mt-4 space-y-3">
                    {availableCourses.length ? availableCourses.map((course) => (
                      <label key={course.id} className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm">
                        <input
                          type="checkbox"
                          name="courseIds"
                          value={course.id}
                          defaultChecked={student.courseIds.includes(course.id)}
                          className="h-4 w-4 accent-sky-600"
                        />
                        <span>{course.title}</span>
                      </label>
                    )) : <p className="text-sm text-slate-500">Опубликуйте курс, чтобы назначить его клиенту.</p>}
                    <button type="submit" disabled={saving || availableCourses.length === 0} className={buttonClass}>
                      Сохранить курсы
                    </button>
                  </form>
                </details>
              </article>
            );
          })}
          {students.length === 0 ? <p className="py-4 text-sm text-slate-500">Клиентов пока нет.</p> : null}
        </div>
      </section>
    </div>
  );
}
