import { Clock, Dumbbell, Footprints, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SectionTitle from "@/components/SectionTitle";
import { initialTricks, trainings } from "@/lib/mockData";
import type { TrainingCategory } from "@/lib/types";

const categories: { name:TrainingCategory; icon:typeof Dumbbell; color:string }[] = [{name:"シバカツ",icon:Footprints,color:"text-sky-500"},{name:"筋トレ",icon:Dumbbell,color:"text-orange-500"},{name:"柔軟",icon:Sparkles,color:"text-emerald-500"}];
export default function TrainingPage() {
  return <main><PageHeader title="オフトレ" eyebrow="OFF-SNOW TRAINING"/><section className="mb-7 rounded-3xl bg-gradient-to-br from-glacier to-sky-600 p-5 text-white shadow-xl shadow-sky-200"><p className="text-xs font-bold text-cyan-100">TODAY&apos;S MENU</p><h2 className="mt-1 text-xl font-black">バランス + 股関節</h2><p className="mt-2 text-sm text-white/75">合計16分。雪上で低い姿勢を作る準備。</p><div className="mt-4 flex gap-2"><span className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold">バランスボード 10分</span><span className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold">ストレッチ 6分</span></div></section>
    <div className="space-y-7">{categories.map(({name,icon:Icon,color})=><section key={name}><SectionTitle title={name}/><div className="space-y-3">{trainings.filter((t)=>t.category===name).map((training)=><article key={training.id} className="card"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50"><Icon className={color} size={21}/></div><div><h3 className="font-black">{training.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{training.description}</p><p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400"><Clock size={12}/>{training.minutes}分</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{training.relatedTrickIds.map((id)=><a key={id} href={`/tricks/${id}`} className="rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold text-glacier">{initialTricks.find((t)=>t.id===id)?.nameJa}</a>)}</div></article>)}</div></section>)}</div></main>;
}
