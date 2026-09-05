import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
          HANDOFF
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          We could not find this handoff.
        </h1>

        <p className="mt-4 leading-7 text-slate-400">
          The link may be incomplete or no longer valid.
        </p>

        <Link
          href="/"
          className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          Return to HANDOFF
        </Link>
      </div>
    </main>
  );
}
