"use client";

import {
  useRef,
  useState,
} from "react";

export type LanguageCode =
  | "en"
  | "es";

type PlaybackMode =
  | "translated"
  | "source";

type HandoffPlayerProps = {
  originalAudioUrl: string;
  translatedAudioUrl: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  sourceText: string;
  translatedText: string;
};

const LANGUAGE_NAMES: Record<
  LanguageCode,
  {
    primary: string;
    secondary: string;
  }
> = {
  en: {
    primary: "English",
    secondary: "English",
  },
  es: {
    primary: "Español",
    secondary: "Spanish",
  },
};

export default function HandoffPlayer({
  originalAudioUrl,
  translatedAudioUrl,
  sourceLanguage,
  targetLanguage,
  sourceText,
  translatedText,
}: HandoffPlayerProps) {
  const [
    playbackMode,
    setPlaybackMode,
  ] =
    useState<PlaybackMode>(
      "translated",
    );

  const [
    audioError,
    setAudioError,
  ] = useState(false);

  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    );

  const isTranslated =
    playbackMode ===
    "translated";

  const activeAudioUrl =
    isTranslated
      ? translatedAudioUrl
      : originalAudioUrl;

  const activeText =
    isTranslated
      ? translatedText
      : sourceText;

  const activeLanguage =
    isTranslated
      ? targetLanguage
      : sourceLanguage;

  const translatedLabel =
    LANGUAGE_NAMES[
      targetLanguage
    ];

  const sourceLabel =
    LANGUAGE_NAMES[
      sourceLanguage
    ];

  function changeMode(
    nextMode: PlaybackMode,
  ) {
    if (
      nextMode === playbackMode
    ) {
      return;
    }

    setPlaybackMode(nextMode);
    setAudioError(false);
  }

  function retryAudio() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    setAudioError(false);
    audio.load();

    audio
      .play()
      .catch(() => {
        setAudioError(true);
      });
  }

  return (
    <div>
      <div
        className="grid grid-cols-2 gap-2"
        aria-label="Handoff language"
      >
        <button
          type="button"
          onClick={() =>
            changeMode(
              "translated",
            )
          }
          aria-pressed={
            isTranslated
          }
          className={`min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
            isTranslated
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500"
          }`}
        >
          <span
            lang={
              targetLanguage
            }
          >
            {
              translatedLabel.primary
            }
          </span>

          <span className="block text-xs font-normal opacity-70">
            Recipient
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            changeMode(
              "source",
            )
          }
          aria-pressed={
            !isTranslated
          }
          className={`min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
            !isTranslated
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500"
          }`}
        >
          <span
            lang={
              sourceLanguage
            }
          >
            {
              sourceLabel.primary
            }
          </span>

          <span className="block text-xs font-normal opacity-70">
            Source
          </span>
        </button>
      </div>

      <section
        className="mt-5"
        aria-labelledby="listen-heading"
      >
        <h2
          id="listen-heading"
          className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
        >
          Listen
        </h2>

        <audio
          ref={audioRef}
          key={activeAudioUrl}
          className="mt-3 w-full"
          controls
          preload="metadata"
          src={activeAudioUrl}
          aria-label={`${LANGUAGE_NAMES[activeLanguage].secondary} handoff audio`}
          onError={() =>
            setAudioError(true)
          }
          onLoadedMetadata={() =>
            setAudioError(false)
          }
        />

        {audioError && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"
          >
            <p className="text-sm text-amber-100">
              Audio couldn&apos;t
              load. You can still
              read the handoff below.
            </p>

            <button
              type="button"
              onClick={retryAudio}
              className="mt-2 min-h-11 rounded-lg px-2 text-sm font-semibold text-amber-200 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Try audio again
            </button>
          </div>
        )}
      </section>

      <section
        className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-4"
        aria-labelledby="read-heading"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="read-heading"
            className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
          >
            Read handoff
          </h2>

          <span className="text-xs text-slate-500">
            Text alternative
          </span>
        </div>

        {activeText ? (
          <p
            lang={
              activeLanguage
            }
            aria-live="polite"
            className="mt-3 text-base leading-7 text-slate-100 sm:text-lg"
          >
            {activeText}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Readable text is
            temporarily unavailable.
            Please use the audio
            handoff above.
          </p>
        )}
      </section>
    </div>
  );
}
