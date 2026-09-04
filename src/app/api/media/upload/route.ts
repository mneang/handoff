import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "An audio file is required." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "The uploaded file must be audio." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The audio file is too large." },
        { status: 413 },
      );
    }

    const extension =
      file.type.includes("webm")
        ? "webm"
        : file.type.includes("mpeg")
          ? "mp3"
          : "audio";

    const pathname = `handoff/originals/${crypto.randomUUID()}.${extension}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("HANDOFF media upload error:", error);

    return NextResponse.json(
      { error: "Could not save the original handoff audio." },
      { status: 500 },
    );
  }
}
