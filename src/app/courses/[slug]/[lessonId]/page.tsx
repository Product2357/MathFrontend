"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BrainCircuit, CheckCircle2 } from "lucide-react";
import { courses, lessonDetails } from "@/lib/mock-data";

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{ slug: string; lessonId: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [submissionError, setSubmissionError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void params.then(setResolvedParams);
  }, [params]);

  const course = useMemo(() => {
    if (!resolvedParams) return null;
    return courses.find((item) => item.slug === resolvedParams.slug) ?? null;
  }, [resolvedParams]);

  const lesson = useMemo(() => {
    if (!resolvedParams) return null;
    return lessonDetails[resolvedParams.lessonId as keyof typeof lessonDetails] ?? null;
  }, [resolvedParams]);

  useEffect(() => {
    if (!lesson) return;
    setAnswers({});
    setResult(null);
  }, [lesson]);

  if (!resolvedParams || !course || !lesson) {
    return null;
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

      setResult({ score: data.attempt.score, total: data.attempt.total });
    } catch {
      setSubmissionError("Не удалось связаться с сервером. Попробуйте ещё раз.");
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

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-sky-500 to-violet-600 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">{course.title}</p>
                <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
              </div>

              <div className="p-6">
                <video controls className="w-full rounded-2xl border border-slate-200 bg-slate-950" src={lesson.videoUrl} />

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <h2 className="mb-3 text-xl font-bold">Теория</h2>
                  <p className="text-base leading-7 text-slate-600">{lesson.theory}</p>
                  <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-center text-2xl font-bold text-white">
                    {lesson.formula}
                  </div>
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

                      {question.type === "multiple-choice" ? (
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
              </div>

              <button
                type="button"
                onClick={checkAnswers}
                disabled={checking}
                className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {checking ? "Проверяем..." : "Проверить ответы"}
              </button>

              {submissionError ? (
                <p className="mt-4 text-sm text-rose-600">{submissionError}</p>
              ) : null}

              {result ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Результат: {result.score}% ({Math.round((result.score * result.total) / 100)} из {result.total})
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold">Интерактивный график</h3>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-violet-50 p-4 text-center">
                <p className="text-sm text-slate-500">Desmos preview</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{lesson.graph}</p>
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
