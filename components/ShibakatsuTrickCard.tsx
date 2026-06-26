import { AlertTriangle, Link2, Lightbulb, Lock } from "lucide-react";
import { formatTrickName } from "@/lib/trickDisplay";
import { selectedStanceLabels, trickStanceLabels } from "@/lib/trickStance";
import type { Trick } from "@/lib/types";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";

export default function ShibakatsuTrickCard({ trick, selectedStance = "regular", canUse = true }: { trick: Trick; selectedStance?: SelectedTrickDisplayStance; canUse?: boolean }) {
  return (
    <article className={`card ${canUse ? "" : "border-amber-100 bg-amber-50/35"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-sm font-black ${canUse ? "bg-gradient-to-br from-emerald-100 to-cyan-100 text-emerald-700" : "bg-white text-amber-600"}`}>
          {canUse ? `Lv.${trick.difficulty}` : <Lock size={21} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black">{formatTrickName(trick.nameJa, selectedStance)}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{trick.category}</span>
            {!canUse && <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">有料トリック</span>}
            <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">対応: {trickStanceLabels[trick.stance ?? "both"]}</span>
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">{selectedStanceLabels[selectedStance]}</span>
          </div>
        </div>
      </div>

      {!canUse && (
        <div className="mt-4 rounded-2xl bg-white px-3 py-3 text-xs font-bold leading-5 text-amber-700">
          このシバカツトリックはPremium限定です。Premium登録、管理者、βテスターで利用できます。
        </div>
      )}

      {canUse && trick.relatedSnowTrick && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-ice px-3 py-2 text-xs font-bold leading-5 text-glacier">
          <Link2 className="mt-0.5 shrink-0" size={14} />
          関連する雪上トリック：{formatTrickName(trick.relatedSnowTrick, selectedStance)}
        </p>
      )}
      {canUse && trick.description && <p className="mt-4 text-sm leading-6 text-slate-600">{trick.description}</p>}
      {canUse && trick.howTo[0] && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-3">
          <p className="flex items-center gap-2 text-xs font-black text-amber-700"><Lightbulb size={14} />練習のコツ</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{trick.howTo[0]}</p>
        </div>
      )}
      {canUse && trick.cautions && (
        <div className="mt-3 rounded-2xl bg-rose-50 p-3">
          <p className="flex items-center gap-2 text-xs font-black text-rose-600"><AlertTriangle size={14} />注意点</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{trick.cautions}</p>
        </div>
      )}
    </article>
  );
}
