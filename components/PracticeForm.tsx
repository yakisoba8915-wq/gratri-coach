"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { initialPracticeLogs, initialTricks } from "@/lib/mockData";
import { localData } from "@/lib/storage";
import { snowConditions, type PracticeLog, type SnowCondition } from "@/lib/types";

export default function PracticeForm() {
  const router = useRouter(); const tricks = localData.getTricks() ?? initialTricks;
  const [date,setDate] = useState(new Date().toISOString().slice(0,10)); const [trickId,setTrickId] = useState(""); const [resortName,setResortName] = useState("");
  const [successCount,setSuccessCount] = useState(0); const [failCount,setFailCount] = useState(0); const [snowCondition,setSnowCondition] = useState<SnowCondition>("不明");
  const [memo,setMemo] = useState(""); const [selfAnalysis,setSelfAnalysis] = useState(""); const [weakPoint,setWeakPoint] = useState(""); const [nextTask,setNextTask] = useState(""); const [videoUrls,setVideoUrls] = useState<string[]>([""]); const [error,setError] = useState("");
  function submit(e:React.FormEvent) { e.preventDefault(); if (!date || !trickId) { setError("日付と技名を入力してください"); return; }
    const log:PracticeLog = { id:`log-${Date.now()}`,date,trickId,resortName,successCount,failCount,snowCondition,memo,selfAnalysis,weakPoint,nextTask,videoUrls:videoUrls.filter(Boolean) };
    localData.saveLogs([log,...(localData.getLogs() ?? initialPracticeLogs)]); router.push("/practice"); }
  return <form onSubmit={submit} className="space-y-4"><div className="card grid gap-4"><label className="text-sm font-bold">日付 <span className="text-rose-500">*</span><input type="date" required className="field mt-2" value={date} onChange={(e)=>setDate(e.target.value)}/></label><label className="text-sm font-bold">技名 <span className="text-rose-500">*</span><select required className="field mt-2" value={trickId} onChange={(e)=>setTrickId(e.target.value)}><option value="">選択してください</option>{tricks.map((t)=><option key={t.id} value={t.id}>{t.nameJa}</option>)}</select></label><label className="text-sm font-bold">スキー場<input className="field mt-2" value={resortName} onChange={(e)=>setResortName(e.target.value)} placeholder="例：かぐらスキー場"/></label><label className="text-sm font-bold">雪質<select className="field mt-2" value={snowCondition} onChange={(e)=>setSnowCondition(e.target.value as SnowCondition)}>{snowConditions.map((s)=><option key={s}>{s}</option>)}</select></label></div>
    <div className="card"><h2 className="mb-3 font-black">トライ回数</h2><div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold text-emerald-600">成功回数<input type="number" min="0" className="field mt-2" value={successCount} onChange={(e)=>setSuccessCount(Math.max(0,Number(e.target.value)))}/></label><label className="text-sm font-bold text-rose-500">失敗回数<input type="number" min="0" className="field mt-2" value={failCount} onChange={(e)=>setFailCount(Math.max(0,Number(e.target.value)))}/></label></div></div>
    <div className="card grid gap-4"><label className="text-sm font-bold">メモ<textarea className="field mt-2 min-h-20" value={memo} onChange={(e)=>setMemo(e.target.value)}/></label><label className="text-sm font-bold">自己分析<textarea className="field mt-2 min-h-20" value={selfAnalysis} onChange={(e)=>setSelfAnalysis(e.target.value)}/></label><label className="text-sm font-bold">弱点<input className="field mt-2" value={weakPoint} onChange={(e)=>setWeakPoint(e.target.value)}/></label><label className="text-sm font-bold">次回課題<input className="field mt-2" value={nextTask} onChange={(e)=>setNextTask(e.target.value)}/></label></div>
    <div className="card"><div className="mb-3 flex items-center justify-between"><h2 className="font-black">動画URL</h2><button type="button" onClick={()=>setVideoUrls([...videoUrls,""])} className="text-xs font-bold text-glacier"><Plus size={14} className="inline"/> 追加</button></div><div className="space-y-2">{videoUrls.map((url,index)=><div key={index} className="flex gap-2"><input type="url" className="field" placeholder="https://..." value={url} onChange={(e)=>setVideoUrls(videoUrls.map((v,i)=>i===index?e.target.value:v))}/>{videoUrls.length>1&&<button type="button" aria-label="削除" onClick={()=>setVideoUrls(videoUrls.filter((_,i)=>i!==index))} className="rounded-xl px-2 text-slate-400"><Trash2 size={18}/></button>}</div>)}</div></div>
    {error && <p className="text-center text-sm font-bold text-rose-500">{error}</p>}<button className="btn-primary w-full py-4"><Save size={19}/>練習記録を保存</button></form>;
}
