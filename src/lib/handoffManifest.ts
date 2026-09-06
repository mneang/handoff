import { list } from "@vercel/blob";

export type LanguageCode = "en" | "es";

export type HandoffManifest = {
  version: number;
  id: string;
  appliance: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  originalAudioUrl: string;
  translatedAudioUrl: string;
  sourceText: string;
  translatedText: string;
  createdAt: string;
};

const HANDOFF_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getHandoffManifest(
  id: string,
): Promise<HandoffManifest | null> {
  if (!HANDOFF_ID_PATTERN.test(id)) {
    return null;
  }

  const pathname =
    `handoff/manifests/${id}.json`;

  const { blobs } = await list({
    prefix: pathname,
    limit: 1,
  });

  const manifestBlob = blobs.find(
    (blob) =>
      blob.pathname === pathname,
  );

  if (!manifestBlob) {
    return null;
  }

  const response = await fetch(
    manifestBlob.url,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const data =
    await response.json();

  if (
    data?.version !== 1 ||
    data?.id !== id ||
    typeof data?.appliance !== "string" ||
    !["en", "es"].includes(data?.sourceLanguage) ||
    !["en", "es"].includes(data?.targetLanguage) ||
    typeof data?.originalAudioUrl !== "string" ||
    typeof data?.translatedAudioUrl !== "string" ||
    typeof data?.sourceText !== "string" ||
    typeof data?.translatedText !== "string"
  ) {
    return null;
  }

  return data as HandoffManifest;
}
