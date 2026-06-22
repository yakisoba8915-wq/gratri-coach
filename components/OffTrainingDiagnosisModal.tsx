"use client";

import { Bot,Sparkles } from "lucide-react";
import { useState } from "react";
import type { OffTrainingEquipment,OffTrainingIntensity,OffTrainingPreferences } from "@/lib/types";

interface Question {key:keyof OffTrainingPreferences;text:string;options:{label:string;value:string|number}[];}
const questions:Question[]=[
  {key:"equipment",text:"シバカツボード、トリックスノー、または類似の練習器具を持っていますか？",options:["シバカツボードを持っている","トリックスノーを持っている","どちらも持っていない","これから購入予定"].map((value)=>({label:value,value}))},
  {key:"weeklyDays",text:"週に何日オフトレできますか？",options:[{label:"1日",value:1},{label:"2日",value:2},{label:"3日",value:3},{label:"4日以上",value:4}]},
  {key:"sessionMinutes",text:"1回あたり何分トレーニングできますか？",options:[15,30,45,60].map((value)=>({label:value===60?"60分以上":`${value}分`,value}))},
  {key:"location",text:"トレーニング場所はどこが多いですか？",options:["家","公園","ジム","体育館","雪上施設・室内ゲレンデ"].map((value)=>({label:value,value}))},
  {key:"gymAvailable",text:"ジムなどの設備は使えますか？",options:["使える","使えない","たまに使える"].map((value)=>({label:value,value}))},
  {key:"focusAbility",text:"今一番伸ばしたい能力は何ですか？",options:["プレス安定","弾き","回転力","着地安定","柔軟性","体力"].map((value)=>({label:value,value}))},
  {key:"targetTrickType",text:"今シーズン伸ばしたい技は何ですか？",options:["オーリー系","ノーリー系","プレス系","乗り系","360系","540系"].map((value)=>({label:value,value}))},
  {key:"exerciseHabit",text:"現在の運動習慣は？",options:["ほぼなし","週1回程度","週2〜3回","週4回以上"].map((value)=>({label:value,value}))},
  {key:"injuryConcern",text:"膝・腰・足首などに不安はありますか？",options:["なし","膝","腰","足首","複数ある"].map((value)=>({label:value,value}))},
  {key:"intensity",text:"希望するトレーニング強度は？",options:["軽め","普通","きつめ"].map((value)=>({label:value,value}))}
];

export default function OffTrainingDiagnosisModal({onComplete}:{onComplete:(preferences:OffTrainingPreferences)=>Promise<void>}){
  const [index,setIndex]=useState(0);const [answers,setAnswers]=useState<Record<string,string|number>>({});const [pending,setPending]=useState(false);const [error,setError]=useState("");
  const current=questions[index];
  async function answer(value:string|number){const next={...answers,[current.key]:value};setAnswers(next);if(index<questions.length-1){setIndex(index+1);return;}const preferences:OffTrainingPreferences={equipment:next.equipment as OffTrainingEquipment,weeklyDays:Number(next.weeklyDays),sessionMinutes:Number(next.sessionMinutes),location:String(next.location),gymAvailable:String(next.gymAvailable),focusAbility:String(next.focusAbility),targetTrickType:String(next.targetTrickType),exerciseHabit:String(next.exerciseHabit),injuryConcern:String(next.injuryConcern),intensity:next.intensity as OffTrainingIntensity};setPending(true);setError("");try{await onComplete(preferences);}catch(cause){setError(cause instanceof Error?cause.message:"プランを保存できませんでした");setPending(false);}}
  return <div className="fixed inset-0 z-[90] grid place-items-end bg-navy/45 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="diagnosis-title"><div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-[2rem] bg-white p-5 shadow-2xl"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-ice"><Bot className="text-glacier"/></div><div><h2 id="diagnosis-title" className="font-black">オフトレAI診断</h2><p className="text-xs text-slate-400">QUESTION {index+1} / {questions.length}</p></div></div><div className="overflow-y-auto py-5"><div className="mb-3 flex gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ice"><Sparkles size={15} className="text-glacier"/></div><div className="rounded-2xl rounded-tl-sm bg-slate-100 p-3 text-sm leading-6">{index===0&&<p className="mb-2 text-xs text-slate-500">あなたに合ったオフトレプランを作るために、いくつか質問します。</p>}<strong>{current.text}</strong></div></div><div className="ml-10 grid gap-2">{current.options.map((option)=><button key={String(option.value)} disabled={pending} onClick={()=>answer(option.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold transition hover:border-glacier hover:bg-ice disabled:opacity-50">{option.label}</button>)}</div>{error&&<p className="mt-3 text-center text-xs font-bold text-rose-500">{error}</p>}{pending&&<p className="mt-4 text-center text-sm font-bold text-glacier">プランを生成しています...</p>}</div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-glacier transition-all" style={{width:`${((index+1)/questions.length)*100}%`}}/></div></div></div>;
}
