"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PracticeLogCard from "@/components/PracticeLogCard";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialPracticeLogs, initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";

export default function PracticePage() {
  const [storedLogs] = useSupabaseData(dataRepository.getLogs); const [storedTricks] = useSupabaseData(dataRepository.getTricks); const logs=storedLogs??initialPracticeLogs; const tricks=storedTricks??initialTricks;
  const [trickId,setTrickId]=useState("all"); const [date,setDate]=useState("");
  const filtered=useMemo(()=>logs.filter((log)=>(trickId==="all"||log.trickId===trickId)&&(!date||log.date===date)),[logs,trickId,date]);
  return <main><div className="flex items-start justify-between"><PageHeader title="練習記録" eyebrow="PRACTICE LOG"/><Link href="/practice/new" className="btn-primary !p-3" aria-label="練習記録追加"><Plus/></Link></div><div className="card mb-4 grid grid-cols-2 gap-2 !p-3"><label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><select aria-label="技名で絞り込み" className="field pl-9" value={trickId} onChange={(e)=>setTrickId(e.target.value)}><option value="all">すべての技</option>{tricks.map((t)=><option key={t.id} value={t.id}>{t.nameJa}</option>)}</select></label><input aria-label="日付で絞り込み" type="date" className="field" value={date} onChange={(e)=>setDate(e.target.value)}/></div><div className="space-y-3">{filtered.map((log)=><PracticeLogCard key={log.id} log={log} trick={tricks.find((t)=>t.id===log.trickId)}/>)}{filtered.length===0&&<div className="card py-12 text-center text-sm text-slate-400">記録がありません</div>}</div></main>;
}
