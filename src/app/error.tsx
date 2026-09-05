"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
          HANDOFF
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          Something interrupted this handoff.
        </h1>

        <p className="mt-4 leading-7 text-slate-400">
          Your browser hit an unexpected problem. You can safely try this
          step again.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
