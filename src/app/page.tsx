"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type AppStatus =
  | "idle"
  | "recording"
  | "ready"
  | "dubbing"
  | "completed"
  | "error";

export default function Home() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [appliance, setAppliance] = useState("Whirlpool Washer");
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [dubbedAudioUrl, setDubbedAudioUrl] = useState<string | null>(null);
  const [recipientUrl, setRecipientUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      setMessage("");
      setDubbedAudioUrl(null);
      setRecipientUrl(null);

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;

      const preferredMimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: mimeType,
        });

        const url = URL.createObjectURL(blob);

        setRecordingBlob(blob);
        setRecordingUrl(url);
        setStatus("ready");

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(
        "Microphone access failed. Make sure the browser has permission to use your microphone.",
      );
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }

  async function createHandoff() {
    if (!recordingBlob) {
      setMessage("Record a handoff first.");
      return;
    }

    setStatus("dubbing");
    setMessage("Uploading your handoff to ElevenLabs...");
    setRecipientUrl(null);

    try {
      const formData = new FormData();

      const file = new File([recordingBlob], "handoff-recording.webm", {
        type: recordingBlob.type || "audio/webm",
      });

      formData.append("file", file);
      formData.append("targetLanguage", "es");

      const startResponse = await fetch("/api/dubbing/start", {
        method: "POST",
        body: formData,
      });

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(
          startData?.details?.detail?.message ||
            startData?.error ||
            "Could not start dubbing.",
        );
      }

      const projectId = startData.project_id;
      const languageId = startData.language_ids?.[0];

      if (!projectId || !languageId) {
        throw new Error("ElevenLabs did not return the expected project IDs.");
      }

      setMessage("ElevenLabs is creating the Spanish handoff...");

      for (let attempt = 1; attempt <= 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const statusResponse = await fetch(
          `/api/dubbing/status?projectId=${encodeURIComponent(
            projectId,
          )}&languageId=${encodeURIComponent(languageId)}`,
          {
            cache: "no-store",
          },
        );

        const statusData = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(
            statusData?.error || "Could not check dubbing status.",
          );
        }

        if (statusData.status === "completed" && statusData.audioUrl) {
          const handoffUrl = new URL("/h", window.location.origin);

          handoffUrl.searchParams.set("projectId", projectId);
          handoffUrl.searchParams.set("languageId", languageId);
          handoffUrl.searchParams.set(
            "appliance",
            appliance.trim() || "Refurbished appliance",
          );

          setDubbedAudioUrl(statusData.audioUrl);
          setRecipientUrl(handoffUrl.toString());
          setStatus("completed");
          setMessage("Spanish handoff and QR ready.");
          return;
        }

        if (statusData.status === "failed") {
          throw new Error("ElevenLabs reported that the dubbing job failed.");
        }

        setMessage(
          `Creating Spanish handoff... ${statusData.status ?? "processing"}`,
        );
      }

      throw new Error("The dubbing job took too long to finish.");
    } catch (error) {
      console.error(error);

      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the handoff.",
      );
    }
  }

  function resetRecording() {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }

    setRecordingBlob(null);
    setRecordingUrl(null);
    setDubbedAudioUrl(null);
    setRecipientUrl(null);
    setMessage("");
    setStatus("idle");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Handoff
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Pass on more than the appliance.
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-400">
            Record the useful details about a refurbished appliance and turn
            them into a spoken handoff for its next home.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <label
            htmlFor="appliance"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Appliance
          </label>

          <input
            id="appliance"
            value={appliance}
            onChange={(event) => setAppliance(event.target.value)}
            className="mb-8 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />

          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-slate-300">
              Recipient language
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
              Español (Spanish)
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-medium text-slate-300">
              Technician handoff
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep it short and practical: what was repaired, what was tested,
              and anything useful the recipient should know.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {status !== "recording" && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={status === "dubbing"}
                  className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  🎙️ Record handoff
                </button>
              )}

              {status === "recording" && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400"
                >
                  ■ Stop recording
                </button>
              )}

              {recordingBlob &&
                status !== "recording" &&
                status !== "dubbing" && (
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Record again
                  </button>
                )}
            </div>

            {status === "recording" && (
              <div className="mt-5 flex items-center gap-3 text-red-300">
                <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                Recording...
              </div>
            )}

            {recordingUrl && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Original
                </p>

                <audio className="w-full" controls src={recordingUrl} />
              </div>
            )}
          </div>

          {recordingBlob && status !== "recording" && (
            <button
              type="button"
              onClick={createHandoff}
              disabled={status === "dubbing"}
              className="mt-6 w-full rounded-xl bg-white px-5 py-4 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
            >
              {status === "dubbing"
                ? "Creating handoff..."
                : "Create Spanish handoff"}
            </button>
          )}

          {message && (
            <p
              className={`mt-5 text-sm ${
                status === "error" ? "text-red-300" : "text-slate-400"
              }`}
            >
              {message}
            </p>
          )}

          {dubbedAudioUrl && recipientUrl && (
            <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-sm font-semibold text-emerald-300">
                ✓ Handoff ready
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {appliance || "Appliance"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">Spanish</p>

              <audio
                className="mt-5 w-full"
                controls
                src={dubbedAudioUrl}
              />

              <div className="mt-8 border-t border-emerald-500/20 pt-6">
                <p className="text-sm font-semibold text-white">
                  QR handoff tag
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Attach this QR to the appliance. The recipient can scan it
                  later to hear the handoff.
                </p>

                <div className="mt-5 inline-block rounded-2xl bg-white p-3">
                  <Image
                    src={`/api/qr?data=${encodeURIComponent(recipientUrl)}`}
                    width={240}
                    height={240}
                    alt="QR code for this appliance handoff"
                    unoptimized
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={recipientUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl border border-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                  >
                    Open recipient view ↗
                  </a>

                  <a
                    href={recipientUrl.replace("/h?", "/tag?")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Open printable tag ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
