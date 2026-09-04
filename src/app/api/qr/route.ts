import QRCode from "qrcode";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");

  if (!data) {
    return NextResponse.json(
      { error: "QR data is required." },
      { status: 400 },
    );
  }

  if (data.length > 2000) {
    return NextResponse.json(
      { error: "QR data is too long." },
      { status: 400 },
    );
  }

  try {
    const png = await QRCode.toBuffer(data, {
      type: "png",
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("HANDOFF QR error:", error);

    return NextResponse.json(
      { error: "Could not generate QR code." },
      { status: 500 },
    );
  }
}
