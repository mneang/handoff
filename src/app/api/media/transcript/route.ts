import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 6000;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sourceText = body?.sourceText;
    const translatedText = body?.translatedText;
    const sourceLanguage = body?.sourceLanguage;
    const targetLanguage = body?.targetLanguage;

    if (
      typeof sourceText !== "string" ||
      typeof translatedText !== "string" ||
      !sourceText.trim() ||
      !translatedText.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Source and translated handoff text are required.",
        },
        { status: 400 },
      );
    }

    if (
      sourceText.length > MAX_TEXT_LENGTH ||
      translatedText.length > MAX_TEXT_LENGTH
    ) {
      return NextResponse.json(
        { error: "The readable handoff is too long." },
        { status: 413 },
      );
    }

    if (
      !["en", "es"].includes(sourceLanguage) ||
      !["en", "es"].includes(targetLanguage)
    ) {
      return NextResponse.json(
        {
          error:
            "HANDOFF currently supports English and Spanish.",
        },
        { status: 400 },
      );
    }

    const payload = {
      sourceLanguage,
      targetLanguage,
      sourceText: sourceText.trim(),
      translatedText: translatedText.trim(),
      createdAt: new Date().toISOString(),
    };

    const pathname =
      `handoff/transcripts/${crypto.randomUUID()}.json`;

    const blob = await put(
      pathname,
      JSON.stringify(payload),
      {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error(
      "HANDOFF transcript storage error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Could not save the readable HANDOFF.",
      },
      { status: 500 },
    );
  }
}
