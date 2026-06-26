import Link from "next/link";
import { ChevronRight, Heart } from "lucide-react";
import { selectedStanceLabels, trickStanceLabels } from "@/lib/trickStance";
import type { Trick } from "@/lib/types";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";

export default function TrickCard({ trick, compact=false, showUserData=true, selectedStance="regular" }: { trick:Trick; compact?:boolean; showUserData?:boolean; selectedStance?:SelectedTrickDisplayStance }) {
  return <Link href={`/tricks/${trick.id}?stance=${selectedStance}`} className={`card group block ${compact ? "!rounded-2xl !p-3" : ""}`}><div className="flex items-center gap-3"><div className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 font-black text-glacier ${compact ? "h-11 w-11 text-xs" : "h-16 w-16"}`}>Lv.{trick.difficulty}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-black">{trick.nameJa}</h3>{showUserData&&trick.favorite&&<Heart size={15} className="fill-rose-400 text-rose-400"/>}</div><p className="mt-0.5 text-xs text-slate-400">{trick.nameEn}</p><div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-ice px-2 py-1 text-[10px] font-bold text-glacier">{trick.category}</span><span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">対応: {trickStanceLabels[trick.stance ?? "both"]}</span><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">{selectedStanceLabels[selectedStance]}</span>{showUserData&&<span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{trick.masteryStatus}</span>}</div></div><ChevronRight size={18} className="text-slate-300"/></div></Link>;
}
