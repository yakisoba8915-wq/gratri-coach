import { CalendarDays,Clock } from "lucide-react";
import type { OffTrainingPlan } from "@/lib/types";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";
import WeeklyOffTrainingCalendar from "./WeeklyOffTrainingCalendar";

export default function OffTrainingPlanView({plan,onRebuild,selectedStance="regular"}:{plan:OffTrainingPlan;onRebuild:()=>void;selectedStance?:SelectedTrickDisplayStance}){
  return <section className="mb-8"><div className="mb-6 rounded-3xl bg-gradient-to-br from-navy to-glacier p-5 text-white shadow-xl shadow-sky-200"><p className="text-xs font-bold text-cyan-100">YOUR OFF-SNOW PLAN</p><h2 className="mt-1 text-xl font-black">{plan.title}</h2><p className="mt-2 text-sm leading-6 text-white/75">{plan.description}</p><div className="mt-4 flex gap-2 text-xs font-bold"><span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-2"><CalendarDays size={14}/>週{plan.weeklyDays}日</span><span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-2"><Clock size={14}/>{plan.sessionMinutes}分</span></div></div><WeeklyOffTrainingCalendar weeklyPlan={plan.weeklyPlan} selectedStance={selectedStance}/><button onClick={onRebuild} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-500">もう一度診断する</button></section>;
}
