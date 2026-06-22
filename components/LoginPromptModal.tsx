"use client";

import { LogIn,MountainSnow } from "lucide-react";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginPromptModal({onLater}:{onLater:()=>void}){
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  async function login(){setPending(true);setError("");try{await signInWithGoogle();}catch(cause){setError(cause instanceof Error?cause.message:"ログインに失敗しました");setPending(false);}}
  return <div className="fixed inset-0 z-[100] grid place-items-end bg-navy/45 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title"><div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"><div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-ice"><MountainSnow className="text-glacier" size={28}/></div><h2 id="login-prompt-title" className="text-2xl font-black tracking-tight">Gratri Coachへようこそ</h2><p className="mt-3 text-sm leading-7 text-slate-500">ログインすると、練習記録・目標・プロフィールをクラウド保存できます。</p>{error&&<p className="mt-3 text-xs font-bold text-rose-500">{error}</p>}<div className="mt-6 grid gap-2"><button onClick={login} disabled={pending} className="btn-primary w-full py-4 disabled:opacity-60"><LogIn size={18}/>{pending?"Googleに接続中...":"Googleでログイン"}</button><button onClick={onLater} disabled={pending} className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-slate-500">あとで使う</button></div></div></div>;
}
