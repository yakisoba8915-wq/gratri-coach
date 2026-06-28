"use client";

import Link from "next/link";
import { CheckCircle2, Crown, Lock, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { planLabel } from "@/lib/accessControl";
import { dataRepository } from "@/lib/storage";
import type { PlanType } from "@/lib/types";

const freeFeatures = [
  "初期20トリック",
  "レギュラー / グーフィー表示",
  "トリック辞典の閲覧",
  "基本的な練習記録",
  "基本的なオフトレ機能",
];

const premiumFeatures = [
  "追加トリックの詳細閲覧",
  "追加トリックを練習記録で利用",
  "追加シバカツトリック",
  "より詳しいAIアドバイス",
  "AI動画解析",
  "成長分析",
];

function statusMessage(planType: PlanType): { title: string; body: string; tone: string } {
  if (planType === "beta_tester") {
    return {
      title: "βテスター特典が有効です",
      body: "βテスター特典により、Premium機能を無料で体験できます。",
      tone: "border-cyan-100 bg-cyan-50 text-glacier",
    };
  }
  if (planType === "admin" || planType === "editor") {
    return {
      title: "運営権限が有効です",
      body: "運営権限によりPremium機能を利用できます。",
      tone: "border-amber-100 bg-amber-50 text-amber-700",
    };
  }
  if (planType === "premium") {
    return {
      title: "Premiumプランが有効です",
      body: "Premium機能を利用できます。",
      tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
    };
  }
  return {
    title: "Premium決済は準備中です",
    body: "現在、Premium決済は準備中です。正式公開までお待ちください。",
    tone: "border-slate-100 bg-slate-50 text-slate-600",
  };
}

export default function PremiumPage() {
  const { user, loading } = useAuth();
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const planType: PlanType = user ? profile?.planType ?? "free" : "free";
  const message = statusMessage(planType);

  return (
    <main>
      <PageHeader title="Premiumプラン" eyebrow="PREMIUM" back="/tricks" />

      <section className="mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-50 via-white to-amber-50 p-5 shadow-card">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm">
          <Crown size={23} />
        </div>
        <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900">Premiumプラン</h1>
        <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
          追加トリック、AI機能、動画解析などをより深く使えるプランです。
        </p>
        <div className={`mt-5 rounded-3xl border px-4 py-3 text-sm font-bold leading-6 ${message.tone}`}>
          <p className="font-black">{loading ? "プラン確認中..." : message.title}</p>
          {!loading && <p className="mt-1">{message.body}</p>}
          {!loading && user && <p className="mt-2 text-xs opacity-80">現在のプラン：{planLabel(planType)}</p>}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-ice text-glacier">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-black tracking-[.14em] text-glacier">FREE</p>
              <h2 className="font-black">Freeで使える内容</h2>
            </div>
          </div>
          <FeatureList items={freeFeatures} />
        </section>

        <section className="card border-amber-100 bg-gradient-to-br from-white to-amber-50">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-black tracking-[.14em] text-amber-600">PREMIUM</p>
              <h2 className="font-black">Premiumで使える内容</h2>
            </div>
          </div>
          <FeatureList items={premiumFeatures} highlight />
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-white/80 px-3 py-3 text-xs font-bold leading-5 text-amber-700">
            <Lock className="mt-0.5 shrink-0" size={14} />
            Stripe決済はまだ未実装です。「登録する」「購入する」ボタンは正式公開まで表示しません。
          </p>
        </section>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/" className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-600">
          アプリに戻る
        </Link>
        <Link href="/tricks" className="rounded-2xl bg-navy px-4 py-3 text-center text-sm font-black text-white">
          トリックを見る
        </Link>
      </div>
    </main>
  );
}

function FeatureList({ items, highlight = false }: { items: string[]; highlight?: boolean }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold ${highlight ? "bg-white text-slate-700 shadow-sm" : "bg-slate-50 text-slate-600"}`}>
          <CheckCircle2 size={16} className={highlight ? "text-amber-500" : "text-glacier"} />
          {item}
        </li>
      ))}
    </ul>
  );
}
