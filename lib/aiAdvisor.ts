import { calculateSuccessRate } from "./calculations";
import type { OffTrainingPlan, PracticeLog, Trick } from "./types";

export interface AdviceTrick {
  trick: Trick;
  successRate: number;
  recentSuccessRate: number;
  priority: "★★★★★" | "★★★★" | "★★★";
  priorityLabel: "最優先" | "推奨" | "余裕があれば";
  reason: string;
}

export interface AIAdvice {
  weakTricks: AdviceTrick[];
  recommendedTricks: AdviceTrick[];
  trendAnalysis: string[];
  message: string;
}

interface GenerateAdviceParams {
  tricks: Trick[];
  logs: PracticeLog[];
  offTrainingPlan?: OffTrainingPlan | null;
  now?: Date;
}

interface TrickStats {
  trick: Trick;
  logs: PracticeLog[];
  snowLogs: PracticeLog[];
  shibakatsuLogs: PracticeLog[];
  successRate: number;
  recentSuccessRate: number;
  previousSuccessRate: number;
  trendDelta: number;
  daysSinceLastPractice: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toTime(date: string): number {
  return new Date(`${date}T00:00:00`).getTime();
}

function daysBetween(fromDate: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - toTime(fromDate)) / MS_PER_DAY));
}

function getRate(logs: PracticeLog[]): number {
  const [success, fail] = logs.reduce<[number, number]>((sum, log) => [sum[0] + log.successCount, sum[1] + log.failCount], [0, 0]);
  return calculateSuccessRate(success, fail);
}

function includesAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

function buildStats(tricks: Trick[], logs: PracticeLog[], now: Date): TrickStats[] {
  return tricks.map((trick) => {
    const trickLogs = logs.filter((log) => log.trickId === trick.id).sort((a, b) => toTime(b.date) - toTime(a.date));
    const recentLogs = trickLogs.slice(0, 10);
    const previousLogs = trickLogs.slice(10, 20);
    const lastLog = trickLogs[0];
    return {
      trick,
      logs: trickLogs,
      snowLogs: trickLogs.filter((log) => (log.trainingType ?? "snow") === "snow"),
      shibakatsuLogs: trickLogs.filter((log) => log.trainingType === "shibakatsu"),
      successRate: getRate(trickLogs),
      recentSuccessRate: getRate(recentLogs),
      previousSuccessRate: getRate(previousLogs),
      trendDelta: previousLogs.length ? getRate(recentLogs) - getRate(previousLogs) : 0,
      daysSinceLastPractice: lastLog ? daysBetween(lastLog.date, now) : null,
    };
  });
}

function toAdviceTrick(stats: TrickStats, index: number, reason: string): AdviceTrick {
  const priority = index === 0 ? "★★★★★" : index === 1 ? "★★★★" : "★★★";
  const priorityLabel = index === 0 ? "最優先" : index === 1 ? "推奨" : "余裕があれば";
  return {
    trick: stats.trick,
    successRate: stats.successRate,
    recentSuccessRate: stats.recentSuccessRate,
    priority,
    priorityLabel,
    reason,
  };
}

function detectCategoryShortage(tricks: Trick[], logs: PracticeLog[], keywords: string[]): string | null {
  const targetIds = new Set(tricks.filter((trick) => includesAny(`${trick.nameJa}${trick.nameEn}${trick.category}`, keywords)).map((trick) => trick.id));
  if (!targetIds.size) return null;
  const recentCount = logs.slice(0, 10).filter((log) => targetIds.has(log.trickId)).length;
  return recentCount <= 1 ? keywords[0] : null;
}

function offTrainingStatus(plan?: OffTrainingPlan | null): string {
  if (!plan) return "オフトレプランが未作成です。練習頻度が落ちる週は、先にオフトレ診断を作っておくと迷いにくくなります。";
  const activeDays = plan.weeklyPlan.filter((day) => day.dayType !== "休み" && day.items.length > 0).length;
  return activeDays > 0 ? `オフトレは週${activeDays}日分の計画があります。雪上練習が少ない週も土台作りは継続できています。` : "オフトレ予定が少なめです。短い体幹・柔軟だけでも入れると次の雪上練習につながります。";
}

export function generateAdvice({ tricks, logs, offTrainingPlan, now = new Date() }: GenerateAdviceParams): AIAdvice {
  const sortedLogs = [...logs].sort((a, b) => toTime(b.date) - toTime(a.date));
  const stats = buildStats(tricks, sortedLogs, now);
  const practicedStats = stats.filter((item) => item.logs.length > 0);
  const weakStats = practicedStats
    .filter((item) => item.successRate < 50 || item.recentSuccessRate < 50 || item.trendDelta <= -15)
    .sort((a, b) => a.recentSuccessRate - b.recentSuccessRate || a.successRate - b.successRate);
  const staleStats = stats
    .filter((item) => item.daysSinceLastPractice === null || item.daysSinceLastPractice >= 21)
    .sort((a, b) => (b.daysSinceLastPractice ?? 999) - (a.daysSinceLastPractice ?? 999));
  const shibakatsuStats = practicedStats.filter((item) => item.shibakatsuLogs.length > 0);

  const recommendedSource = [...weakStats, ...staleStats].filter((item, index, array) => array.findIndex((candidate) => candidate.trick.id === item.trick.id) === index).slice(0, 3);
  const weakTricks = weakStats.slice(0, 3).map((item, index) => toAdviceTrick(item, index, item.trendDelta <= -15 ? "最近の成功率が下がっています" : "成功率が低めです"));
  const recommendedTricks = recommendedSource.map((item, index) => {
    const reason = item.daysSinceLastPractice === null ? "まだ記録がありません" : item.daysSinceLastPractice >= 21 ? `${item.daysSinceLastPractice}日練習していません` : item.trendDelta <= -15 ? "直近10回で成功率が低下" : "基礎固めに向いています";
    return toAdviceTrick(item, index, reason);
  });

  const trendAnalysis: string[] = [];
  const declining = weakStats.find((item) => item.trendDelta <= -15);
  if (declining) trendAnalysis.push(`${declining.trick.nameJa}の成功率が最近低下しています`);

  const ollieShortage = detectCategoryShortage(tricks, sortedLogs, ["オーリー", "Ollie", "弾き"]);
  if (ollieShortage) trendAnalysis.push("オーリー系の練習量が不足しています");

  const fsStats = practicedStats.filter((item) => includesAny(`${item.trick.nameJa}${item.trick.nameEn}`, ["FS", "Front"]));
  if (fsStats.length && fsStats.every((item) => item.recentSuccessRate >= 60)) trendAnalysis.push("FS系は安定しています");

  const practiceDays = new Set(sortedLogs.slice(0, 10).map((log) => log.date)).size;
  if (practiceDays <= 2 && sortedLogs.length > 0) trendAnalysis.push("直近の練習頻度は少なめです");
  if (shibakatsuStats.length) trendAnalysis.push(`シバカツ記録は${shibakatsuStats.reduce((sum, item) => sum + item.shibakatsuLogs.length, 0)}件あります。動作確認の習慣は作れています`);
  trendAnalysis.push(offTrainingStatus(offTrainingPlan));

  const top = recommendedTricks[0];
  const shibakatsuHint = shibakatsuStats.length ? "シバカツの日は、同じ系統の動作確認を短く反復しましょう。" : "シバカツ記録も残すと、雪上以外の伸びが見えやすくなります。";
  const message = top
    ? `最近は${top.trick.nameJa}を優先すると良さそうです。${top.reason}。基礎練習を少し増やしつつ、${shibakatsuHint}`
    : sortedLogs.length
      ? `全体的に大きな崩れは少なめです。次は直近で練習していない技を1つ選び、成功率の変化を見ていきましょう。${shibakatsuHint}`
      : "まだ練習記録が少ないので、まずは今日の1本を記録しましょう。成功/失敗の回数と次回課題が入ると、アドバイスの精度が上がります。";

  return {
    weakTricks,
    recommendedTricks,
    trendAnalysis: trendAnalysis.slice(0, 5),
    message,
  };
}
