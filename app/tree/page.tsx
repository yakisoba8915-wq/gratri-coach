import { ArrowDown, CheckCircle2, Circle, CircleDot } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { initialTricks } from "@/lib/mockData";

export default function TreePage() {
  const levels=[...new Set(initialTricks.map((t)=>t.difficulty))].sort((a,b)=>a-b);
  return <main><PageHeader title="技ツリー" eyebrow="TRICK TREE" back="/tricks"/><p className="mb-5 text-sm leading-6 text-slate-500">基礎から高難度へ。前提技を確認しながら、次の一歩を選びましょう。</p><div className="space-y-3">{levels.map((level,index)=><div key={level}>{index>0&&<ArrowDown className="mx-auto mb-3 text-slate-300"/>}<section className="card"><p className="mb-3 text-xs font-black text-glacier">LEVEL {level}</p><div className="space-y-3">{initialTricks.filter((t)=>t.difficulty===level).map((trick)=>{const Icon=trick.masteryStatus==="完成"?CheckCircle2:trick.masteryStatus==="未挑戦"?Circle:CircleDot; const prerequisiteNames=trick.prerequisites.map((id)=>initialTricks.find((t)=>t.id===id)?.nameJa).filter(Boolean); return <a href={`/tricks/${trick.id}`} key={trick.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3"><Icon size={19} className="mt-0.5 shrink-0 text-glacier"/><div><p className="font-black">{trick.nameJa}</p>{prerequisiteNames.length>0&&<p className="mt-1 text-[11px] text-slate-400">前提：{prerequisiteNames.join("・")}</p>}</div></a>})}</div></section></div>)}</div></main>;
}
