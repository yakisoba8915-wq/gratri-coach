"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PracticeLog } from "@/lib/types";
import { calculateSuccessRate } from "@/lib/calculations";

export default function ProgressChart({ logs }: { logs:PracticeLog[] }) {
  const data = [...logs].reverse().map((log) => ({ date:log.date.slice(5).replace("-","/"), rate:calculateSuccessRate(log.successCount,log.failCount) }));
  if (!data.length) return <div className="grid h-40 place-items-center text-sm text-slate-400">まだ練習記録がありません</div>;
  return <div className="h-44 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top:10,right:8,left:-28,bottom:0 }}><XAxis dataKey="date" tick={{ fontSize:11 }} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tick={{ fontSize:10 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ borderRadius:16,border:"none",boxShadow:"0 8px 20px rgba(0,0,0,.1)" }}/><Line type="monotone" dataKey="rate" stroke="#0b91a8" strokeWidth={3} dot={{ fill:"#0b91a8",r:4 }}/></LineChart></ResponsiveContainer></div>;
}
