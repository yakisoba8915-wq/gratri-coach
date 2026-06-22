"use client";

import { Check, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialGoals, initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import type { Goal, GoalType } from "@/lib/types";

export default function GoalsPage() {
  const [stored,refresh]=useSupabaseData(dataRepository.getGoals); const goals=stored??initialGoals; const [open,setOpen]=useState(false); const [season,setSeason]=useState("2026-27"); const [type,setType]=useState<GoalType>("技をメイクする"); const [trickId,setTrickId]=useState(initialTricks[0].id); const [targetRate,setTargetRate]=useState(50);
  async function save(){const goal:Goal={id:`goal-${Date.now()}`,season,type,trickId,completed:false,...(type==="成功率を上げる"?{targetRate}:{})};await dataRepository.saveGoals([...goals,goal]);await refresh();setOpen(false)}
  async function update(id:string,patch:Partial<Goal>){await dataRepository.saveGoals(goals.map((g)=>g.id===id?{...g,...patch}:g));await refresh()} async function remove(id:string){await dataRepository.saveGoals(goals.filter((g)=>g.id!==id));await refresh()}
  const seasons=[...new Set(goals.map((g)=>g.season))];
  return <main><div className="flex items-start justify-between"><PageHeader title="目標管理" eyebrow="SEASON GOALS"/><button onClick={()=>setOpen(!open)} className="btn-primary !p-3" aria-label="目標追加"><Plus/></button></div>{open&&<section className="card mb-5 grid gap-3"><h2 className="font-black">新しい目標</h2><input className="field" value={season} onChange={(e)=>setSeason(e.target.value)} placeholder="2026-27"/><select className="field" value={type} onChange={(e)=>setType(e.target.value as GoalType)}><option>技をメイクする</option><option>成功率を上げる</option></select><select className="field" value={trickId} onChange={(e)=>setTrickId(e.target.value)}>{initialTricks.map((t)=><option key={t.id} value={t.id}>{t.nameJa}</option>)}</select>{type==="成功率を上げる"&&<label className="text-sm font-bold">目標成功率<input type="number" min="1" max="100" className="field mt-2" value={targetRate} onChange={(e)=>setTargetRate(Number(e.target.value))}/></label>}<button onClick={save} className="btn-primary"><Check size={17}/>追加する</button></section>}
    <div className="space-y-7">{seasons.map((s)=><section key={s}><div className="mb-3 flex items-center gap-2"><Target size={19} className="text-violet-500"/><h2 className="text-lg font-black">{s} Season</h2></div><div className="space-y-3">{goals.filter((g)=>g.season===s).map((goal)=>{const trick=initialTricks.find((t)=>t.id===goal.trickId);return <article key={goal.id} className={`card flex items-center gap-3 ${goal.completed?"opacity-60":""}`}><button onClick={()=>update(goal.id,{completed:!goal.completed})} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${goal.completed?"border-emerald-500 bg-emerald-500 text-white":"border-slate-200"}`}>{goal.completed&&<Check size={17}/>}</button><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-violet-500">{goal.type}</p><p className={`font-black ${goal.completed?"line-through":""}`}>{trick?.nameJa}{goal.targetRate?` ${goal.targetRate}%`:""}</p></div><button onClick={()=>remove(goal.id)} aria-label="削除" className="p-2 text-slate-300"><Trash2 size={17}/></button></article>})}</div></section>)}</div></main>;
}
