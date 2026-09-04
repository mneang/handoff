import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);

  const projectId = searchParams.get("projectId");
  const languageId = searchParams.get("languageId");

  if (!projectId || !languageId) {
    return NextResponse.json(
      { error: "projectId and languageId are required." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/dubbing/project/${encodeURIComponent(
        projectId
      )}/language/${encodeURIComponent(languageId)}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
        cache: "no-store",
      }
    );

    const rawResponse = await response.text();

    let data: Record<string, unknown>;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { raw: rawResponse };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "ElevenLabs could not retrieve the dubbing status.",
          details: data,
        },
        { status: response.status }
      );
    }

    const outputs = data.outputs as
      | {
          lossless_audio?: string;
        }
      | undefined;

    return NextResponse.json({
      status: data.status ?? "unknown",
      projectId: data.project_id ?? projectId,
      languageId: data.language_id ?? languageId,
      targetLanguage: data.target_language ?? null,
      audioUrl: outputs?.lossless_audio ?? null,
      warnings: data.warnings ?? [],
    });
  } catch (error) {
    console.error("HANDOFF dubbing status error:", error);

    return NextResponse.json(
      { error: "Unexpected server error while checking the dub." },
      { status: 500 }
    );
  }
}
