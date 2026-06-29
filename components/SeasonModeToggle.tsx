"use client";

import { useEffect, useState } from "react";
import type { SeasonMode } from "@/lib/types";

const SEASON_MODE_KEY = "gratri_season_mode";

const modes: Array<{ value: SeasonMode; label: string; description: string }> = [
  { value: "in_season", label: "シーズン中", description: "雪上練習・動画・次回課題を中心に表示" },
  { value: "off_season", label: "オフシーズン", description: "オフトレ・シバカツ・週間プランを中心に表示" },
];

interface SeasonModeToggleProps {
  value: SeasonMode;
  onChange: (mode: SeasonMode) => void;
}

export default function SeasonModeToggle({ value, onChange }: SeasonModeToggleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SEASON_MODE_KEY);
    if (stored === "in_season" || stored === "off_season") {
      onChange(stored);
    }
    setMounted(true);
  }, [onChange]);

  function selectMode(mode: SeasonMode): void {
    onChange(mode);
    localStorage.setItem(SEASON_MODE_KEY, mode);
  }

  const currentMode = mounted ? value : "off_season";
  const currentDescription = modes.find((mode) => mode.value === currentMode)?.description;

  return (
    <section className="mb-5 rounded-3xl border border-white/80 bg-white/80 p-2 shadow-card backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => {
          const active = currentMode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => selectMode(mode.value)}
              aria-pressed={active}
              className={`min-h-11 rounded-2xl px-3 py-2 text-sm font-black transition ${
                active
                  ? "bg-navy text-white shadow-lg shadow-navy/15"
                  : "bg-slate-100 text-slate-500 hover:bg-ice hover:text-glacier"
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      {currentDescription && <p className="px-2 pt-2 text-[11px] font-bold text-slate-400">{currentDescription}</p>}
    </section>
  );
}
