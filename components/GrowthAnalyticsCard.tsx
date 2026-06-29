"use client";

import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import GrowthAnalyticsDashboard from "@/components/GrowthAnalyticsDashboard";
import { generateGrowthAnalyticsSummary } from "@/lib/analytics";
import type { PracticeLog, SeasonMode, Trick } from "@/lib/types";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";

interface GrowthAnalyticsCardProps {
  isLoggedIn: boolean;
  logs: PracticeLog[];
  tricks: Trick[];
  seasonMode: SeasonMode;
  selectedStance?: SelectedTrickDisplayStance;
}

export default function GrowthAnalyticsCard({ isLoggedIn, logs, tricks, seasonMode, selectedStance = "regular" }: GrowthAnalyticsCardProps) {
  if (!isLoggedIn) {
    return (
      <section className="card mb-8 border-cyan-100 bg-gradient-to-br from-white to-cyan-50">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ice text-glacier">
            <BarChart3 size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black tracking-[.16em] text-glacier">GROWTH ANALYTICS</p>
            <h2 className="mt-1 text-lg font-black">成長分析</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">ログインすると成長分析を確認できます。</p>
          </div>
        </div>
        <Link href="/profile" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500">
          ログインする
          <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  const summary = generateGrowthAnalyticsSummary({ logs, tricks, seasonMode });
  return (
    <section className="mb-8">
      <GrowthAnalyticsDashboard summary={summary} selectedStance={selectedStance} compact />
    </section>
  );
}
