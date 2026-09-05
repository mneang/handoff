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
  | "original";

type HandoffPlayerProps = {
  originalAudioUrl: string;
  translatedAudioUrl: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
};

const LANGUAGE_NAMES: Record<
  LanguageCode,
  {
    primary: string;
    secondary?: string;
  }
> = {
  en: {
    primary: "English",
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

  const activeAudioUrl =
    playbackMode ===
    "translated"
      ? translatedAudioUrl
      : originalAudioUrl;

  const translatedLabel =
    LANGUAGE_NAMES[
      targetLanguage
    ];

  const originalLabel =
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
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            changeMode(
              "translated",
            )
          }
          aria-pressed={
            playbackMode ===
            "translated"
          }
          className={`min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
            playbackMode ===
            "translated"
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-300"
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
            {translatedLabel.secondary ??
              "Recipient"}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            changeMode(
              "original",
            )
          }
          aria-pressed={
            playbackMode ===
            "original"
          }
          className={`min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
            playbackMode ===
            "original"
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-300"
          }`}
        >
          <span
            lang={
              sourceLanguage
            }
          >
            {
              originalLabel.primary
            }
          </span>

          <span className="block text-xs font-normal opacity-70">
            Original
          </span>
        </button>
      </div>

      <audio
        ref={audioRef}
        key={activeAudioUrl}
        className="mt-4 w-full"
        controls
        preload="metadata"
        src={activeAudioUrl}
        onError={() =>
          setAudioError(true)
        }
        onLoadedMetadata={() =>
          setAudioError(false)
        }
      />

      {audioError && (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-100">
            Audio couldn&apos;t
            load. Check your
            connection and try
            again.
          </p>

          <button
            type="button"
            onClick={retryAudio}
            className="mt-2 text-sm font-semibold text-amber-200 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
