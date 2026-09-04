import Image from "next/image";
import { headers } from "next/headers";
import PrintButton from "@/components/PrintButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  projectId?: string;
  languageId?: string;
  appliance?: string;
  originalAudioUrl?: string;
}>;

export default async function HandoffTagPage({
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
      <main className="min-h-screen bg-slate-100 p-8 text-slate-950">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-semibold">Invalid HANDOFF tag</h1>
          <p className="mt-3 text-slate-600">
            This tag is missing its handoff information.
          </p>
        </div>
      </main>
    );
  }

  const headerStore = await headers();
  const host = headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const protocol = forwardedProto || "http";

  if (!host) {
    throw new Error("Could not determine the HANDOFF host.");
  }

  const recipientUrl = new URL("/h", `${protocol}://${host}`);

  recipientUrl.searchParams.set("projectId", projectId);
  recipientUrl.searchParams.set("languageId", languageId);
  recipientUrl.searchParams.set("appliance", appliance);
  recipientUrl.searchParams.set("originalAudioUrl", originalAudioUrl);

  const qrSource = `/api/qr?data=${encodeURIComponent(
    recipientUrl.toString(),
  )}`;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950 print:bg-white print:p-0">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex justify-end print:hidden">
          <PrintButton />
        </div>

        <section className="rounded-3xl border-2 border-slate-900 bg-white p-8 text-center shadow-xl print:shadow-none">
          <p className="text-sm font-bold uppercase tracking-[0.28em]">
            Handoff
          </p>

          <div className="mx-auto my-6 h-px bg-slate-200" />

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Prepared for its next home
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {appliance}
          </h1>

          <div className="mx-auto mt-8 inline-block rounded-2xl border border-slate-200 bg-white p-3">
            <Image
              src={qrSource}
              width={280}
              height={280}
              alt={`QR code for ${appliance} voice handoff`}
              unoptimized
              priority
            />
          </div>

          <h2 className="mt-6 text-xl font-bold">
            Scan to hear your handoff
          </h2>

          <p className="mt-2 text-base text-slate-600">
            Español (Spanish)
          </p>

          <p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-slate-500">
            Hear useful information from the person who prepared this specific
            appliance.
          </p>

          <div className="mx-auto my-7 h-px bg-slate-200" />

          <p className="text-xs font-medium text-slate-500">
            Don&apos;t just give the appliance.
          </p>

          <p className="mt-1 text-sm font-bold">
            Pass on the know-how.
          </p>
        </section>
      </div>
    </main>
  );
}
