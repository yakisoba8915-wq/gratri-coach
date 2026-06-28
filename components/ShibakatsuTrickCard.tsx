"use client";

import { AlertTriangle, Link2, Lightbulb, Lock } from "lucide-react";
import { useState } from "react";
import PremiumLockedTrickModal from "./PremiumLockedTrickModal";
import { formatTrickName } from "@/lib/trickDisplay";
import { selectedStanceLabels, trickStanceLabels } from "@/lib/trickStance";
import type { Trick } from "@/lib/types";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";

export default function ShibakatsuTrickCard({ trick, selectedStance = "regular", canUse = true }: { trick: Trick; selectedStance?: SelectedTrickDisplayStance; canUse?: boolean }) {
  const [premiumOpen, setPremiumOpen] = useState(false);

  if (!canUse) {
    return (
      <>
        <button type="button" onClick={() => setPremiumOpen(true)} className="card w-full border-amber-100 bg-amber-50/45 text-left opacity-80 transition active:scale-[.99]">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-600">
              <Lock size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-black text-slate-800">{formatTrickName(trick.nameJa, selectedStance)}</h3>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                <Lock size={11} />
                Premium限定
              </p>
            </div>
          </div>
        </button>
        <PremiumLockedTrickModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      </>
    );
  }

  return (
    <article className="card">
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-sm font-black text-emerald-700">
          Lv.{trick.difficulty}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black">{formatTrickName(trick.nameJa, selectedStance)}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{trick.category}</span>
            <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">対応 {trickStanceLabels[trick.stance ?? "both"]}</span>
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">{selectedStanceLabels[selectedStance]}</span>
          </div>
        </div>
      </div>

      {trick.relatedSnowTrick && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-ice px-3 py-2 text-xs font-bold leading-5 text-glacier">
          <Link2 className="mt-0.5 shrink-0" size={14} />
          関連する雪上トリック：{formatTrickName(trick.relatedSnowTrick, selectedStance)}
        </p>
      )}
      {trick.description && <p className="mt-4 text-sm leading-6 text-slate-600">{trick.description}</p>}
      {trick.howTo[0] && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-3">
          <p className="flex items-center gap-2 text-xs font-black text-amber-700"><Lightbulb size={14} />練習のコツ</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{trick.howTo[0]}</p>
        </div>
      )}
      {trick.cautions && (
        <div className="mt-3 rounded-2xl bg-rose-50 p-3">
          <p className="flex items-center gap-2 text-xs font-black text-rose-600"><AlertTriangle size={14} />注意点</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{trick.cautions}</p>
        </div>
      )}
    </article>
  );
}
