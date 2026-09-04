import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      )}/language/${encodeURIComponent(languageId)}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "HANDOFF Spanish audio lookup failed:",
        response.status,
        details,
      );

      return NextResponse.json(
        { error: "Could not retrieve the Spanish handoff." },
        { status: response.status },
      );
    }

    const data = await response.json();

    if (data?.status !== "completed") {
      return NextResponse.json(
        {
          error: "Spanish handoff is not ready yet.",
          status: data?.status ?? "unknown",
        },
        { status: 409 },
      );
    }

    const audioUrl = data?.outputs?.lossless_audio;

    if (!audioUrl || typeof audioUrl !== "string") {
      return NextResponse.json(
        { error: "Spanish audio output is unavailable." },
        { status: 404 },
      );
    }

    return NextResponse.redirect(audioUrl, {
      status: 307,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("HANDOFF Spanish audio error:", error);

    return NextResponse.json(
      { error: "Unexpected error while loading Spanish audio." },
      { status: 500 },
    );
  }
}
