"use client";

import { Bot,Check,Sparkles } from "lucide-react";
import { useState } from "react";
import type { OffTrainingEquipment,OffTrainingIntensity,OffTrainingPreferences } from "@/lib/types";

type AnswerValue=string|number|string[];
interface Question {key:keyof OffTrainingPreferences;text:string;multiple?:boolean;exclusive?:string;options:{label:string;value:string|number}[];}
const questions:Question[]=[
  {key:"equipment",text:"シバカツボード、トリックスノー、または類似の練習器具を持っていますか？",multiple:true,exclusive:"どれも持っていない",options:["シバカツボードを持っている","トリックスノーを持っている","その他の練習器具を持っている","どれも持っていない","これから購入予定"].map((value)=>({label:value,value}))},
  {key:"weeklyDays",text:"週に何日オフトレできますか？",options:[{label:"1日",value:1},{label:"2日",value:2},{label:"3日",value:3},{label:"4日以上",value:4}]},
  {key:"sessionMinutes",text:"1回あたり何分トレーニングできますか？",options:[15,30,45,60].map((value)=>({label:value===60?"60分以上":`${value}分`,value}))},
  {key:"location",text:"トレーニング場所はどこが多いですか？",multiple:true,options:["家","公園","ジム","体育館","雪上施設・室内ゲレンデ"].map((value)=>({label:value,value}))},
  {key:"gymAvailable",text:"ジムなどの設備は使えますか？",options:["使える","使えない","たまに使える"].map((value)=>({label:value,value}))},
  {key:"focusAbility",text:"今一番伸ばしたい能力は何ですか？",multiple:true,options:["プレス安定","弾き","回転力","着地安定","柔軟性","体力"].map((value)=>({label:value,value}))},
  {key:"targetTrickType",text:"今シーズン伸ばしたい技は何ですか？",multiple:true,options:["オーリー系","ノーリー系","プレス系","乗り系","360系","540系"].map((value)=>({label:value,value}))},
  {key:"exerciseHabit",text:"現在の運動習慣は？",options:["ほぼなし","週1回程度","週2〜3回","週4回以上"].map((value)=>({label:value,value}))},
  {key:"injuryConcern",text:"膝・腰・足首などに不安はありますか？",multiple:true,exclusive:"なし",options:["なし","膝","腰","足首","肩","複数ある"].map((value)=>({label:value,value}))},
  {key:"intensity",text:"希望するトレーニング強度は？",options:["軽め","普通","きつめ"].map((value)=>({label:value,value}))}
];

export default function OffTrainingDiagnosisModal({onComplete}:{onComplete:(preferences:OffTrainingPreferences)=>Promise<void>}){
  const [index,setIndex]=useState(0);const [answers,setAnswers]=useState<Record<string,AnswerValue>>({});const [pending,setPending]=useState(false);const [error,setError]=useState("");
  const current=questions[index];const selected=current.multiple?(answers[current.key] as string[]|undefined)??[]:[];
  function preferencesFrom(values:Record<string,AnswerValue>):OffTrainingPreferences{return {equipment:values.equipment as OffTrainingEquipment[],weeklyDays:Number(values.weeklyDays),sessionMinutes:Number(values.sessionMinutes),location:values.location as string[],gymAvailable:String(values.gymAvailable),focusAbility:values.focusAbility as string[],targetTrickType:values.targetTrickType as string[],exerciseHabit:String(values.exerciseHabit),injuryConcern:values.injuryConcern as string[],intensity:values.intensity as OffTrainingIntensity};}
  async function complete(values:Record<string,AnswerValue>){setPending(true);setError("");try{await onComplete(preferencesFrom(values));}catch(cause){setError(cause instanceof Error?cause.message:"プランを保存できませんでした");setPending(false);}}
  function chooseSingle(value:string|number){const next={...answers,[current.key]:value};setAnswers(next);if(index<questions.length-1)setIndex(index+1);else void complete(next);}
  function toggle(value:string){let next:string[];if(selected.includes(value))next=selected.filter((item)=>item!==value);else if(value===current.exclusive)next=[value];else next=[...selected.filter((item)=>item!==current.exclusive),value];setAnswers({...answers,[current.key]:next});}
  function nextQuestion(){if(!selected.length)return;if(index<questions.length-1)setIndex(index+1);else void complete(answers);}
  return <div className="fixed inset-0 z-[90] grid place-items-end bg-navy/45 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="diagnosis-title"><div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-[2rem] bg-white p-5 shadow-2xl"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-ice"><Bot className="text-glacier"/></div><div><h2 id="diagnosis-title" className="font-black">オフトレAI診断</h2><p className="text-xs text-slate-400">QUESTION {index+1} / {questions.length}</p></div></div><div className="overflow-y-auto py-5"><div className="mb-3 flex gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ice"><Sparkles size={15} className="text-glacier"/></div><div className="rounded-2xl rounded-tl-sm bg-slate-100 p-3 text-sm leading-6">{index===0&&<p className="mb-2 text-xs text-slate-500">あなたに合ったオフトレプランを作るために、いくつか質問します。</p>}<strong>{current.text}</strong>{current.multiple&&<p className="mt-1 text-[11px] text-slate-400">複数選択できます</p>}</div></div><div className="ml-10 grid gap-2">{current.options.map((option)=>{const active=current.multiple&&selected.includes(String(option.value));return <button key={String(option.value)} disabled={pending} onClick={()=>current.multiple?toggle(String(option.value)):chooseSingle(option.value)} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition disabled:opacity-50 ${active?"border-glacier bg-ice text-glacier":"border-slate-200 bg-white hover:border-glacier hover:bg-ice"}`}><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${active?"border-glacier bg-glacier text-white":"border-slate-300"}`}>{active&&<Check size={13}/>}</span>{option.label}</button>})}{current.multiple&&<button disabled={!selected.length||pending} onClick={nextQuestion} className="btn-primary mt-2 disabled:bg-slate-200 disabled:text-slate-400">選択して次へ</button>}</div>{error&&<p className="mt-3 text-center text-xs font-bold text-rose-500">{error}</p>}{pending&&<p className="mt-4 text-center text-sm font-bold text-glacier">プランを生成しています...</p>}</div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-glacier transition-all" style={{width:`${((index+1)/questions.length)*100}%`}}/></div></div></div>;
}
