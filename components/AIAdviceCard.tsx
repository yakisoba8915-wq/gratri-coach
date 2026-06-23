"use client";

import Link from "next/link";
import { Bot, ChevronRight, Loader2, Sparkles, TrendingDown } from "lucide-react";
import { useState } from "react";
import { generateAiAdvice, type AIAdvice, type GenerateAdviceParams, type OpenAiAdvice } from "@/lib/aiAdvisor";

type AIAdviceCardProps = GenerateAdviceParams & {
  advice: AIAdvice;
};

const priorityLabel: Record<OpenAiAdvice["priority"], string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export default function AIAdviceCard({ advice, tricks, logs, goals, profile, offTrainingPlan }: AIAdviceCardProps) {
  const primary = advice.recommendedTricks[0];
  const [aiAdvice, setAiAdvice] = useState<OpenAiAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createAiAdvice(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      setAiAdvice(await generateAiAdvice({ tricks, logs, goals, profile, offTrainingPlan }));
    } catch {
      setError("AIアドバイスの生成に失敗しました。ルールベース分析を表示しています。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card mb-8 overflow-hidden">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ice">
          <Bot className="text-glacier" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[.16em] text-glacier">AI COACH</p>
          <h2 className="mt-1 text-lg font-black">AIによる練習アドバイス</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">未設定・エラー時はルールベース分析にフォールバック</p>
        </div>
      </div>

      <button type="button" onClick={createAiAdvice} disabled={loading} className="btn-primary mb-4 w-full py-3 disabled:opacity-60">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
        {loading ? "AIアドバイス生成中..." : "AIアドバイス生成"}
      </button>
      {error && <p className="mb-4 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-500">{error}</p>}

      {aiAdvice ? (
        <div className="space-y-4">
          <div className="rounded-3xl bg-navy p-4 text-white">
            <p className="text-xs font-black text-cyan-200">優先度 {priorityLabel[aiAdvice.priority]}</p>
            <p className="mt-2 text-sm font-bold leading-7">{aiAdvice.summary}</p>
          </div>

          <AdviceList title="最近成功率が下がっている技・苦手傾向" items={aiAdvice.weakPoints} tone="rose" />
          <AdviceList title="次に練習すべき技" items={aiAdvice.recommendedTricks} tone="ice" />
          <AdviceList title="次回の練習メニュー" items={aiAdvice.nextPracticeMenu} tone="slate" />
          <AdviceList title="オフトレアドバイス" items={aiAdvice.offTrainingAdvice} tone="emerald" />
        </div>
      ) : (
        <>
          {primary && (
            <Link href={`/tricks/${primary.trick.id}`} className="mb-4 flex items-center gap-3 rounded-3xl bg-navy p-4 text-white">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-cyan-200">優先度 {primary.priority}</p>
                <h3 className="mt-1 truncate text-xl font-black">{primary.trick.nameJa}</h3>
                <p className="mt-1 text-xs text-white/65">
                  {primary.priorityLabel}・{primary.reason}
                </p>
              </div>
              <ChevronRight className="shrink-0 text-white/60" />
            </Link>
          )}

          <p className="rounded-3xl bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-600">{advice.message}</p>

          <div className="mt-4 grid gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-black">
                <TrendingDown size={16} className="text-orange-500" />
                苦手傾向
              </div>
              <div className="space-y-2">
                {advice.weakTricks.length ? (
                  advice.weakTricks.map((item) => (
                    <Link key={item.trick.id} href={`/tricks/${item.trick.id}`} className="flex items-center justify-between rounded-2xl bg-rose-50 px-3 py-2 text-sm">
                      <span className="font-bold text-slate-700">{item.trick.nameJa}</span>
                      <span className="text-xs font-black text-rose-500">{item.recentSuccessRate}%</span>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-400">大きく崩れている技はまだ見つかっていません</p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-black">
                <Sparkles size={16} className="text-glacier" />
                自動分析
              </div>
              <ul className="space-y-2">
                {advice.trendAnalysis.map((item) => (
                  <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
                    ・{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function AdviceList({ title, items, tone }: { title: string; items: string[]; tone: "rose" | "ice" | "slate" | "emerald" }) {
  const className =
    tone === "rose"
      ? "bg-rose-50 text-rose-700"
      : tone === "ice"
        ? "bg-ice text-glacier"
        : tone === "emerald"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-50 text-slate-600";

  return (
    <div>
      <h3 className="mb-2 text-sm font-black">{title}</h3>
      <ul className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <li key={item} className={`rounded-2xl px-3 py-2 text-xs font-bold leading-5 ${className}`}>
              ・{item}
            </li>
          ))
        ) : (
          <li className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400">まだ分析できるデータが少なめです</li>
        )}
      </ul>
    </div>
  );
}
