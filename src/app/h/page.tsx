import HandoffPlayer, {
  type LanguageCode,
} from "@/components/HandoffPlayer";

type SearchParams = Promise<{
  appliance?: string;
  originalAudioUrl?: string;
  translatedAudioUrl?: string;
  transcriptUrl?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}>;

function languageCode(
  value: string | undefined,
  fallback: LanguageCode,
): LanguageCode {
  return value === "es"
    ? "es"
    : value === "en"
      ? "en"
      : fallback;
}

function isAllowedTranscriptUrl(
  value: string | undefined,
) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(
        ".vercel-storage.com",
      )
    );
  } catch {
    return false;
  }
}

export default async function RecipientHandoffPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params =
    await searchParams;

  const appliance =
    params.appliance ||
    "Refurbished appliance";

  const originalAudioUrl =
    params.originalAudioUrl;

  const translatedAudioUrl =
    params.translatedAudioUrl;

  const sourceLanguage =
    languageCode(
      params.sourceLanguage,
      "en",
    );

  const targetLanguage =
    languageCode(
      params.targetLanguage,
      "es",
    );

  let sourceText = "";
  let translatedText = "";

  if (
    isAllowedTranscriptUrl(
      params.transcriptUrl,
    )
  ) {
    try {
      const transcriptResponse =
        await fetch(
          params.transcriptUrl!,
          {
            cache: "no-store",
          },
        );

      if (
        transcriptResponse.ok
      ) {
        const transcript =
          await transcriptResponse.json();

        if (
          typeof transcript?.sourceText ===
          "string"
        ) {
          sourceText =
            transcript.sourceText;
        }

        if (
          typeof transcript?.translatedText ===
          "string"
        ) {
          translatedText =
            transcript.translatedText;
        }
      }
    } catch (error) {
      console.error(
        "HANDOFF readable text load error:",
        error,
      );
    }
  }

  if (
    !originalAudioUrl ||
    !translatedAudioUrl
  ) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            HANDOFF
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            This handoff link
            is incomplete.
          </h1>

          <p className="mt-3 text-slate-400">
            Please scan the
            HANDOFF tag again.
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
            {appliance}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Listen or read the
            handoff from the person
            who prepared this appliance.
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
              originalAudioUrl
            }
            translatedAudioUrl={
              translatedAudioUrl
            }
            sourceLanguage={
              sourceLanguage
            }
            targetLanguage={
              targetLanguage
            }
            sourceText={
              sourceText
            }
            translatedText={
              translatedText
            }
          />
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-600">
          Listen or read.
          Pass on the know-how.
        </p>
      </div>
    </main>
  );
}
