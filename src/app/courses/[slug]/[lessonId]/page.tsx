"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BrainCircuit, CheckCircle2 } from "lucide-react";

type LessonQuestion = {
  id: string;
  prompt: string;
  type: "MULTIPLE_CHOICE" | "NUMERIC" | "FORMULA";
  choices: string[];
};

type LessonContent = {
  id: string;
  title: string;
  videoUrl: string | null;
  theory: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
    lessonNumber: number;
    totalLessons: number;
    previousLesson: { id: string; title: string } | null;
    nextLesson: { id: string; title: string } | null;
  };
  progress: { completed: boolean; progress: number };
  questions: LessonQuestion[];
};

function getYouTubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    let videoId: string | null = null;
    if (url.hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(url.hostname)) {
      videoId = url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")
          ? url.pathname.split("/")[2] ?? null
          : null;
    }

    return videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{ slug: string; lessonId: string } | null>(null);
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; completed: boolean } | null>(null);
  const [markedComplete, setMarkedComplete] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let active = true;
    void params
      .then(async (routeParams) => {
        setResolvedParams(routeParams);
        const response = await fetch(`/api/lessons/${routeParams.lessonId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Не удалось загрузить урок");
        if (data.lesson.course.slug !== routeParams.slug) throw new Error("Урок не принадлежит этому курсу");
        if (!active) return;
        setLesson(data.lesson);
        setAnswers({});
        setResult(null);
        setMarkedComplete(data.lesson.progress.completed);
      })
      .catch((requestError: Error) => { if (active) setLoadError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [params]);

  if (loading) return <main className="min-h-screen bg-slate-50" aria-busy="true" />;
  if (loadError || !resolvedParams || !lesson) {
    return <main className="min-h-screen bg-slate-50 px-6 py-16 text-center text-slate-700">{loadError || "Урок не найден"}</main>;
  }

  const checkAnswers = async () => {
    setChecking(true);
    setSubmissionError("");

    try {
      const response = await fetch(`/api/lessons/${lesson.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSubmissionError(data.error ?? "Не удалось проверить ответы");
        return;
      }

      setResult({ score: data.attempt.score, total: data.attempt.total, completed: data.completed });
    } catch {
      setSubmissionError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setChecking(false);
    }
  };

  const markLessonComplete = async () => {
    setChecking(true);
    setSubmissionError("");
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/complete`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Не удалось завершить урок");
      setMarkedComplete(true);
    } catch (requestError) {
      setSubmissionError(requestError instanceof Error ? requestError.message : "Не удалось завершить урок");
    } finally {
      setChecking(false);
    }
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href={`/courses/${resolvedParams.slug}`}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться к курсу
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm text-slate-500">Урок {lesson.course.lessonNumber} из {lesson.course.totalLessons}</p>
            <p className="font-semibold">{lesson.course.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {lesson.course.previousLesson ? <Link href={`/courses/${resolvedParams.slug}/${lesson.course.previousLesson.id}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:border-sky-300">← Назад</Link> : null}
            <span className="rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">{lesson.progress.completed ? "Урок пройден" : `${lesson.progress.progress}%`}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-sky-500 to-violet-600 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">{lesson.course.title}</p>
                <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
              </div>

              <div className="p-6">
                {lesson.videoUrl ? (
                  getYouTubeEmbedUrl(lesson.videoUrl) ? (
                    <iframe
                      className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-950"
                      src={getYouTubeEmbedUrl(lesson.videoUrl) ?? undefined}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <video controls preload="metadata" className="w-full rounded-2xl border border-slate-200 bg-slate-950" src={lesson.videoUrl} />
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">Видео для этого урока пока не добавлено.</div>
                )}

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <h2 className="mb-3 text-xl font-bold">Теория</h2>
                  <p className="whitespace-pre-wrap text-base leading-7 text-slate-600">{lesson.theory || "Материалы урока скоро появятся."}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">Практика</h2>
              <div className="space-y-5">
                {lesson.questions.map((question, index) => {
                  const choices = question.choices ?? [];

                  return (
                    <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="mb-4 font-medium text-slate-800">
                        {index + 1}. {question.prompt}
                      </p>

                      {question.type === "MULTIPLE_CHOICE" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {choices.map((choice) => (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => handleAnswer(question.id, choice)}
                              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                                answers[question.id] === choice
                                  ? "border-sky-500 bg-sky-50 text-sky-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700"
                              }`}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={answers[question.id] ?? ""}
                          onChange={(event) => handleAnswer(question.id, event.target.value)}
                          placeholder="Введите ответ"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        />
                      )}
                    </div>
                  );
                })}
                {lesson.questions.length === 0 ? (
                  <p className="text-sm text-slate-600">В этом уроке нет заданий. Изучите видео и теорию, затем отметьте урок как пройденный.</p>
                ) : null}
              </div>

                {lesson.questions.length ? <button
                  type="button"
                  onClick={checkAnswers}
                disabled={checking}
                className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {checking ? "Проверяем..." : "Проверить ответы"}
              </button> : <button type="button" onClick={markLessonComplete} disabled={checking || markedComplete} className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50">{markedComplete ? "Урок пройден" : checking ? "Сохраняем..." : "Отметить урок пройденным"}</button>}

              {submissionError ? (
                <p className="mt-4 text-sm text-rose-600">{submissionError}</p>
              ) : null}

              {result ? (
                <div className={`mt-5 rounded-2xl border p-4 text-sm ${result.completed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                  Результат: {result.score}% ({Math.round((result.score * result.total) / 100)} из {result.total}). {result.completed ? "Урок завершён." : "Нужно набрать 70%, чтобы открыть следующую тему."}
                </div>
              ) : null}
              {(result?.completed || markedComplete || lesson.progress.completed) && lesson.course.nextLesson ? (
                <Link href={`/courses/${resolvedParams.slug}/${lesson.course.nextLesson.id}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800">
                  Следующая тема: {lesson.course.nextLesson.title}
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              ) : null}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold">Интерактивный график</h3>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-violet-50 p-4 text-center">
                <p className="text-sm text-slate-500">Практика урока</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{lesson.questions.length} заданий</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-sky-300" />
                <h3 className="text-xl font-bold">AI-подсказка</h3>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                Сначала попробуйте вынести переменную в одну сторону. Затем проверьте, не потеряли ли вы знак при переносе.
              </p>
              <button className="mt-5 w-full rounded-full bg-sky-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-400">
                Получить подсказку
              </button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Конспект</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>• Определите коэффициент при x</li>
                <li>• Перенесите свободный член</li>
                <li>• Разделите обе части уравнения</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
