"use client";

import { useEffect,useState } from "react";
import type { Weekday,WeeklyOffTrainingDay } from "@/lib/types";
import OffTrainingDayCard from "./OffTrainingDayCard";

const dayNames:Weekday[]=["日","月","火","水","木","金","土"];
export default function WeeklyOffTrainingCalendar({weeklyPlan}:{weeklyPlan:WeeklyOffTrainingDay[]}){
  const [today,setToday]=useState<Weekday|null>(null);
  useEffect(()=>setToday(dayNames[new Date().getDay()]),[]);
  return <section className="mb-8"><div className="mb-3"><h2 className="text-lg font-black tracking-tight">今週やること</h2><p className="mt-0.5 text-xs text-slate-500">曜日ごとのメニューを確認しましょう</p></div><div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">{weeklyPlan.map((entry)=><OffTrainingDayCard key={entry.day} entry={entry} today={entry.day===today}/>)}</div></section>;
}
