"use client";

import { Save,UserRound } from "lucide-react";
import { useState } from "react";
import type { Stance } from "@/lib/types";

export default function ProfileSetupModal({onSave}:{onSave:(profile:{displayName:string;stance:Stance})=>Promise<void>}){
  const [displayName,setDisplayName]=useState("");
  const [stance,setStance]=useState<Stance|"">("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  const valid=Boolean(displayName.trim()&&stance);
  async function save(){if(!valid||!stance)return;setPending(true);setError("");try{await onSave({displayName:displayName.trim(),stance});}catch(cause){setError(cause instanceof Error?cause.message:"保存に失敗しました");setPending(false);}}
  return <div className="fixed inset-0 z-[100] grid place-items-end bg-navy/45 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="profile-setup-title"><div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"><div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-ice"><UserRound className="text-glacier" size={27}/></div><h2 id="profile-setup-title" className="text-2xl font-black tracking-tight">プロフィールを設定</h2><p className="mt-2 text-sm text-slate-500">最初に、あなたの基本情報を教えてください。</p><div className="mt-6 grid gap-4"><label className="text-sm font-bold">ユーザー名<input autoFocus className="field mt-2" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="表示名を入力"/></label><label className="text-sm font-bold">スタンス<select className="field mt-2" value={stance} onChange={(e)=>setStance(e.target.value as Stance|"")}><option value="">選択してください</option><option>レギュラー</option><option>グーフィー</option></select></label></div>{error&&<p className="mt-3 text-xs font-bold text-rose-500">{error}</p>}<button onClick={save} disabled={!valid||pending} className="btn-primary mt-6 w-full py-4 disabled:bg-slate-200 disabled:text-slate-400"><Save size={18}/>{pending?"保存中...":"保存して始める"}</button></div></div>;
}
