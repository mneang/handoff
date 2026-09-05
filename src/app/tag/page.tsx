import Image from "next/image";
import { headers } from "next/headers";
import PrintButton from "@/components/PrintButton";

export const dynamic =
  "force-dynamic";

type LanguageCode =
  | "en"
  | "es";

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

function languageLabel(
  language: LanguageCode,
) {
  return language === "es"
    ? "Español"
    : "English";
}

export default async function HandoffTagPage({
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

  const transcriptUrl =
    params.transcriptUrl;

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

  if (
    !originalAudioUrl ||
    !translatedAudioUrl
  ) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 text-slate-950">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-semibold">
            Invalid HANDOFF tag
          </h1>
        </div>
      </main>
    );
  }

  const headerStore =
    await headers();

  const host =
    headerStore.get("host");

  const forwardedProto =
    headerStore.get(
      "x-forwarded-proto",
    );

  const protocol =
    forwardedProto ||
    "https";

  if (!host) {
    throw new Error(
      "Could not determine the HANDOFF host.",
    );
  }

  const recipientUrl =
    new URL(
      "/h",
      `${protocol}://${host}`,
    );

  recipientUrl.searchParams.set(
    "appliance",
    appliance,
  );

  recipientUrl.searchParams.set(
    "originalAudioUrl",
    originalAudioUrl,
  );

  recipientUrl.searchParams.set(
    "translatedAudioUrl",
    translatedAudioUrl,
  );

  if (transcriptUrl) {
    recipientUrl.searchParams.set(
      "transcriptUrl",
      transcriptUrl,
    );
  }

  recipientUrl.searchParams.set(
    "sourceLanguage",
    sourceLanguage,
  );

  recipientUrl.searchParams.set(
    "targetLanguage",
    targetLanguage,
  );

  const qrSource =
    `/api/qr?data=${encodeURIComponent(
      recipientUrl.toString(),
    )}`;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950 print:bg-white print:p-0">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex justify-end print:hidden">
          <PrintButton />
        </div>

        <section className="rounded-3xl border-2 border-slate-900 bg-white p-8 text-center shadow-xl print:rounded-none print:shadow-none">
          <p className="text-sm font-bold uppercase tracking-[0.28em]">
            HANDOFF
          </p>

          <div className="mx-auto my-6 h-px bg-slate-200" />

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Prepared for its next home
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {appliance}
          </h1>

          <div className="mx-auto mt-7 inline-block rounded-2xl border border-slate-200 bg-white p-3">
            <Image
              src={qrSource}
              width={280}
              height={280}
              alt={`QR code for ${appliance} HANDOFF`}
              unoptimized
              priority
            />
          </div>

          <h2 className="mt-5 text-xl font-bold">
            Scan to listen or read
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {languageLabel(
              sourceLanguage,
            )}{" "}
            →{" "}
            {languageLabel(
              targetLanguage,
            )}
          </p>

          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Voice + readable text
          </p>

          <div className="mx-auto my-6 h-px bg-slate-200" />

          <p className="text-xs font-medium text-slate-500">
            Don&apos;t just give
            the appliance.
          </p>

          <p className="mt-1 text-sm font-bold">
            Pass on the know-how.
          </p>
        </section>
      </div>
    </main>
  );
}
