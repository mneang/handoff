export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  projectId?: string;
  languageId?: string;
  appliance?: string;
}>;

export default async function RecipientHandoffPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const projectId = params.projectId;
  const languageId = params.languageId;
  const appliance = params.appliance || "Refurbished appliance";

  if (!projectId || !languageId) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Handoff
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            This handoff link is incomplete.
          </h1>
        </div>
      </main>
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold">Handoff unavailable</h1>
          <p className="mt-4 text-slate-400">
            The voice service is not configured.
          </p>
        </div>
      </main>
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/dubbing/project/${encodeURIComponent(
      projectId,
    )}/language/${encodeURIComponent(languageId)}`,
    {
      headers: {
        "xi-api-key": apiKey,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Handoff
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            We could not load this handoff.
          </h1>

          <p className="mt-4 text-slate-400">
            Please try scanning the QR code again.
          </p>
        </div>
      </main>
    );
  }

  const data = await response.json();

  const audioUrl = data?.outputs?.lossless_audio as string | undefined;
  const targetLanguage = "Spanish";
  const status = data?.status || "unknown";

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
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Spoken handoff
              </p>

              <p className="mt-1 text-lg font-semibold uppercase">
                {targetLanguage}
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
              Prepared with care
            </span>
          </div>

          {status === "completed" && audioUrl ? (
            <>
              <audio className="w-full" controls src={audioUrl} />

              <p className="mt-6 text-sm leading-6 text-slate-500">
                This voice handoff contains practical information shared by the
                volunteer who prepared this specific appliance.
              </p>
            </>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="font-medium text-amber-200">
                This handoff is still being prepared.
              </p>

              <p className="mt-2 text-sm text-amber-200/70">
                Refresh this page in a moment.
              </p>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don&apos;t just give the appliance. Pass on the know-how.
        </p>
      </div>
    </main>
  );
}
