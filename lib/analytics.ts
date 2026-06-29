import { calculateSuccessRate } from "./calculations";
import type { PracticeLog, SeasonMode, TrainingType, Trick } from "./types";

export interface TrickStats {
  trickId: string;
  trickName: string;
  trainingType: TrainingType;
  logCount: number;
  successCount: number;
  failCount: number;
  attempts: number;
  successRate: number;
  nextTaskCount: number;
  latestDate: string;
  daysSinceLastPractice: number | null;
}

export interface ImprovingTrick {
  trickId: string;
  trickName: string;
  beforeRate: number;
  recentRate: number;
  diff: number;
}

export interface GrowthAnalyticsSummary {
  seasonMode: SeasonMode;
  trainingType: TrainingType;
  practiceCountThisMonth: number;
  practiceCountThisWeek: number;
  totalPracticeCount: number;
  successCount: number;
  failCount: number;
  overallSuccessRate: number;
  topPracticed: TrickStats[];
  weakTricks: TrickStats[];
  improvingTricks: ImprovingTrick[];
  recommendedTricks: Array<{ trickId: string; trickName: string; reason: string; score: number }>;
  trickStats: TrickStats[];
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function targetTrainingType(seasonMode: SeasonMode): TrainingType {
  return seasonMode === "in_season" ? "snow" : "shibakatsu";
}

function trickNameFor(log: PracticeLog, tricks: Trick[]): string {
  const trick = tricks.find((item) => item.id === log.trickId);
  return trick?.nameJa ?? log.shibakatsuMenu ?? log.trickId;
}

function aggregateTrickStats(logs: PracticeLog[], tricks: Trick[], now: Date, trainingType: TrainingType): TrickStats[] {
  const map = new Map<string, TrickStats>();

  logs.forEach((log) => {
    const current = map.get(log.trickId);
    const latestDate = current && current.latestDate > log.date ? current.latestDate : log.date;
    const nextTaskCount = (current?.nextTaskCount ?? 0) + (log.nextTask.trim() ? 1 : 0);
    const successCount = (current?.successCount ?? 0) + log.successCount;
    const failCount = (current?.failCount ?? 0) + log.failCount;
    const attempts = successCount + failCount;

    map.set(log.trickId, {
      trickId: log.trickId,
      trickName: current?.trickName ?? trickNameFor(log, tricks),
      trainingType,
      logCount: (current?.logCount ?? 0) + 1,
      successCount,
      failCount,
      attempts,
      successRate: calculateSuccessRate(successCount, failCount),
      nextTaskCount,
      latestDate,
      daysSinceLastPractice: latestDate ? daysBetween(toDate(latestDate), now) : null,
    });
  });

  return [...map.values()].sort((a, b) => b.logCount - a.logCount || b.attempts - a.attempts);
}

function improvingTricks(logs: PracticeLog[], tricks: Trick[]): ImprovingTrick[] {
  const grouped = new Map<string, PracticeLog[]>();
  logs.forEach((log) => grouped.set(log.trickId, [...(grouped.get(log.trickId) ?? []), log]));

  return [...grouped.entries()]
    .map(([trickId, trickLogs]) => {
      const sorted = trickLogs.sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
      const recent = sorted.slice(0, 5);
      const before = sorted.slice(5, 10);
      if (recent.length < 2 || before.length < 2) return null;

      const recentTotals = recent.reduce<[number, number]>((sum, log) => [sum[0] + log.successCount, sum[1] + log.failCount], [0, 0]);
      const beforeTotals = before.reduce<[number, number]>((sum, log) => [sum[0] + log.successCount, sum[1] + log.failCount], [0, 0]);
      const recentRate = calculateSuccessRate(recentTotals[0], recentTotals[1]);
      const beforeRate = calculateSuccessRate(beforeTotals[0], beforeTotals[1]);
      const diff = recentRate - beforeRate;
      if (diff <= 0) return null;

      return {
        trickId,
        trickName: trickNameFor(sorted[0], tricks),
        beforeRate,
        recentRate,
        diff,
      };
    })
    .filter((item): item is ImprovingTrick => Boolean(item))
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 5);
}

function recommendedTricks(stats: TrickStats[]): GrowthAnalyticsSummary["recommendedTricks"] {
  const candidates = new Map<string, { trickId: string; trickName: string; reason: string; score: number }>();

  stats
    .filter((stat) => stat.attempts >= 5)
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 5)
    .forEach((stat, index) => {
      candidates.set(stat.trickId, {
        trickId: stat.trickId,
        trickName: stat.trickName,
        reason: `成功率${stat.successRate}%で苦手傾向`,
        score: 100 - stat.successRate + (5 - index),
      });
    });

  stats
    .filter((stat) => stat.daysSinceLastPractice !== null)
    .sort((a, b) => (b.daysSinceLastPractice ?? 0) - (a.daysSinceLastPractice ?? 0))
    .slice(0, 5)
    .forEach((stat) => {
      const current = candidates.get(stat.trickId);
      const score = (stat.daysSinceLastPractice ?? 0) * 1.5;
      candidates.set(stat.trickId, {
        trickId: stat.trickId,
        trickName: stat.trickName,
        reason: `${stat.daysSinceLastPractice}日練習していません`,
        score: (current?.score ?? 0) + score,
      });
    });

  stats
    .filter((stat) => stat.nextTaskCount > 0)
    .sort((a, b) => b.nextTaskCount - a.nextTaskCount)
    .slice(0, 5)
    .forEach((stat) => {
      const current = candidates.get(stat.trickId);
      candidates.set(stat.trickId, {
        trickId: stat.trickId,
        trickName: stat.trickName,
        reason: `次回課題が${stat.nextTaskCount}件あります`,
        score: (current?.score ?? 0) + stat.nextTaskCount * 12,
      });
    });

  return [...candidates.values()].sort((a, b) => b.score - a.score).slice(0, 3);
}

export function generateGrowthAnalyticsSummary({
  logs,
  tricks,
  seasonMode,
  now = new Date(),
}: {
  logs: PracticeLog[];
  tricks: Trick[];
  seasonMode: SeasonMode;
  now?: Date;
}): GrowthAnalyticsSummary {
  const trainingType = targetTrainingType(seasonMode);
  const focusedLogs = logs.filter((log) => (log.trainingType ?? "snow") === trainingType);
  const monthStart = startOfMonth(now);
  const weekStart = startOfWeek(now);
  const successCount = focusedLogs.reduce((sum, log) => sum + log.successCount, 0);
  const failCount = focusedLogs.reduce((sum, log) => sum + log.failCount, 0);
  const trickStats = aggregateTrickStats(focusedLogs, tricks, now, trainingType);

  return {
    seasonMode,
    trainingType,
    practiceCountThisMonth: focusedLogs.filter((log) => toDate(log.date) >= monthStart).length,
    practiceCountThisWeek: focusedLogs.filter((log) => toDate(log.date) >= weekStart).length,
    totalPracticeCount: focusedLogs.length,
    successCount,
    failCount,
    overallSuccessRate: calculateSuccessRate(successCount, failCount),
    topPracticed: [...trickStats].sort((a, b) => b.logCount - a.logCount).slice(0, 5),
    weakTricks: trickStats.filter((stat) => stat.attempts >= 5).sort((a, b) => a.successRate - b.successRate).slice(0, 5),
    improvingTricks: improvingTricks(focusedLogs, tricks),
    recommendedTricks: recommendedTricks(trickStats),
    trickStats,
  };
}
