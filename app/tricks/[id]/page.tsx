"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, Dumbbell, ExternalLink, Heart, Play, Route } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressChart from "@/components/ProgressChart";
import { calculateTrickRate } from "@/lib/calculations";
import { initialPracticeLogs, initialTricks, trainings } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import { masteryStatuses } from "@/lib/types";
import { useSupabaseData } from "@/hooks/useSupabaseData";

export default function TrickDetailPage({ params }: { params:Promise<{ id:string }> }) {
  const { id } = use(params); const [storedTricks,refresh] = useSupabaseData(dataRepository.getTricks); const [storedLogs] = useSupabaseData(dataRepository.getLogs);
  const tricks = storedTricks ?? initialTricks; const logs = storedLogs ?? initialPracticeLogs; const trick = tricks.find((item)=>item.id===id); const [saved,setSaved] = useState(false);
  if (!trick) return <main><PageHeader title="トリックが見つかりません" back="/tricks"/></main>;
  const trickLogs = logs.filter((log)=>log.trickId===id); const rate = calculateTrickRate(logs,id); const prerequisites = trick.prerequisites.map((pid)=>tricks.find((t)=>t.id===pid)).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const related = trainings.filter((training)=>trick.relatedTrainings.includes(training.id));
  async function updateFavorite() { await dataRepository.saveTricks(tricks.map((item)=>item.id===id ? {...item,favorite:!item.favorite}:item)); await refresh(); setSaved(true); setTimeout(()=>setSaved(false),1000); }
  async function updateStatus(value:string) { if (!masteryStatuses.includes(value as (typeof masteryStatuses)[number])) return; await dataRepository.saveTricks(tricks.map((item)=>item.id===id ? {...item,masteryStatus:value as (typeof masteryStatuses)[number]}:item)); await refresh(); }
  return <main><PageHeader title={trick.nameJa} eyebrow={`${trick.category} ・ LV.${trick.difficulty}`} back="/tricks"/>
    <a href={trick.referenceVideos[0]} target="_blank" rel="noreferrer" className="mb-5 grid aspect-video place-items-center rounded-3xl bg-gradient-to-br from-navy to-glacier text-white shadow-xl"><div className="text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15"><Play className="ml-1" fill="white"/></span><p className="mt-3 text-sm font-bold">参考動画を検索</p></div></a>
    <div className="mb-5 flex gap-2"><button onClick={updateFavorite} className={`btn-primary flex-1 ${trick.favorite ? "!bg-rose-500" : ""}`}><Heart size={18} fill={trick.favorite ? "white":"none"}/>{saved ? "保存しました" : trick.favorite ? "お気に入り済み":"お気に入りに追加"}</button><select aria-label="習得状態" className="field max-w-40" value={trick.masteryStatus} onChange={(e)=>updateStatus(e.target.value)}>{masteryStatuses.map((s)=><option key={s}>{s}</option>)}</select></div>
    <section className="card mb-4"><h2 className="mb-3 flex items-center gap-2 font-black"><Check size={18} className="text-glacier"/>How To</h2><ol className="space-y-3">{trick.howTo.map((step,i)=><li key={step} className="flex gap-3 text-sm leading-6"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ice text-xs font-black text-glacier">{i+1}</span>{step}</li>)}</ol></section>
    <section className="card mb-4"><h2 className="mb-3 flex items-center gap-2 font-black"><Route size={18} className="text-violet-500"/>前提技</h2>{prerequisites.length ? <div className="flex flex-wrap gap-2">{prerequisites.map((item)=><Link key={item.id} href={`/tricks/${item.id}`} className="chip">{item.nameJa} →</Link>)}</div>:<p className="text-sm text-slate-400">前提技なし。ここから始められます。</p>}</section>
    <section className="card mb-4"><h2 className="mb-3 flex items-center gap-2 font-black"><CircleAlert size={18} className="text-orange-500"/>よくある失敗</h2><ul className="space-y-2 text-sm text-slate-600">{trick.commonMistakes.map((item)=><li key={item}>・{item}</li>)}</ul></section>
    <section className="card mb-4"><div className="flex items-center justify-between"><h2 className="font-black">自分の成功率</h2><strong className="text-2xl text-glacier">{rate}%</strong></div><ProgressChart logs={trickLogs}/></section>
    <section className="card"><h2 className="mb-3 flex items-center gap-2 font-black"><Dumbbell size={18} className="text-emerald-500"/>関連オフトレ</h2><div className="space-y-2">{related.map((item)=><Link key={item.id} href="/training" className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm font-bold">{item.name}<ExternalLink size={14} className="text-slate-400"/></Link>)}</div></section>
  </main>;
}
