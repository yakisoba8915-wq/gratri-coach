"use client";

import Link from "next/link";
import { Activity, ArrowRight, BarChart3, Flame, Target, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { formatTrickName } from "@/lib/trickDisplay";
import type { GrowthAnalyticsSummary, TrickStats } from "@/lib/analytics";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";

interface GrowthAnalyticsDashboardProps {
  summary: GrowthAnalyticsSummary;
  selectedStance?: SelectedTrickDisplayStance;
  compact?: boolean;
}

function StatBox({ label, value, suffix = "" }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-3xl bg-ice/70 p-4">
      <p className="text-[11px] font-black text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-glacier">
        {value}
        {suffix && <span className="ml-0.5 text-sm">{suffix}</span>}
      </p>
    </div>
  );
}

function ProgressBar({ value, tone = "glacier" }: { value: number; tone?: "glacier" | "rose" | "emerald" | "amber" }) {
  const color =
    tone === "rose" ? "bg-rose-400" : tone === "emerald" ? "bg-emerald-400" : tone === "amber" ? "bg-amber-400" : "bg-glacier";
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function RankingList({
  title,
  icon,
  items,
  selectedStance,
  empty,
  renderMeta,
  tone = "glacier",
}: {
  title: string;
  icon: ReactNode;
  items: TrickStats[];
  selectedStance: SelectedTrickDisplayStance;
  empty: string;
  renderMeta: (item: TrickStats) => string;
  tone?: "glacier" | "rose" | "emerald" | "amber";
}) {
  return (
    <section className="card">
      <div className="mb-3 flex items-center gap-2 font-black">
        {icon}
        <h2>{title}</h2>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item, index) => (
            <div key={item.trickId} className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{index + 1}. {formatTrickName(item.trickName, selectedStance)}</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-400">{renderMeta(item)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500">{item.successRate}%</span>
              </div>
              <ProgressBar value={item.successRate} tone={tone} />
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 px-3 py-5 text-center text-xs font-bold text-slate-400">{empty}</p>
        )}
      </div>
    </section>
  );
}

export default function GrowthAnalyticsDashboard({ summary, selectedStance = "regular", compact = false }: GrowthAnalyticsDashboardProps) {
  const modeLabel = summary.trainingType === "snow" ? "シーズン中 / 雪上練習" : "オフシーズン / シバカツ練習";

  if (summary.totalPracticeCount === 0) {
    return (
      <section className="card border-cyan-100 bg-gradient-to-br from-white to-cyan-50">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ice text-glacier">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-xs font-black tracking-[.16em] text-glacier">GROWTH ANALYTICS</p>
            <h2 className="mt-1 text-lg font-black">成長分析</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              {modeLabel}の記録が増えると、練習量・成功率・苦手技・伸びている技を確認できます。
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <section className="card border-cyan-100 bg-gradient-to-br from-white to-cyan-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[.16em] text-glacier">GROWTH ANALYTICS</p>
            <h2 className="mt-1 text-xl font-black">成長分析</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">{modeLabel}を中心に集計中</p>
          </div>
          {!compact && <Activity className="text-glacier" size={26} />}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBox label="今週" value={summary.practiceCountThisWeek} suffix="件" />
          <StatBox label="今月" value={summary.practiceCountThisMonth} suffix="件" />
          <StatBox label="累計" value={summary.totalPracticeCount} suffix="件" />
        </div>
        <div className="mt-3 rounded-3xl bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black">全体成功率</p>
            <p className="text-3xl font-black text-navy">{summary.overallSuccessRate}%</p>
          </div>
          <ProgressBar value={summary.overallSuccessRate} />
          <p className="mt-2 text-xs font-bold text-slate-400">成功 {summary.successCount} / 失敗 {summary.failCount}</p>
        </div>
        {compact && (
          <Link href="/analytics" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3 text-sm font-black text-white">
            詳しく見る
            <ArrowRight size={16} />
          </Link>
        )}
      </section>

      {!compact && (
        <>
          <RankingList
            title="よく練習している技 TOP5"
            icon={<Flame size={18} className="text-orange-500" />}
            items={summary.topPracticed}
            selectedStance={selectedStance}
            empty="練習記録が増えると表示されます"
            renderMeta={(item) => `${item.logCount}件 / ${item.attempts}試行`}
            tone="amber"
          />
          <RankingList
            title="苦手技 TOP5"
            icon={<Target size={18} className="text-rose-500" />}
            items={summary.weakTricks}
            selectedStance={selectedStance}
            empty="5試行以上の記録が増えると表示されます"
            renderMeta={(item) => `${item.attempts}試行 / 成功率が低い順`}
            tone="rose"
          />
          <section className="card">
            <div className="mb-3 flex items-center gap-2 font-black">
              <TrendingUp size={18} className="text-emerald-500" />
              <h2>最近伸びている技</h2>
            </div>
            <div className="space-y-2">
              {summary.improvingTricks.length ? (
                summary.improvingTricks.map((item, index) => (
                  <div key={item.trickId} className="rounded-2xl bg-emerald-50 px-3 py-3">
                    <p className="text-sm font-black">{index + 1}. {formatTrickName(item.trickName, selectedStance)}</p>
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      {item.beforeRate}% → {item.recentRate}%（+{item.diff}pt）
                    </p>
                    <ProgressBar value={item.recentRate} tone="emerald" />
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-3 py-5 text-center text-xs font-bold text-slate-400">データが増えると表示されます</p>
              )}
            </div>
          </section>
          <section className="card">
            <div className="mb-3 flex items-center gap-2 font-black">
              <Target size={18} className="text-violet-500" />
              <h2>次に練習すべき技</h2>
            </div>
            <div className="space-y-2">
              {summary.recommendedTricks.length ? (
                summary.recommendedTricks.map((item, index) => (
                  <div key={item.trickId} className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-sm font-black">{index + 1}. {formatTrickName(item.trickName, selectedStance)}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{item.reason}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-3 py-5 text-center text-xs font-bold text-slate-400">苦手技や次回課題が増えると提案されます</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
