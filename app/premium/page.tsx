import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const premiumFeatures = ["追加トリックの詳細閲覧", "追加トリックの練習記録", "高度なAIアドバイス", "AI動画解析", "詳細な成長分析"];

export default function PremiumPage() {
  return (
    <main>
      <PageHeader title="Premiumについて" eyebrow="PREMIUM" back="/tricks" />
      <section className="card overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-amber-100 via-white to-cyan-100 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm">
            <Lock size={22} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Premium機能は準備中です</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
            現在は決済機能をまだ実装していません。今後、追加トリックや高度なAI機能をPremiumとして提供する予定です。
          </p>
        </div>
        <div className="p-5">
          <h2 className="flex items-center gap-2 font-black">
            <Sparkles size={18} className="text-amber-500" />
            Premium予定機能
          </h2>
          <div className="mt-3 grid gap-2">
            {premiumFeatures.map((feature) => (
              <div key={feature} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-600">
                {feature}
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-ice px-3 py-3 text-xs font-bold leading-5 text-glacier">
            βテスター、Editor、Admin権限のユーザーはPremium限定トリックを利用できます。必要に応じて管理者にお問い合わせください。
          </p>
          <Link href="/tricks" className="btn-primary mt-5 w-full justify-center">
            トリック一覧に戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
