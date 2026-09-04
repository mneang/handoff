import HandoffPlayer from "@/components/HandoffPlayer";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  projectId?: string;
  languageId?: string;
  appliance?: string;
  originalAudioUrl?: string;
}>;

export default async function RecipientHandoffPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const projectId = params.projectId;
  const languageId = params.languageId;
  const originalAudioUrl = params.originalAudioUrl;
  const appliance = params.appliance || "Refurbished appliance";

  if (!projectId || !languageId || !originalAudioUrl) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Handoff
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            This handoff link is incomplete.
          </h1>

          <p className="mt-4 text-slate-400">
            Please scan the HANDOFF tag again.
          </p>
        </div>
      </main>
    );
  }

  const spanishAudioUrl =
    `/api/handoff/spanish?projectId=${encodeURIComponent(
      projectId,
    )}&languageId=${encodeURIComponent(languageId)}`;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
          Handoff
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {appliance}
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-400">
          A message from the person who prepared this appliance for its next
          home.
        </p>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Voice handoff
            </p>

            <div className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
              Prepared with care
            </div>
          </div>

          <HandoffPlayer
            originalAudioUrl={originalAudioUrl}
            spanishAudioUrl={spanishAudioUrl}
          />

          <p className="mt-7 border-t border-slate-800 pt-6 text-sm leading-6 text-slate-500">
            This handoff contains practical information shared by the person
            who prepared this specific appliance.
          </p>
        </section>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don&apos;t just give the appliance. Pass on the know-how.
        </p>
      </div>
    </main>
  );
}
