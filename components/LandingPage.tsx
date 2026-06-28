"use client";

import { ArrowRight, Bot, CheckCircle2, Crown, Dumbbell, Eye, Film, LogIn, MountainSnow, NotebookPen, Sparkles, TreePine } from "lucide-react";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";

const features = [
  { title: "トリック辞典", description: "初期20トリックを難易度・系統・前提技と一緒に確認。", icon: TreePine },
  { title: "練習記録", description: "成功回数、失敗回数、苦手ポイント、次回課題を保存。", icon: NotebookPen },
  { title: "シバカツ練習", description: "ゲレンデ練習とは別に、室内練習も記録できます。", icon: MountainSnow },
  { title: "オフトレ診断", description: "回答内容から週間オフトレプランをルールベースで作成。", icon: Dumbbell },
  { title: "AIコーチ", description: "練習データをもとに、次にやることを相談できます。", icon: Bot },
  { title: "動画アップロード/解析", description: "動画メタデータや代表フレームを使った解析土台を搭載。", icon: Film },
];

const freeItems = ["初期20トリック", "レギュラー/グーフィー表示", "トリック辞典閲覧", "基本的な練習記録"];
const premiumItems = ["追加トリック", "高度なAIアドバイス", "AI動画解析", "詳細な成長分析"];
const steps = ["Googleでログイン", "プロフィール設定", "トリックを見る", "練習を記録", "AIに相談"];

export default function LandingPage({ onGuestStart }: { onGuestStart: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function login(): Promise<void> {
    setPending(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ログインに失敗しました。");
      setPending(false);
    }
  }

  return (
    <main className="space-y-8 pb-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy via-glacier to-cyan-400 p-6 text-white shadow-xl shadow-sky-200">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-cyan-100/20 blur-2xl" />
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-black text-cyan-50">
            <Sparkles size={14} />
            GRATRI COACH
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">AIグラトリコーチ</h1>
          <p className="mt-4 max-w-lg text-sm font-bold leading-7 text-white/80">
            グラトリの練習記録・トリック辞典・オフトレ・AIアドバイスをひとつに。
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <button onClick={login} disabled={pending} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-navy shadow-lg transition active:scale-[.98] disabled:opacity-60">
              無料で始める
            </button>
            <button onClick={login} disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-navy/25 px-5 py-4 text-sm font-black text-white ring-1 ring-white/20 transition active:scale-[.98] disabled:opacity-60">
              <LogIn size={17} />
              {pending ? "接続中..." : "Googleでログイン"}
            </button>
            <button onClick={onGuestStart} disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/20 transition active:scale-[.98]">
              <Eye size={17} />
              ログインせずに見る
            </button>
          </div>
          {error && <p className="mt-4 rounded-2xl bg-white/15 px-4 py-3 text-xs font-bold text-white">{error}</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black">できること</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="card">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ice text-glacier">
                  <Icon size={21} />
                </div>
                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="flex items-center gap-2 text-lg font-black"><CheckCircle2 className="text-emerald-500" size={20} />無料で使える内容</h2>
          <ul className="mt-4 space-y-2">
            {freeItems.map((item) => <li key={item} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{item}</li>)}
          </ul>
        </div>
        <div className="card border-amber-100 bg-amber-50/40">
          <h2 className="flex items-center gap-2 text-lg font-black"><Crown className="text-amber-500" size={20} />Premium予定</h2>
          <ul className="mt-4 space-y-2">
            {premiumItems.map((item) => <li key={item} className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700">{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="card bg-gradient-to-br from-slate-900 to-navy text-white">
        <p className="text-xs font-black tracking-[.18em] text-cyan-200">BETA TESTER</p>
        <h2 className="mt-2 text-xl font-black">βテスターはPremium機能を体験可能</h2>
        <p className="mt-3 text-sm font-bold leading-7 text-white/75">
          βテスターは一部Premium機能を無料で体験できます。対象ユーザーは管理者がアプリ上で設定します。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">使い方</h2>
        <div className="mt-4 space-y-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ice text-sm font-black text-glacier">{index + 1}</span>
              <span className="flex-1 text-sm font-black">{step}</span>
              <ArrowRight size={16} className="text-slate-300" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
