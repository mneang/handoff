import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice service is not configured." },
      { status: 500 },
    );
  }

  try {
    const incomingFormData = await request.formData();
    const file = incomingFormData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "An audio file is required." },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "The audio recording is empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The audio recording is too large." },
        { status: 413 },
      );
    }

    const elevenLabsFormData = new FormData();

    elevenLabsFormData.append(
      "audio",
      file,
      file.name || "handoff-recording.webm",
    );

    elevenLabsFormData.append(
      "file_format",
      "other",
    );

    const response = await fetch(
      "https://api.elevenlabs.io/v1/audio-isolation",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: elevenLabsFormData,
      },
    );

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "HANDOFF Voice Isolation failed:",
        response.status,
        details,
      );

      return NextResponse.json(
        {
          error:
            "ElevenLabs could not enhance the voice recording.",
        },
        { status: response.status },
      );
    }

    const audio = await response.arrayBuffer();

    const contentType =
      response.headers.get("content-type") ||
      "audio/mpeg";

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "HANDOFF Voice Isolation error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unexpected error while enhancing the voice recording.",
      },
      { status: 500 },
    );
  }
}
