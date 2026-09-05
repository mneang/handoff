import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice service is not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);

  const projectId = searchParams.get("projectId");
  const languageId = searchParams.get("languageId");

  if (!projectId || !languageId) {
    return NextResponse.json(
      { error: "projectId and languageId are required." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/dubbing/project/${encodeURIComponent(
        projectId,
      )}/language/${encodeURIComponent(languageId)}/transcript`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
        cache: "no-store",
      },
    );

    const rawResponse = await response.text();

    let data: any;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { raw: rawResponse };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Could not retrieve the readable handoff.",
          details: data,
        },
        { status: response.status },
      );
    }

    const segments = Array.isArray(data?.segments)
      ? data.segments
      : [];

    const sourceText = segments
      .map((segment: any) =>
        typeof segment?.source_text === "string"
          ? segment.source_text.trim()
          : "",
      )
      .filter(Boolean)
      .join(" ");

    const translatedText = segments
      .map((segment: any) =>
        typeof segment?.translation === "string"
          ? segment.translation.trim()
          : "",
      )
      .filter(Boolean)
      .join(" ");

    if (!sourceText || !translatedText) {
      return NextResponse.json(
        {
          error:
            "ElevenLabs did not return both source and translated text.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      sourceLanguage: data?.source_language ?? null,
      targetLanguage: data?.target_language ?? null,
      sourceText,
      translatedText,
    });
  } catch (error) {
    console.error("HANDOFF transcript error:", error);

    return NextResponse.json(
      {
        error:
          "Unexpected error while preparing the readable handoff.",
      },
      { status: 500 },
    );
  }
}
