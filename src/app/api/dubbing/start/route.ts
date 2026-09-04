import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const incomingFormData = await request.formData();

    const file = incomingFormData.get("file");
    const targetLanguage =
      incomingFormData.get("targetLanguage")?.toString() || "es";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "An audio file is required." },
        { status: 400 }
      );
    }

    const elevenLabsFormData = new FormData();

    elevenLabsFormData.append("file", file, file.name || "handoff-audio.webm");
    elevenLabsFormData.append(
      "reference",
      `HANDOFF ${new Date().toISOString()}`
    );
    elevenLabsFormData.append("source_language", "en");
    elevenLabsFormData.append("target_language", targetLanguage);
    elevenLabsFormData.append("model_id", "dubbing_v2");

    const response = await fetch(
      "https://api.elevenlabs.io/v1/dubbing/project",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: elevenLabsFormData,
      }
    );

    const rawResponse = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { raw: rawResponse };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "ElevenLabs could not create the dubbing project.",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("HANDOFF dubbing start error:", error);

    return NextResponse.json(
      { error: "Unexpected server error while starting the dub." },
      { status: 500 }
    );
  }
}
