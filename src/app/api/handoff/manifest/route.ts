import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type LanguageCode = "en" | "es";

const SUPPORTED_LANGUAGES = new Set<LanguageCode>(["en", "es"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const appliance = body?.appliance;
    const sourceLanguage = body?.sourceLanguage;
    const targetLanguage = body?.targetLanguage;
    const originalAudioUrl = body?.originalAudioUrl;
    const translatedAudioUrl = body?.translatedAudioUrl;
    const sourceText = body?.sourceText;
    const translatedText = body?.translatedText;

    if (
      typeof appliance !== "string" ||
      !appliance.trim() ||
      typeof originalAudioUrl !== "string" ||
      typeof translatedAudioUrl !== "string" ||
      typeof sourceText !== "string" ||
      typeof translatedText !== "string"
    ) {
      return NextResponse.json(
        { error: "Complete HANDOFF data is required." },
        { status: 400 },
      );
    }

    if (
      !SUPPORTED_LANGUAGES.has(sourceLanguage) ||
      !SUPPORTED_LANGUAGES.has(targetLanguage)
    ) {
      return NextResponse.json(
        { error: "Unsupported HANDOFF language." },
        { status: 400 },
      );
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json(
        {
          error:
            "Source and recipient languages must currently be different.",
        },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();

    const manifest = {
      version: 1,
      id,
      appliance: appliance.trim(),
      sourceLanguage,
      targetLanguage,
      originalAudioUrl,
      translatedAudioUrl,
      sourceText: sourceText.trim(),
      translatedText: translatedText.trim(),
      createdAt: new Date().toISOString(),
    };

    const pathname = `handoff/manifests/${id}.json`;

    const blob = await put(
      pathname,
      JSON.stringify(manifest),
      {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      id,
      manifestUrl: blob.url,
    });
  } catch (error) {
    console.error("HANDOFF manifest creation error:", error);

    return NextResponse.json(
      { error: "Could not create the HANDOFF record." },
      { status: 500 },
    );
  }
}
