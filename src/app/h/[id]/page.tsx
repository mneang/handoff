import HandoffPlayer from "@/components/HandoffPlayer";
import { getHandoffManifest } from "@/lib/handoffManifest";

type Params = Promise<{
  id: string;
}>;

export default async function RecipientHandoffPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const handoff =
    await getHandoffManifest(id);

  if (!handoff) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            HANDOFF
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            We could not find this handoff.
          </h1>

          <p className="mt-3 text-slate-400">
            Please scan the HANDOFF tag again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-white sm:py-9">
      <div className="mx-auto max-w-md">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            HANDOFF
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {handoff.appliance}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Listen or read the handoff from the person who
            prepared this appliance.
          </p>
        </header>

        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Your HANDOFF
              </p>

              <p className="mt-1 text-sm font-medium text-slate-200">
                Choose your language
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Ready
            </span>
          </div>

          <HandoffPlayer
            originalAudioUrl={
              handoff.originalAudioUrl
            }
            translatedAudioUrl={
              handoff.translatedAudioUrl
            }
            sourceLanguage={
              handoff.sourceLanguage
            }
            targetLanguage={
              handoff.targetLanguage
            }
            sourceText={
              handoff.sourceText
            }
            translatedText={
              handoff.translatedText
            }
          />
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-600">
          Listen or read. Pass on the know-how.
        </p>
      </div>
    </main>
  );
}
