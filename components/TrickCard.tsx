"use client";

import Link from "next/link";
import { ChevronRight, Heart, Lock } from "lucide-react";
import { useState } from "react";
import PremiumLockedTrickModal from "./PremiumLockedTrickModal";
import { formatTrickName } from "@/lib/trickDisplay";
import type { Trick } from "@/lib/types";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";

export default function TrickCard({
  trick,
  compact = false,
  showUserData = true,
  selectedStance = "regular",
  canUse = true,
}: {
  trick: Trick;
  compact?: boolean;
  showUserData?: boolean;
  selectedStance?: SelectedTrickDisplayStance;
  canUse?: boolean;
}) {
  const [premiumOpen, setPremiumOpen] = useState(false);

  if (!canUse) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPremiumOpen(true)}
          className={`card group block w-full border-amber-100 bg-amber-50/45 text-left opacity-80 transition active:scale-[.99] ${
            compact ? "!rounded-2xl !p-3" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`grid shrink-0 place-items-center rounded-2xl bg-white text-amber-600 ${compact ? "h-11 w-11" : "h-14 w-14"}`}>
              <Lock size={compact ? 17 : 20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-black text-slate-800">{formatTrickName(trick.nameJa, selectedStance)}</h3>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                <Lock size={11} />
                Premium限定
              </p>
            </div>
            <ChevronRight size={18} className="text-amber-300" />
          </div>
        </button>
        <PremiumLockedTrickModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      </>
    );
  }

  return (
    <Link href={`/tricks/${trick.id}?stance=${selectedStance}`} className={`card group block ${compact ? "!rounded-2xl !p-3" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 font-black text-glacier ${compact ? "h-11 w-11 text-xs" : "h-16 w-16"}`}>
          Lv.{trick.difficulty}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-black">{formatTrickName(trick.nameJa, selectedStance)}</h3>
            {showUserData && trick.favorite && <Heart size={15} className="fill-rose-400 text-rose-400" />}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{trick.nameEn}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-ice px-2 py-1 text-[10px] font-bold text-glacier">{trick.category}</span>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">{selectedStance === "regular" ? "レギュラー表示" : "グーフィー表示"}</span>
            {showUserData && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{trick.masteryStatus}</span>}
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300" />
      </div>
    </Link>
  );
}
