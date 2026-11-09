import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const paymentFeatures = [
  "Полный доступ ко всем курсам",
  "AI-помощник и подсказки",
  "Тесты и статистика прогресса",
  "Доступ к новым урокам",
];

export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Premium</p>
          <h1 className="mt-3 text-4xl font-bold">Подписка MathMentor AI</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <div className="mb-6 flex items-end gap-2">
              <span className="text-5xl font-black">$29</span>
              <span className="pb-2 text-slate-500">/ month</span>
            </div>

            <ul className="space-y-4">
              {paymentFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-base text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="mb-4 text-xl font-bold">Оплата</h2>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">Card ending in 4242</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">Billing: Monthly</div>
            </div>

            <Link
              href="/courses"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Оплатить подписку
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
