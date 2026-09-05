"use client";

import { useRef, useState } from "react";

type Language = "spanish" | "english";

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
    if (nextLanguage === language) {
      return;
    }

    setLanguage(nextLanguage);
    setAudioError(false);
  }

  function retryAudio() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setAudioError(false);
    audio.load();

    audio.play().catch(() => {
      setAudioError(true);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => changeLanguage("spanish")}
          aria-pressed={language === "spanish"}
          className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
            language === "spanish"
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-300"
          }`}
        >
          Español
          <span className="block text-xs font-normal opacity-70">
            Spanish
          </span>
        </button>

        <button
          type="button"
          onClick={() => changeLanguage("english")}
          aria-pressed={language === "english"}
          className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
            language === "english"
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-300"
          }`}
        >
          English
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
        onError={() => setAudioError(true)}
        onLoadedMetadata={() => setAudioError(false)}
      />

      {audioError && (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-100">
            Audio couldn&apos;t load. Check your connection and try again.
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
