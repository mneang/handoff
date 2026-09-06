import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ElevenLabsError = {
  code?: string;
  message?: string;
  [key: string]: unknown;
};

export async function GET(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured." },
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
    const languageResponse = await fetch(
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

    const rawLanguageResponse =
      await languageResponse.text();

    let languageData: Record<string, unknown>;

    try {
      languageData = JSON.parse(rawLanguageResponse);
    } catch {
      languageData = {
        raw: rawLanguageResponse,
      };
    }

    if (!languageResponse.ok) {
      return NextResponse.json(
        {
          error:
            "ElevenLabs could not retrieve the dubbing status.",
          details: languageData,
        },
        { status: languageResponse.status },
      );
    }

    const outputs = languageData.outputs as
      | {
          lossless_audio?: string;
        }
      | undefined;

    const languageError =
      (languageData.error as ElevenLabsError | null) ??
      null;

    let projectError: ElevenLabsError | null = null;
    let projectStatus: unknown = null;
    let projectWarnings: unknown[] = [];

    if (
      languageData.status === "failed" &&
      languageError?.code === "project_failed"
    ) {
      const projectResponse = await fetch(
        `https://api.elevenlabs.io/v1/dubbing/project/${encodeURIComponent(
          projectId,
        )}`,
        {
          method: "GET",
          headers: {
            "xi-api-key": apiKey,
          },
          cache: "no-store",
        },
      );

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();

        projectStatus =
          projectData?.status ?? null;

        projectError =
          projectData?.error ?? null;

        projectWarnings = Array.isArray(
          projectData?.warnings,
        )
          ? projectData.warnings
          : [];
      }
    }

    return NextResponse.json({
      status:
        languageData.status ?? "unknown",
      projectId:
        languageData.project_id ?? projectId,
      languageId:
        languageData.language_id ?? languageId,
      targetLanguage:
        languageData.target_language ?? null,
      audioUrl:
        outputs?.lossless_audio ?? null,

      failure: languageError,
      warnings: Array.isArray(
        languageData.warnings,
      )
        ? languageData.warnings
        : [],

      projectStatus,
      projectFailure: projectError,
      projectWarnings,
    });
  } catch (error) {
    console.error(
      "HANDOFF dubbing status error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unexpected server error while checking the dub.",
      },
      { status: 500 },
    );
  }
}
