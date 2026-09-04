"use client";

import { useState } from "react";

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

  const activeAudioUrl =
    language === "spanish" ? spanishAudioUrl : originalAudioUrl;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Listen in
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setLanguage("english")}
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
          onClick={() => setLanguage("spanish")}
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
          key={activeAudioUrl}
          className="w-full"
          controls
          preload="metadata"
          src={activeAudioUrl}
        />
      </div>
    </div>
  );
}
