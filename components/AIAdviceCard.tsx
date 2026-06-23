"use client";

import Link from "next/link";
import { Bot, ChevronRight, Sparkles, TrendingDown } from "lucide-react";
import type { AIAdvice } from "@/lib/aiAdvisor";

export default function AIAdviceCard({ advice }: { advice: AIAdvice }) {
  const primary = advice.recommendedTricks[0];

  return (
    <section className="card mb-8 overflow-hidden">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ice">
          <Bot className="text-glacier" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[.16em] text-glacier">LOCAL AI COACH</p>
          <h2 className="mt-1 text-lg font-black">AIによる練習アドバイス</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">将来的にChatGPT API連携予定</p>
        </div>
      </div>

      {primary && (
        <Link href={`/tricks/${primary.trick.id}`} className="mb-4 flex items-center gap-3 rounded-3xl bg-navy p-4 text-white">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-cyan-200">優先度 {primary.priority}</p>
            <h3 className="mt-1 truncate text-xl font-black">{primary.trick.nameJa}</h3>
            <p className="mt-1 text-xs text-white/65">{primary.priorityLabel}・{primary.reason}</p>
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
    </section>
  );
}
