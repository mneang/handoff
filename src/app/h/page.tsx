import HandoffPlayer from "@/components/HandoffPlayer";

type SearchParams = Promise<{
  appliance?: string;
  originalAudioUrl?: string;
  spanishAudioUrl?: string;
}>;

export default async function RecipientHandoffPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const appliance =
    params.appliance || "Refurbished appliance";

  const originalAudioUrl = params.originalAudioUrl;
  const spanishAudioUrl = params.spanishAudioUrl;

  if (!originalAudioUrl || !spanishAudioUrl) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            HANDOFF
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            This handoff link is incomplete.
          </h1>

          <p className="mt-3 text-slate-400">
            Please scan the HANDOFF tag again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-white sm:py-10">
      <div className="mx-auto max-w-md">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            HANDOFF
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {appliance}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            A voice note from the person who prepared this appliance.
          </p>
        </header>

        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Voice handoff
              </p>

              <p className="mt-1 text-sm font-medium text-slate-200">
                Choose how you&apos;d like to listen
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Ready
            </span>
          </div>

          <HandoffPlayer
            originalAudioUrl={originalAudioUrl}
            spanishAudioUrl={spanishAudioUrl}
          />

          <p className="mt-5 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">
            Practical information for this specific appliance.
          </p>
        </section>

        <p className="mt-5 text-center text-xs text-slate-600">
          Pass on more than the appliance.
        </p>
      </div>
    </main>
  );
}
