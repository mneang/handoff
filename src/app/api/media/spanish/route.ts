import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice service is not configured." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();

    const projectId = body?.projectId;
    const languageId = body?.languageId;

    if (
      typeof projectId !== "string" ||
      typeof languageId !== "string"
    ) {
      return NextResponse.json(
        { error: "projectId and languageId are required." },
        { status: 400 },
      );
    }

    const targetResponse = await fetch(
      `https://api.elevenlabs.io/v1/dubbing/project/${encodeURIComponent(
        projectId,
      )}/language/${encodeURIComponent(languageId)}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
        cache: "no-store",
      },
    );

    if (!targetResponse.ok) {
      const details = await targetResponse.text();

      console.error(
        "HANDOFF ElevenLabs target lookup failed:",
        targetResponse.status,
        details,
      );

      return NextResponse.json(
        { error: "Could not retrieve the completed Spanish handoff." },
        { status: targetResponse.status },
      );
    }

    const targetData = await targetResponse.json();

    if (targetData?.status !== "completed") {
      return NextResponse.json(
        {
          error: "Spanish handoff is not completed yet.",
          status: targetData?.status ?? "unknown",
        },
        { status: 409 },
      );
    }

    const signedAudioUrl = targetData?.outputs?.lossless_audio;

    if (
      typeof signedAudioUrl !== "string" ||
      !signedAudioUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        { error: "Spanish audio output is unavailable." },
        { status: 404 },
      );
    }

    const audioResponse = await fetch(signedAudioUrl, {
      cache: "no-store",
    });

    if (!audioResponse.ok) {
      return NextResponse.json(
        { error: "Could not download the Spanish audio output." },
        { status: 502 },
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    const pathname = `handoff/spanish/${crypto.randomUUID()}.flac`;

    const blob = await put(
      pathname,
      Buffer.from(audioBuffer),
      {
        access: "public",
        addRandomSuffix: false,
        contentType: "audio/flac",
      },
    );

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("HANDOFF Spanish media storage error:", error);

    return NextResponse.json(
      { error: "Could not save the Spanish handoff audio." },
      { status: 500 },
    );
  }
}
