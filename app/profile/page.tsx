"use client";

import Link from "next/link";
import { ChevronRight, Save, Target, Trees } from "lucide-react";
import { useEffect, useState } from "react";
import AuthButton from "@/components/AuthButton";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { dataRepository } from "@/lib/storage";
import type { Profile, Stance } from "@/lib/types";

export default function ProfilePage() {
  const {user}=useAuth();
  const [stored,refresh]=useSupabaseData(dataRepository.getProfile); const [storedTricks]=useSupabaseData(dataRepository.getTricks); const [storedLogs]=useSupabaseData(dataRepository.getLogs); const profile:Profile=user&&stored?stored:{displayName:"",stance:""}; const [displayName,setDisplayName]=useState(""); const [stance,setStance]=useState<Stance|"">(""); const [saved,setSaved]=useState(false);
  useEffect(()=>{if(user&&stored){setDisplayName(stored.displayName);setStance(stored.stance);}else if(!user){setDisplayName("");setStance("");}},[stored,user]);
  async function save(){if(!user||!displayName.trim()||!stance)return;await dataRepository.saveProfile({displayName:displayName.trim(),stance});await refresh();setSaved(true);setTimeout(()=>setSaved(false),1200)}
  const completed=user?(storedTricks??[]).filter((t)=>t.masteryStatus==="完成").length:0; const logCount=user?(storedLogs??[]).length:0;
  return <main><PageHeader title="プロフィール" eyebrow="MY PAGE"/><div className="mb-5 flex items-center gap-4"><div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-cyan-200 to-blue-200 text-2xl font-black text-glacier">{user?(profile.displayName.slice(0,1)||"—"):"—"}</div><div><h2 className="min-h-7 text-xl font-black">{user?profile.displayName:""}</h2><p className="mt-1 min-h-4 text-xs font-bold text-slate-400">{user&&profile.stance?`${profile.stance}スタンス`:""}</p></div></div><div className="mb-5 flex gap-3"><StatCard label="練習記録" value={logCount} suffix="件"/><StatCard label="完成トリック" value={completed} suffix="技"/></div>
    <section className="card mb-4 grid gap-4"><h2 className="font-black">基本情報</h2><label className="text-sm font-bold">表示名<input disabled={!user} className="field mt-2 disabled:bg-slate-50" value={user?displayName:""} onChange={(e)=>setDisplayName(e.target.value)}/></label><label className="text-sm font-bold">スタンス<select disabled={!user} className="field mt-2 disabled:bg-slate-50" value={user?stance:""} onChange={(e)=>setStance(e.target.value as Stance|"")}><option value="">未選択</option><option>レギュラー</option><option>グーフィー</option></select></label><button disabled={!user||!displayName.trim()||!stance} onClick={save} className="btn-primary disabled:bg-slate-200 disabled:text-slate-400"><Save size={17}/>{!user?"ログイン後に保存できます":saved?"保存しました":"プロフィールを保存"}</button></section>
    <div className="card mb-4 !p-2"><Link href="/goals" className="flex items-center gap-3 rounded-2xl p-3"><Target className="text-violet-500"/><span className="flex-1 font-bold">目標管理</span><ChevronRight className="text-slate-300"/></Link><Link href="/tree" className="flex items-center gap-3 rounded-2xl p-3"><Trees className="text-emerald-500"/><span className="flex-1 font-bold">技ツリー</span><ChevronRight className="text-slate-300"/></Link></div>
    <AuthButton/></main>;
}
