"use client";

import { LogIn,LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle,signOut } from "@/lib/auth";

export default function AuthButton(){
  const {user,loading,configured}=useAuth();
  const [error,setError]=useState("");
  const [pending,setPending]=useState(false);
  async function login(){setPending(true);setError("");try{await signInWithGoogle();}catch(cause){setError(cause instanceof Error?cause.message:"ログインに失敗しました");setPending(false);}}
  async function logout(){setPending(true);setError("");try{await signOut();}catch(cause){setError(cause instanceof Error?cause.message:"ログアウトに失敗しました");}finally{setPending(false);}}

  if(loading)return <div className="card text-sm font-bold text-slate-400">ログイン状態を確認中...</div>;
  if(user)return <div className="card"><div className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ice font-black text-glacier">{(user.user_metadata.full_name as string|undefined)?.slice(0,1)??user.email?.slice(0,1).toUpperCase()??"G"}</div><div className="min-w-0 flex-1"><p className="font-bold">Googleでログイン中</p><p className="truncate text-xs text-slate-400">{user.email}</p></div><button onClick={logout} disabled={pending} className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 disabled:opacity-50"><LogOut size={15}/>{pending?"処理中":"ログアウト"}</button></div>{error&&<p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}</div>;
  return <div className="card"><div className="flex items-center gap-3"><LogIn className="text-glacier"/><div className="min-w-0 flex-1"><p className="font-bold">Googleログイン</p><p className="text-xs text-slate-400">ログインするとデータをクラウド保存します</p></div><button onClick={login} disabled={!configured||pending} className="rounded-xl bg-navy px-3 py-2 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-400">{pending?"接続中":"ログイン"}</button></div>{!configured&&<p className="mt-2 text-xs text-slate-400">環境変数未設定のためゲストモードです</p>}{error&&<p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}</div>;
}
