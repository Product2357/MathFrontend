"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type AdminQuestion = { id: string; prompt: string; type: string };
type AdminLesson = { id: string; title: string; videoUrl: string | null; theory?: string | null; questions: AdminQuestion[] };
type AdminModule = { id: string; title: string; coverImage: string | null; lessons: AdminLesson[] };
export type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  level: string | null;
  price: number | null;
  isPublished: boolean;
  modules: AdminModule[];
};

const fieldClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500";
const buttonClass = "rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50";

function makeSlug(value: string) {
  const transliteration: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return value.toLowerCase().split("").map((character) => transliteration[character] ?? character).join("")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function getData<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Не удалось выполнить запрос");
  return data as T;
}

export default function CourseEditor({ initialCourses }: { initialCourses: AdminCourse[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [selectedId, setSelectedId] = useState(initialCourses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedCourse = courses.find((course) => course.id === selectedId) ?? null;

  const addCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const rawPrice = String(data.get("price") ?? "").trim();
    const price = rawPrice ? Number(rawPrice) : null;
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setError("Укажите корректную цену или оставьте поле пустым");
      return;
    }

    try {
      const result = await getData<{ course: AdminCourse }>(await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.get("title"), slug: data.get("slug"), description: data.get("description"), coverImage: data.get("coverImage") || null, level: data.get("level"), price }),
      }));
      setCourses((current) => [{ ...result.course, modules: [] }, ...current]);
      setSelectedId(result.course.id);
      setNotice("Черновик создан. Добавьте модули, уроки и задания.");
      form.reset();
      setTitle("");
      setSlug("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось создать курс");
    }
  };

  const addModule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourse) return;
    setError("");
    const form = event.currentTarget;
    try {
      const result = await getData<{ module: AdminModule }>(await fetch(`/api/admin/courses/${selectedCourse.id}/modules`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          title: new FormData(form).get("title"),
          coverImage: new FormData(form).get("coverImage") || null,
        }),
      }));
      setCourses((current) => current.map((course) => course.id === selectedCourse.id
        ? { ...course, modules: [...course.modules, { ...result.module, lessons: [] }] }
        : course));
      form.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось добавить модуль");
    }
  };

  const updateModule = async (event: FormEvent<HTMLFormElement>, moduleId: string) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);

    try {
      const result = await getData<{ module: Pick<AdminModule, "id" | "title" | "coverImage"> }>(
        await fetch(`/api/admin/modules/${moduleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: data.get("title"), coverImage: data.get("coverImage") || null }),
        }),
      );
      setCourses((current) => current.map((course) => ({
        ...course,
        modules: course.modules.map((module) => module.id === moduleId ? { ...module, ...result.module } : module),
      })));
      setNotice("Модуль сохранён.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить модуль");
    }
  };

  const addLesson = async (event: FormEvent<HTMLFormElement>, moduleId: string) => {
    event.preventDefault();
    if (!selectedCourse) return;
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const result = await getData<{ lesson: AdminLesson }>(await fetch(`/api/admin/modules/${moduleId}/lessons`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.get("title"), videoUrl: data.get("videoUrl"), theory: data.get("theory") }),
      }));
      setCourses((current) => current.map((course) => course.id === selectedCourse.id
        ? { ...course, modules: course.modules.map((module) => module.id === moduleId
          ? { ...module, lessons: [...module.lessons, { ...result.lesson, questions: [] }] }
          : module) }
        : course));
      form.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось добавить урок");
    }
  };

  const updateCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourse) return;
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    const rawPrice = String(data.get("price") ?? "").trim();
    const price = rawPrice ? Number(rawPrice) : null;
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setError("Укажите корректную цену или оставьте поле пустым");
      return;
    }

    try {
      const result = await getData<{ course: Omit<AdminCourse, "modules"> }>(await fetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          slug: data.get("slug"),
          description: data.get("description"),
          coverImage: data.get("coverImage") || null,
          level: data.get("level"),
          price,
        }),
      }));
      setCourses((current) => current.map((course) => course.id === selectedCourse.id
        ? { ...course, ...result.course }
        : course));
      setNotice("Данные курса сохранены.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить курс");
    }
  };

  const updateLesson = async (event: FormEvent<HTMLFormElement>, lessonId: string) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const result = await getData<{ lesson: Pick<AdminLesson, "id" | "title" | "videoUrl" | "theory"> }>(
        await fetch(`/api/admin/lessons/${lessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.get("title"),
            videoUrl: data.get("videoUrl") || null,
            theory: data.get("theory"),
          }),
        }),
      );
      setCourses((current) => current.map((course) => ({
        ...course,
        modules: course.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => lesson.id === lessonId
            ? { ...lesson, ...result.lesson }
            : lesson),
        })),
      })));
      setNotice("Урок сохранён.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить урок");
    }
  };

  const addQuestion = async (event: FormEvent<HTMLFormElement>, lessonId: string) => {
    event.preventDefault();
    if (!selectedCourse) return;
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const type = String(data.get("type"));
    const choices = String(data.get("choices") ?? "").split(/\n|,/).map((value) => value.trim()).filter(Boolean);
    const rawAnswer = String(data.get("correctAnswer") ?? "").trim();
    const correctAnswer = type === "NUMERIC" ? Number(rawAnswer) : rawAnswer;
    if (type === "NUMERIC" && !Number.isFinite(correctAnswer)) {
      setError("Укажите корректный числовой ответ");
      return;
    }

    try {
      const result = await getData<{ question: AdminQuestion }>(await fetch(`/api/admin/lessons/${lessonId}/questions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: data.get("prompt"), type, choices: type === "MULTIPLE_CHOICE" ? choices : undefined, correctAnswer }),
      }));
      setCourses((current) => current.map((course) => course.id === selectedCourse.id
        ? { ...course, modules: course.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => lesson.id === lessonId
            ? { ...lesson, questions: [...lesson.questions, result.question] }
            : lesson),
        })) }
        : course));
      form.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось добавить задание");
    }
  };

  const togglePublish = async () => {
    if (!selectedCourse) return;
    setError("");
    setNotice("");
    try {
      const result = await getData<{ course: { isPublished: boolean } }>(await fetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !selectedCourse.isPublished }),
      }));
      setCourses((current) => current.map((course) => course.id === selectedCourse.id
        ? { ...course, isPublished: result.course.isPublished }
        : course));
      setNotice(result.course.isPublished ? "Курс опубликован и доступен в каталоге." : "Курс снят с публикации.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось изменить публикацию");
    }
  };

  if (error === "Требуется вход" || error === "Недостаточно прав") {
    return <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900"><div className="mx-auto max-w-xl border-l-4 border-amber-500 bg-white p-6"><h1 className="text-2xl font-bold">Нет доступа к редактору</h1><p className="mt-3 text-slate-600">Войдите под аккаунтом ADMIN. Назначить роль можно из терминала: <code className="rounded bg-slate-100 px-1">npm run db:make-admin -- ваш-email</code>.</p><Link href="/auth/sign-in" className="mt-5 inline-block font-semibold text-sky-700">Перейти ко входу</Link></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-700">← Назад в администрацию</Link><p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Admin / Content</p><h1 className="mt-2 text-3xl font-bold">Курсы</h1></div><Link href="/courses" className="text-sm font-medium text-slate-600 hover:text-sky-700">Открыть каталог</Link></header>
        {error ? <p role="alert" className="mb-5 border-l-4 border-rose-500 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        {notice ? <p role="status" className="mb-5 border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}

        <div className="grid items-start gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-8">
            <section className="border-t-2 border-slate-900 bg-white p-5"><h2 className="mb-4 text-lg font-bold">Новый черновик</h2>
              <form className="space-y-4" onSubmit={addCourse}>
                <label className="block text-sm font-medium">Название<input name="title" required minLength={2} maxLength={120} value={title} onChange={(event) => { setTitle(event.target.value); setSlug(makeSlug(event.target.value)); }} className={`${fieldClass} mt-1.5`} placeholder="Например, Алгебра" /></label>
                <label className="block text-sm font-medium">Адрес курса<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} value={slug} onChange={(event) => setSlug(event.target.value)} className={`${fieldClass} mt-1.5`} placeholder="algebra-basics" /></label>
                <label className="block text-sm font-medium">Описание<textarea name="description" maxLength={4000} className={`${fieldClass} mt-1.5 min-h-24`} placeholder="Для кого курс и чему он научит" /></label>
                <label className="block text-sm font-medium">Ссылка на обложку курса<input name="coverImage" type="url" className={`${fieldClass} mt-1.5`} placeholder="https://..." /></label>
                <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Цена<input name="price" type="number" min="0" step="0.01" className={`${fieldClass} mt-1.5`} placeholder="Бесплатно" /></label><label className="block text-sm font-medium">Уровень<select name="level" className={`${fieldClass} mt-1.5`}><option value="Beginner">Начальный</option><option value="Intermediate">Средний</option><option value="Advanced">Продвинутый</option></select></label></div>
                <button type="submit" className={`${buttonClass} w-full`}>Создать черновик</button>
              </form>
            </section>
            <section><h2 className="mb-3 text-lg font-bold">Все курсы <span className="text-sm font-normal text-slate-500">{courses.length}</span></h2><div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
              {courses.map((course) => { const lessonCount = course.modules.reduce((total, module) => total + module.lessons.length, 0); return <button key={course.id} type="button" onClick={() => setSelectedId(course.id)} className={`flex w-full items-start justify-between gap-3 p-4 text-left ${selectedId === course.id ? "bg-sky-50" : "hover:bg-slate-50"}`}><span><span className="block font-semibold">{course.title}</span><span className="mt-1 block text-xs text-slate-500">{course.slug} · {course.modules.length} мод. · {lessonCount} ур.</span></span><span className={`shrink-0 text-xs font-semibold ${course.isPublished ? "text-emerald-700" : "text-amber-700"}`}>{course.isPublished ? "Опубликован" : "Черновик"}</span></button>; })}
              {courses.length === 0 ? <p className="p-4 text-sm text-slate-500">Курсов пока нет.</p> : null}
            </div></section>
          </div>

          <section className="min-w-0 border-t-2 border-slate-900 bg-white p-5 sm:p-7">{selectedCourse ? <>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{selectedCourse.slug}</p><h2 className="mt-1 text-2xl font-bold">{selectedCourse.title}</h2></div><button type="button" onClick={togglePublish} className={buttonClass}>{selectedCourse.isPublished ? "Снять с публикации" : "Опубликовать"}</button></div>
            <form key={selectedCourse.id} onSubmit={updateCourse} className="my-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Название<input name="title" required minLength={2} maxLength={120} defaultValue={selectedCourse.title} className={`${fieldClass} mt-1.5`} /></label>
              <label className="text-sm font-medium">Адрес<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} defaultValue={selectedCourse.slug} className={`${fieldClass} mt-1.5`} /></label>
              <label className="text-sm font-medium sm:col-span-2">Описание<textarea name="description" maxLength={4000} defaultValue={selectedCourse.description ?? ""} className={`${fieldClass} mt-1.5 min-h-20`} /></label>
              <label className="text-sm font-medium sm:col-span-2">Ссылка на обложку курса<input name="coverImage" type="url" defaultValue={selectedCourse.coverImage ?? ""} className={`${fieldClass} mt-1.5`} placeholder="https://..." /></label>
              <label className="text-sm font-medium">Цена<input name="price" type="number" min="0" step="0.01" defaultValue={selectedCourse.price ?? ""} className={`${fieldClass} mt-1.5`} /></label>
              <label className="text-sm font-medium">Уровень<select name="level" defaultValue={selectedCourse.level ?? "Beginner"} className={`${fieldClass} mt-1.5`}><option value="Beginner">Начальный</option><option value="Intermediate">Средний</option><option value="Advanced">Продвинутый</option></select></label>
              <button type="submit" className={`${buttonClass} justify-self-start`}>Сохранить курс</button>
            </form>
            <form onSubmit={addModule} className="my-6 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]"><input name="title" required minLength={2} maxLength={160} className={fieldClass} placeholder="Название нового модуля" /><input name="coverImage" type="url" className={fieldClass} placeholder="Ссылка на обложку модуля (опционально)" /><button type="submit" className={buttonClass}>Добавить модуль</button></form>
            <div className="space-y-6">{selectedCourse.modules.map((module) => <section key={module.id} className="border-l-2 border-slate-300 pl-4 sm:pl-5">
              <form onSubmit={(event) => updateModule(event, module.id)} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1.5fr_auto]">
                <input name="title" required minLength={2} maxLength={160} defaultValue={module.title} className={fieldClass} aria-label="Название модуля" />
                <input name="coverImage" type="url" defaultValue={module.coverImage ?? ""} className={fieldClass} placeholder="Ссылка на обложку модуля" aria-label="Обложка модуля" />
                <button type="submit" className={buttonClass}>Сохранить модуль</button>
              </form>
              {module.coverImage ? <div className="my-3 h-28 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url("${module.coverImage}")` }} aria-label={`Обложка модуля ${module.title}`} role="img" /> : null}
              <form onSubmit={(event) => addLesson(event, module.id)} className="my-4 grid gap-3 rounded-xl bg-slate-50 p-4"><input name="title" required minLength={2} maxLength={160} className={fieldClass} placeholder="Название урока" /><input name="videoUrl" type="url" className={fieldClass} placeholder="Ссылка на YouTube или прямой URL видео (GCS)" /><textarea name="theory" maxLength={12000} className={`${fieldClass} min-h-20`} placeholder="Теория или конспект урока" /><button type="submit" className={`${buttonClass} justify-self-start`}>Добавить урок</button></form>
              <div className="space-y-4">{module.lessons.map((lesson) => <article key={lesson.id} className="border-t border-slate-200 pt-4"><h4 className="font-semibold">{lesson.title}</h4><p className="mt-1 text-xs text-slate-500">{lesson.videoUrl ? "Видео добавлено" : "Без видео"} · {lesson.questions.length} заданий</p>
                <form onSubmit={(event) => updateLesson(event, lesson.id)} className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4">
                  <input name="title" required minLength={2} maxLength={160} defaultValue={lesson.title} className={fieldClass} aria-label="Название урока" />
                  <input name="videoUrl" type="url" defaultValue={lesson.videoUrl ?? ""} className={fieldClass} aria-label="Ссылка на видео" placeholder="YouTube или прямой URL видео (GCS)" />
                  <textarea name="theory" maxLength={12000} defaultValue={lesson.theory ?? ""} className={`${fieldClass} min-h-20`} aria-label="Теория урока" placeholder="Теория или конспект урока" />
                  <button type="submit" className={`${buttonClass} justify-self-start`}>Сохранить урок</button>
                </form>
                <form onSubmit={(event) => addQuestion(event, lesson.id)} className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><input name="prompt" required minLength={3} maxLength={2000} className={`${fieldClass} sm:col-span-2`} placeholder="Текст задания" /><select name="type" className={fieldClass}><option value="MULTIPLE_CHOICE">Выбор ответа</option><option value="NUMERIC">Числовой ответ</option><option value="FORMULA">Формула</option></select><input name="correctAnswer" required className={fieldClass} placeholder="Правильный ответ" /><textarea name="choices" className={`${fieldClass} sm:col-span-2`} placeholder="Варианты ответа, по одному в строке" /><button type="submit" className={`${buttonClass} justify-self-start`}>Добавить задание</button></form>
                {lesson.questions.length ? <ul className="mt-3 space-y-1 text-sm text-slate-600">{lesson.questions.map((question) => <li key={question.id}>{question.prompt}</li>)}</ul> : null}
              </article>)}</div>
            </section>)}{selectedCourse.modules.length === 0 ? <p className="text-sm text-slate-500">Добавьте первый модуль, чтобы собрать программу курса.</p> : null}</div>
          </> : <div className="py-12 text-center text-sm text-slate-500">Создайте курс или выберите его из списка.</div>}</section>
        </div>
      </div>
    </main>
  );
}
