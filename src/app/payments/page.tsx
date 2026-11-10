export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Доступ к обучению</p>
        <h1 className="mt-3 text-3xl font-bold">Оплата и продление</h1>
        <p className="mt-4 leading-7 text-slate-600">
          После подтверждения оплаты администратор создаст аккаунт или продлит доступ на согласованный срок.
          Самостоятельная регистрация и онлайн-оплата пока отключены.
        </p>
        <p className="mt-4 text-sm text-slate-500">Для получения доступа обратитесь к администратору платформы.</p>
      </div>
    </main>
  );
}
