"use client";

import { useRef, useState } from "react";

type Language = "english" | "spanish";

type HandoffPlayerProps = {
  originalAudioUrl: string;
  spanishAudioUrl: string;
};

export default function HandoffPlayer({
  originalAudioUrl,
  spanishAudioUrl,
}: HandoffPlayerProps) {
  const [language, setLanguage] = useState<Language>("spanish");
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeAudioUrl =
    language === "spanish" ? spanishAudioUrl : originalAudioUrl;

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setAudioError(false);
  }

  function retryAudio() {
    setAudioError(false);

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.load();

    audio.play().catch(() => {
      setAudioError(true);
    });
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Listen in
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => changeLanguage("english")}
          aria-pressed={language === "english"}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            language === "english"
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
          }`}
        >
          English
          <span className="mt-1 block text-xs font-normal opacity-70">
            Original
          </span>
        </button>

        <button
          type="button"
          onClick={() => changeLanguage("spanish")}
          aria-pressed={language === "spanish"}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            language === "spanish"
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
          }`}
        >
          Español
          <span className="mt-1 block text-xs font-normal opacity-70">
            Spanish
          </span>
        </button>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium text-slate-300">
          {language === "spanish"
            ? "Español (Spanish)"
            : "English (Original)"}
        </p>

        <audio
          ref={audioRef}
          key={activeAudioUrl}
          className="w-full"
          controls
          preload="metadata"
          src={activeAudioUrl}
          onError={() => setAudioError(true)}
          onLoadedMetadata={() => setAudioError(false)}
        />

        {audioError && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-200">
              This audio could not be loaded.
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-200/70">
              Check your connection and try again.
            </p>

            <button
              type="button"
              onClick={retryAudio}
              className="mt-3 rounded-lg border border-amber-400/30 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/10"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
