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

type ProcessStage =
  | "idle"
  | "cleaning"
  | "saving"
  | "dubbing"
  | "accessibility"
  | "ready";

const MAX_RECORDING_SECONDS = 30;

export default function Home() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [processStage, setProcessStage] =
    useState<ProcessStage>("idle");

  const [appliance, setAppliance] =
    useState("Whirlpool Washer");

  const [sourceLanguage, setSourceLanguage] =
    useState<"en" | "es">("en");

  const targetLanguage =
    sourceLanguage === "en" ? "es" : "en";

  const [recordingBlob, setRecordingBlob] =
    useState<Blob | null>(null);

  const [recordingUrl, setRecordingUrl] =
    useState<string | null>(null);

  const [dubbedAudioUrl, setDubbedAudioUrl] =
    useState<string | null>(null);

  const [recipientUrl, setRecipientUrl] =
    useState<string | null>(null);

  const [tagUrl, setTagUrl] =
    useState<string | null>(null);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [message, setMessage] =
    useState("");

  const [savedOriginalAudioUrl, setSavedOriginalAudioUrl] =
    useState<string | null>(null);

  const [completedDub, setCompletedDub] = useState<{
    projectId: string;
    languageId: string;
  } | null>(null);

  const [cleanedRecordingBlob, setCleanedRecordingBlob] =
    useState<Blob | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const chunksRef =
    useRef<Blob[]>([]);

  const timerIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const autoStopRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearRecordingTimers() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }

  async function startRecording() {
    try {
      clearRecordingTimers();

      setMessage("");
      setDubbedAudioUrl(null);
      setRecipientUrl(null);
      setTagUrl(null);
      setSavedOriginalAudioUrl(null);
      setCompletedDub(null);
      setCleanedRecordingBlob(null);
      setProcessStage("idle");
      setRecordingSeconds(0);

      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        throw new Error(
          "Audio recording is not supported in this browser.",
        );
      }

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(null);
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      mediaStreamRef.current = stream;

      const preferredMimeType =
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus",
        )
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

      const recorder = preferredMimeType
        ? new MediaRecorder(stream, {
            mimeType: preferredMimeType,
          })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearRecordingTimers();

        const mimeType =
          recorder.mimeType || "audio/webm";

        const blob = new Blob(
          chunksRef.current,
          {
            type: mimeType,
          },
        );

        const url =
          URL.createObjectURL(blob);

        setRecordingBlob(blob);
        setRecordingUrl(url);
        setStatus("ready");

        mediaStreamRef.current
          ?.getTracks()
          .forEach((track) =>
            track.stop(),
          );

        mediaStreamRef.current = null;
      };

      mediaRecorderRef.current = recorder;

      recorder.start();

      setStatus("recording");

      timerIntervalRef.current =
        setInterval(() => {
          setRecordingSeconds((current) =>
            Math.min(
              current + 1,
              MAX_RECORDING_SECONDS,
            ),
          );
        }, 1000);

      autoStopRef.current =
        setTimeout(() => {
          if (
            recorder.state ===
            "recording"
          ) {
            recorder.stop();
          }
        }, MAX_RECORDING_SECONDS * 1000);
    } catch (error) {
      clearRecordingTimers();

      console.error(error);

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Microphone access failed.",
      );
    }
  }

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state === "recording"
    ) {
      recorder.stop();
    }
  }

  async function finalizeHandoff(
    projectId: string,
    languageId: string,
    originalAudioUrl: string,
    applianceName: string,
  ) {
    const targetName =
      targetLanguage === "es"
        ? "Spanish"
        : "English";

    setProcessStage("accessibility");

    setMessage(
      `Preparing readable ${targetName} handoff...`,
    );

    const transcriptResponse = await fetch(
      `/api/dubbing/transcript?projectId=${encodeURIComponent(
        projectId,
      )}&languageId=${encodeURIComponent(languageId)}`,
      {
        cache: "no-store",
      },
    );

    const transcriptData =
      await transcriptResponse.json();

    if (
      !transcriptResponse.ok ||
      !transcriptData.sourceText ||
      !transcriptData.translatedText
    ) {
      throw new Error(
        transcriptData?.error ||
          "Could not prepare the readable handoff.",
      );
    }

    setMessage(
      `${targetName} handoff ready. Preparing recipient audio...`,
    );

    const translatedSaveResponse = await fetch(
      "/api/media/translated",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          projectId,
          languageId,
        }),
      },
    );

    const translatedSaveData =
      await translatedSaveResponse.json();

    if (
      !translatedSaveResponse.ok ||
      !translatedSaveData.url
    ) {
      throw new Error(
        translatedSaveData?.error ||
          "Could not save the recipient voice handoff.",
      );
    }

    const translatedAudioUrl =
      translatedSaveData.url as string;

    setMessage(
      "Creating the HANDOFF record...",
    );

    const manifestResponse = await fetch(
      "/api/handoff/manifest",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          appliance:
            applianceName,
          sourceLanguage,
          targetLanguage,
          originalAudioUrl,
          translatedAudioUrl,
          sourceText:
            transcriptData.sourceText,
          translatedText:
            transcriptData.translatedText,
        }),
      },
    );

    const manifestData =
      await manifestResponse.json();

    if (
      !manifestResponse.ok ||
      !manifestData.id
    ) {
      throw new Error(
        manifestData?.error ||
          "Could not create the HANDOFF record.",
      );
    }

    const handoffId =
      manifestData.id as string;

    const handoffUrl = new URL(
      `/h/${handoffId}`,
      window.location.origin,
    );

    const printableTagUrl = new URL(
      `/tag/${handoffId}`,
      window.location.origin,
    );

    setDubbedAudioUrl(
      translatedAudioUrl,
    );

    setRecipientUrl(
      handoffUrl.toString(),
    );

    setTagUrl(
      printableTagUrl.toString(),
    );

    setProcessStage("ready");
    setStatus("completed");

    setMessage(
      "Your HANDOFF is ready to listen to or read.",
    );
  }

  async function createHandoff() {
    if (!recordingBlob) {
      setStatus("error");
      setMessage(
        "Record a handoff first.",
      );
      return;
    }

    const applianceName =
      appliance.trim();

    if (!applianceName) {
      setStatus("error");
      setMessage(
        "Add an appliance name before creating the HANDOFF.",
      );
      return;
    }

    if (recordingSeconds < 3) {
      setStatus("error");
      setMessage(
        "The recording is too short. Record at least 3 seconds so the recipient gets a useful handoff.",
      );
      return;
    }

    setStatus("dubbing");
    setRecipientUrl(null);
    setTagUrl(null);

    try {
      const file =
        new File(
          [recordingBlob],
          "handoff-recording.webm",
          {
            type:
              recordingBlob.type ||
              "audio/webm",
          },
        );

      let processingFile = file;

      if (cleanedRecordingBlob) {
        processingFile = new File(
          [cleanedRecordingBlob],
          "handoff-cleaned.mp3",
          {
            type:
              cleanedRecordingBlob.type ||
              "audio/mpeg",
          },
        );
      } else {
        setProcessStage("cleaning");

        setMessage(
          "Enhancing voice clarity with ElevenLabs...",
        );

        const isolationFormData =
          new FormData();

        isolationFormData.append(
          "file",
          file,
        );

        const isolationResponse =
          await fetch(
            "/api/audio/isolate",
            {
              method: "POST",
              body: isolationFormData,
            },
          );

        if (!isolationResponse.ok) {
          let errorMessage =
            "Could not enhance the voice recording.";

          try {
            const isolationError =
              await isolationResponse.json();

            errorMessage =
              isolationError?.error ||
              errorMessage;
          } catch {
            // Keep the default message.
          }

          throw new Error(
            errorMessage,
          );
        }

        const isolatedBlob =
          await isolationResponse.blob();

        if (
          isolatedBlob.size <= 0
        ) {
          throw new Error(
            "ElevenLabs returned an empty enhanced recording.",
          );
        }

        setCleanedRecordingBlob(
          isolatedBlob,
        );

        processingFile =
          new File(
            [isolatedBlob],
            "handoff-cleaned.mp3",
            {
              type:
                isolatedBlob.type ||
                "audio/mpeg",
            },
          );
      }

      let originalAudioUrl:
        string;

      if (savedOriginalAudioUrl) {
        originalAudioUrl =
          savedOriginalAudioUrl;
      } else {
        setProcessStage("saving");

        setMessage(
          "Saving the original handoff...",
        );

        const originalFormData =
          new FormData();

        originalFormData.append(
          "file",
          processingFile,
        );

        const uploadResponse =
          await fetch(
            "/api/media/upload",
            {
              method: "POST",
              body: originalFormData,
            },
          );

        const uploadData =
          await uploadResponse.json();

        if (
          !uploadResponse.ok ||
          !uploadData.url
        ) {
          throw new Error(
            uploadData?.error ||
              "Could not save the original handoff.",
          );
        }

        originalAudioUrl =
          uploadData.url as string;

        setSavedOriginalAudioUrl(
          originalAudioUrl,
        );
      }

      if (completedDub) {
        setProcessStage("dubbing");

        setMessage(
          "Voice handoff already created. Finishing your HANDOFF...",
        );

        await finalizeHandoff(
          completedDub.projectId,
          completedDub.languageId,
          originalAudioUrl,
          applianceName,
        );

        return;
      }

      setProcessStage("dubbing");

      setMessage(
        `Creating the ${
          targetLanguage === "es"
            ? "Spanish"
            : "English"
        } handoff with ElevenLabs...`,
      );

      const formData =
        new FormData();

      formData.append(
        "file",
        processingFile,
      );

      formData.append(
        "sourceLanguage",
        sourceLanguage,
      );

      formData.append(
        "targetLanguage",
        targetLanguage,
      );

      const startResponse =
        await fetch(
          "/api/dubbing/start",
          {
            method: "POST",
            body: formData,
          },
        );

      const startData =
        await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(
          startData?.details?.detail
            ?.message ||
            startData?.error ||
            "Could not start dubbing.",
        );
      }

      const projectId =
        startData.project_id;

      const languageId =
        startData.language_ids?.[0];

      if (
        !projectId ||
        !languageId
      ) {
        throw new Error(
          "ElevenLabs did not return the expected project IDs.",
        );
      }

      for (
        let attempt = 1;
        attempt <= 60;
        attempt += 1
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              2500,
            ),
        );

        const statusResponse =
          await fetch(
            `/api/dubbing/status?projectId=${encodeURIComponent(
              projectId,
            )}&languageId=${encodeURIComponent(
              languageId,
            )}`,
            {
              cache: "no-store",
            },
          );

        const statusData =
          await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(
            statusData?.error ||
              "Could not check dubbing status.",
          );
        }

        if (
          statusData.status ===
            "completed" &&
          statusData.audioUrl
        ) {
          setCompletedDub({
            projectId,
            languageId,
          });

          await finalizeHandoff(
            projectId,
            languageId,
            originalAudioUrl,
            applianceName,
          );

          return;
        }

        if (
          statusData.status ===
          "failed"
        ) {
          const languageFailure =
            statusData?.failure;

          const projectFailure =
            statusData?.projectFailure;

          const failureCode =
            projectFailure?.code ||
            languageFailure?.code;

          const failureMessage =
            projectFailure?.message ||
            languageFailure?.message;

          const details = [
            failureCode
              ? `code: ${failureCode}`
              : null,
            failureMessage || null,
          ]
            .filter(Boolean)
            .join(" — ");

          throw new Error(
            details
              ? `ElevenLabs dubbing failed — ${details}`
              : "ElevenLabs reported that the dubbing job failed without a detailed reason.",
          );
        }

        setMessage(
          `Creating ${targetLanguage === "es" ? "Spanish" : "English"} handoff... ${
            statusData.status ??
            "processing"
          }`,
        );
      }

      throw new Error(
        "The dubbing job took too long to finish.",
      );
    } catch (error) {
      console.error(error);

      setStatus("error");

      setMessage(
        error instanceof Error
          ? `${error.message} Your recording is still here — you can try again.`
          : "Something went wrong. Your recording is still here — you can try again.",
      );
    }
  }

  function resetRecording() {
    clearRecordingTimers();

    if (recordingUrl) {
      URL.revokeObjectURL(
        recordingUrl,
      );
    }

    mediaStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop(),
      );

    mediaStreamRef.current = null;

    setRecordingBlob(null);
    setRecordingUrl(null);

    setDubbedAudioUrl(null);
    setRecipientUrl(null);
    setTagUrl(null);

    setSavedOriginalAudioUrl(
      null,
    );

    setCompletedDub(null);
    setCleanedRecordingBlob(null);

    setRecordingSeconds(0);
    setMessage("");
    setProcessStage("idle");
    setStatus("idle");
  }

  const formattedTime =
    `0:${recordingSeconds
      .toString()
      .padStart(2, "0")}`;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-7 text-white sm:px-6 sm:py-9">
      <div className="mx-auto max-w-2xl">
        <header className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
            HANDOFF
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pass on more than the appliance.
          </h1>

          <p className="mt-3 max-w-xl text-base leading-7 text-slate-400">
            Record useful details about a refurbished appliance
            and turn them into a spoken handoff for its next home.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-6">
          <label
            htmlFor="appliance"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Appliance
          </label>

          <input
            id="appliance"
            value={appliance}
            disabled={
              status === "dubbing"
            }
            onChange={(event) =>
              setAppliance(
                event.target.value,
              )
            }
            className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:opacity-60"
          />

          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-slate-300">
              Voice handoff language
            </p>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-center">
                <p className="text-xs text-slate-500">
                  I&apos;m speaking
                </p>

                <p className="mt-1 font-medium text-white">
                  {sourceLanguage === "en"
                    ? "English"
                    : "Español"}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  Boolean(recordingBlob) ||
                  status === "recording" ||
                  status === "dubbing"
                }
                onClick={() =>
                  setSourceLanguage((current) =>
                    current === "en" ? "es" : "en"
                  )
                }
                aria-label="Swap source and recipient languages"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-lg text-emerald-400 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ⇄
              </button>

              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-center">
                <p className="text-xs text-slate-500">
                  Recipient
                </p>

                <p className="mt-1 font-medium text-white">
                  {targetLanguage === "en"
                    ? "English"
                    : "Español"}
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Choose the direction before recording.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
            <p className="text-sm font-medium text-slate-300">
              Technician handoff
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              In 30 seconds or less,
              share what was repaired,
              what was tested,
              how to get started,
              and anything packed with
              the appliance.
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              <span className="font-medium text-slate-400">
                Example:
              </span>{" "}
              “We replaced the drain pump.
              Hold Start for two seconds.
              The inlet hose is inside the drum.”
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {status !==
                "recording" && (
                <button
                  type="button"
                  onClick={
                    startRecording
                  }
                  disabled={
                    status ===
                    "dubbing"
                  }
                  className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  🎙 Record handoff
                </button>
              )}

              {status ===
                "recording" && (
                <>
                  <button
                    type="button"
                    onClick={
                      stopRecording
                    }
                    className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400"
                  >
                    ■ Stop recording
                  </button>

                  <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                    {formattedTime} /
                    0:30
                  </div>
                </>
              )}

              {recordingBlob &&
                status !==
                  "recording" &&
                status !==
                  "dubbing" && (
                  <button
                    type="button"
                    onClick={
                      resetRecording
                    }
                    className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Record again
                  </button>
                )}
            </div>

            {recordingUrl && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Review original
                </p>

                <audio
                  className="w-full"
                  controls
                  preload="metadata"
                  src={
                    recordingUrl
                  }
                />
              </div>
            )}
          </div>

          {recordingBlob &&
            status !==
              "recording" && (
              <button
                type="button"
                onClick={
                  createHandoff
                }
                disabled={
                  status ===
                  "dubbing"
                }
                className="mt-5 w-full rounded-xl bg-white px-5 py-4 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
              >
                {status ===
                "dubbing"
                  ? "Creating HANDOFF..."
                  : status ===
                      "error"
                    ? "Try again"
                    : "Create HANDOFF"}
              </button>
            )}

          {status ===
            "dubbing" && (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-white">
                Preparing this
                HANDOFF
              </p>

              <div className="mt-4 space-y-3">
                <ProcessStep
                  label="Enhance voice clarity"
                  state={
                    processStage === "cleaning"
                      ? "active"
                      : processStage === "idle"
                        ? "waiting"
                        : "complete"
                  }
                />

                <ProcessStep
                  label="Save enhanced recording"
                  state={
                    processStage === "saving"
                      ? "active"
                      : processStage === "cleaning" ||
                          processStage === "idle"
                        ? "waiting"
                        : "complete"
                  }
                />

                <ProcessStep
                  label={`Create ${
                    targetLanguage === "es"
                      ? "Spanish"
                      : "English"
                  } voice handoff`}
                  state={
                    processStage === "dubbing"
                      ? "active"
                      : processStage === "accessibility" ||
                          processStage === "ready"
                        ? "complete"
                        : "waiting"
                  }
                />

                <ProcessStep
                  label="Prepare readable handoff"
                  state={
                    processStage === "accessibility"
                      ? "active"
                      : processStage === "ready"
                        ? "complete"
                        : "waiting"
                  }
                />

                <ProcessStep
                  label="Prepare recipient QR tag"
                  state={
                    processStage === "ready"
                      ? "complete"
                      : "waiting"
                  }
                />
              </div>
            </div>
          )}

          {message && (
            <p
              aria-live="polite"
              className={`mt-4 text-sm ${
                status === "error"
                  ? "text-red-300"
                  : status ===
                      "completed"
                    ? "text-emerald-300"
                    : "text-slate-400"
              }`}
            >
              {message}
            </p>
          )}

          {status ===
              "completed" &&
            dubbedAudioUrl &&
            recipientUrl &&
            tagUrl && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-sm font-semibold text-emerald-300">
                  ✓ HANDOFF ready
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {appliance.trim() ||
                    "Refurbished appliance"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {sourceLanguage === "en"
                    ? "English original"
                    : "Español original"}{" · "}
                  {targetLanguage === "en"
                    ? "English handoff"
                    : "Español (Spanish) handoff"}
                </p>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Review{" "}
                    {targetLanguage === "es"
                      ? "Spanish"
                      : "English"}
                  </p>

                  <audio
                    className="w-full"
                    controls
                    preload="metadata"
                    src={
                      dubbedAudioUrl
                    }
                  />
                </div>

                <div className="mt-6 border-t border-emerald-500/20 pt-5">
                  <p className="text-sm font-semibold">
                    Ready to travel
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Attach this QR tag
                    to the appliance.
                  </p>

                  <div className="mt-4 inline-block rounded-2xl bg-white p-3">
                    <Image
                      src={`/api/qr?data=${encodeURIComponent(
                        recipientUrl,
                      )}`}
                      width={220}
                      height={220}
                      alt="QR code for this HANDOFF"
                      unoptimized
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={
                        recipientUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-xl border border-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                    >
                      Recipient view ↗
                    </a>

                    <a
                      href={tagUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                    >
                      Printable tag ↗
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

function ProcessStep({
  label,
  state,
}: {
  label: string;
  state:
    | "waiting"
    | "active"
    | "complete";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          state === "complete"
            ? "bg-emerald-400 text-slate-950"
            : state === "active"
              ? "border border-emerald-400 bg-emerald-400/10 text-emerald-300"
              : "border border-slate-700 text-slate-600"
        }`}
      >
        {state ===
        "complete"
          ? "✓"
          : state ===
              "active"
            ? "•"
            : ""}
      </div>

      <p
        className={`text-sm ${
          state === "complete"
            ? "text-slate-300"
            : state ===
                "active"
              ? "font-medium text-white"
              : "text-slate-600"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
