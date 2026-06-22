"use client";

import Link from "next/link";
import { Clock,Dumbbell,Footprints,Sparkles } from "lucide-react";
import { useState } from "react";
import OffTrainingDiagnosisModal from "@/components/OffTrainingDiagnosisModal";
import OffTrainingPlanView from "@/components/OffTrainingPlanView";
import PageHeader from "@/components/PageHeader";
import SectionTitle from "@/components/SectionTitle";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { generateOffTrainingPlan } from "@/lib/offTrainingPlanner";
import { initialTricks,trainings } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import type { OffTrainingPreferences,TrainingCategory } from "@/lib/types";

const categories:{name:TrainingCategory;icon:typeof Dumbbell;color:string}[]=[{name:"シバカツ",icon:Footprints,color:"text-sky-500"},{name:"筋トレ",icon:Dumbbell,color:"text-orange-500"},{name:"柔軟",icon:Sparkles,color:"text-emerald-500"}];
export default function TrainingPage(){
  const {user,loading}=useAuth();const [plan,refresh]=useSupabaseData(dataRepository.getOffTrainingPlan);const [rebuilding,setRebuilding]=useState(false);
  async function complete(preferences:OffTrainingPreferences){if(!user)throw new Error("ログインが必要です");const next=generateOffTrainingPlan(preferences,user.id);await dataRepository.saveOffTrainingPlan(preferences,next);const saved=await dataRepository.getOffTrainingPlan();if(!saved)throw new Error("プランを保存できませんでした。SQL設定を確認してください。");await refresh();setRebuilding(false);}
  const showDiagnosis=Boolean(user&&plan!==undefined&&(plan===null||rebuilding));
  return <main><PageHeader title="オフトレ" eyebrow="OFF-SNOW TRAINING"/>{!loading&&!user&&<div className="card mb-7 py-10 text-center"><p className="text-sm text-slate-500">ログインすると、あなた専用のオフトレプランを作成できます。</p><Link href="/profile" className="btn-primary mt-4">Googleでログイン</Link></div>}{user&&plan&&<OffTrainingPlanView plan={plan} onRebuild={()=>setRebuilding(true)}/>} {showDiagnosis&&<OffTrainingDiagnosisModal onComplete={complete}/>}<div className="space-y-7">{categories.map(({name,icon:Icon,color})=><section key={name}><SectionTitle title={name}/><div className="space-y-3">{trainings.filter((t)=>t.category===name).map((training)=><article key={training.id} className="card"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50"><Icon className={color} size={21}/></div><div><h3 className="font-black">{training.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{training.description}</p><p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400"><Clock size={12}/>{training.minutes}分</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{training.relatedTrickIds.map((id)=><a key={id} href={`/tricks/${id}`} className="rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold text-glacier">{initialTricks.find((t)=>t.id===id)?.nameJa}</a>)}</div></article>)}</div></section>)}</div></main>;
}
