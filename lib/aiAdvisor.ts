import { calculateSuccessRate } from "./calculations";
import type { Goal, OffTrainingPlan, PracticeLog, PracticeVideo, Profile, Trick } from "./types";

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
  videoContextCount: number;
}

export interface TrickStatForAi {
  trickId: string;
  nameJa: string;
  category: string;
  difficulty: number;
  totalAttempts: number;
  successRate: number;
  recentSuccessRate: number;
  previousSuccessRate: number;
  trendDelta: number;
  snowLogCount: number;
  shibakatsuLogCount: number;
  daysSinceLastPractice: number | null;
}

export interface PracticeVideoContextForAi {
  practiceLogId: string;
  trickId: string;
  trickName: string;
  date: string;
  trainingType: PracticeLog["trainingType"];
  successCount: number;
  failCount: number;
  successRate: number;
  weakPoint: string;
  selfAnalysis: string;
  nextTask: string;
  videoCount: number;
  videoFileNames: string[];
  videoCreatedAts: string[];
}

export interface OpenAiAdvice {
  summary: string;
  weakPoints: string[];
  recommendedTricks: string[];
  nextPracticeMenu: string[];
  offTrainingAdvice: string[];
  videoInsights: string[];
  videosToReview: string[];
  nextVideosToShoot: string[];
  priority: "high" | "medium" | "low";
}

export interface GenerateAdviceParams {
  tricks: Trick[];
  logs: PracticeLog[];
  videos?: PracticeVideo[];
  goals?: Goal[];
  profile?: Profile;
  offTrainingPlan?: OffTrainingPlan | null;
  now?: Date;
}

interface InternalTrickStats {
  trick: Trick;
  logs: PracticeLog[];
  snowLogs: PracticeLog[];
  shibakatsuLogs: PracticeLog[];
  successRate: number;
  recentSuccessRate: number;
  previousSuccessRate: number;
  trendDelta: number;
  totalAttempts: number;
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

function getAttempts(logs: PracticeLog[]): number {
  return logs.reduce((sum, log) => sum + log.successCount + log.failCount, 0);
}

function includesAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

function buildInternalStats(tricks: Trick[], logs: PracticeLog[], now: Date): InternalTrickStats[] {
  return tricks.map((trick) => {
    const trickLogs = logs.filter((log) => log.trickId === trick.id).sort((a, b) => toTime(b.date) - toTime(a.date));
    const recentLogs = trickLogs.slice(0, 10);
    const previousLogs = trickLogs.slice(10, 20);
    const recentRate = getRate(recentLogs);
    const previousRate = getRate(previousLogs);
    const lastLog = trickLogs[0];
    return {
      trick,
      logs: trickLogs,
      snowLogs: trickLogs.filter((log) => (log.trainingType ?? "snow") === "snow"),
      shibakatsuLogs: trickLogs.filter((log) => log.trainingType === "shibakatsu"),
      successRate: getRate(trickLogs),
      recentSuccessRate: recentRate,
      previousSuccessRate: previousRate,
      trendDelta: previousLogs.length ? recentRate - previousRate : 0,
      totalAttempts: getAttempts(trickLogs),
      daysSinceLastPractice: lastLog ? daysBetween(lastLog.date, now) : null,
    };
  });
}

export function buildTrickStatsForAi({ tricks, logs, now = new Date() }: Pick<GenerateAdviceParams, "tricks" | "logs" | "now">): TrickStatForAi[] {
  return buildInternalStats(tricks, [...logs].sort((a, b) => toTime(b.date) - toTime(a.date)), now).map((item) => ({
    trickId: item.trick.id,
    nameJa: item.trick.nameJa,
    category: item.trick.category,
    difficulty: item.trick.difficulty,
    totalAttempts: item.totalAttempts,
    successRate: item.successRate,
    recentSuccessRate: item.recentSuccessRate,
    previousSuccessRate: item.previousSuccessRate,
    trendDelta: item.trendDelta,
    snowLogCount: item.snowLogs.length,
    shibakatsuLogCount: item.shibakatsuLogs.length,
    daysSinceLastPractice: item.daysSinceLastPractice,
  }));
}

export function buildPracticeVideoContexts({ tricks, logs, videos = [] }: Pick<GenerateAdviceParams, "tricks" | "logs" | "videos">): PracticeVideoContextForAi[] {
  const videosByLog = new Map<string, PracticeVideo[]>();
  videos.forEach((video) => {
    const current = videosByLog.get(video.practiceLogId) ?? [];
    videosByLog.set(video.practiceLogId, [...current, video]);
  });

  return logs
    .map((log) => {
      const logVideos = videosByLog.get(log.id) ?? [];
      const trick = tricks.find((item) => item.id === log.trickId);
      return {
        practiceLogId: log.id,
        trickId: log.trickId,
        trickName: trick?.nameJa ?? log.trickId,
        date: log.date,
        trainingType: log.trainingType ?? "snow",
        successCount: log.successCount,
        failCount: log.failCount,
        successRate: calculateSuccessRate(log.successCount, log.failCount),
        weakPoint: log.weakPoint,
        selfAnalysis: log.selfAnalysis,
        nextTask: log.nextTask,
        videoCount: logVideos.length,
        videoFileNames: logVideos.map((video) => video.fileName),
        videoCreatedAts: logVideos.map((video) => video.createdAt),
      };
    })
    .filter((context) => context.videoCount > 0)
    .sort((a, b) => toTime(b.date) - toTime(a.date));
}

function toAdviceTrick(stats: InternalTrickStats, index: number, reason: string): AdviceTrick {
  return {
    trick: stats.trick,
    successRate: stats.successRate,
    recentSuccessRate: stats.recentSuccessRate,
    priority: index === 0 ? "★★★★★" : index === 1 ? "★★★★" : "★★★",
    priorityLabel: index === 0 ? "最優先" : index === 1 ? "推奨" : "余裕があれば",
    reason,
  };
}

function detectCategoryShortage(tricks: Trick[], logs: PracticeLog[], keywords: string[]): boolean {
  const targetIds = new Set(tricks.filter((trick) => includesAny(`${trick.nameJa}${trick.nameEn}${trick.category}`, keywords)).map((trick) => trick.id));
  if (!targetIds.size) return false;
  return logs.slice(0, 10).filter((log) => targetIds.has(log.trickId)).length <= 1;
}

function offTrainingStatus(plan?: OffTrainingPlan | null): string {
  if (!plan) return "オフトレプランが未作成です。練習頻度が落ちる週は、先にオフトレ診断を作っておくと迷いにくくなります。";
  const activeDays = plan.weeklyPlan.filter((day) => day.dayType !== "休み" && day.items.length > 0).length;
  return activeDays > 0 ? `オフトレは週${activeDays}日分の計画があります。雪上練習が少ない週も土台作りは継続できています。` : "オフトレ予定が少なめです。短い体幹・柔軟だけでも入れると次の雪上練習につながります。";
}

export function generateRuleBasedAdvice({ tricks, logs, videos = [], offTrainingPlan, now = new Date() }: GenerateAdviceParams): AIAdvice {
  const sortedLogs = [...logs].sort((a, b) => toTime(b.date) - toTime(a.date));
  const stats = buildInternalStats(tricks, sortedLogs, now);
  const videoContexts = buildPracticeVideoContexts({ tricks, logs: sortedLogs, videos });
  const practicedStats = stats.filter((item) => item.logs.length > 0);
  const weakStats = practicedStats
    .filter((item) => item.successRate < 50 || item.recentSuccessRate < 50 || item.trendDelta <= -15)
    .sort((a, b) => a.recentSuccessRate - b.recentSuccessRate || a.successRate - b.successRate);
  const staleStats = stats
    .filter((item) => item.daysSinceLastPractice === null || item.daysSinceLastPractice >= 21)
    .sort((a, b) => (b.daysSinceLastPractice ?? 999) - (a.daysSinceLastPractice ?? 999));
  const shibakatsuCount = practicedStats.reduce((sum, item) => sum + item.shibakatsuLogs.length, 0);

  const recommendedSource = [...weakStats, ...staleStats].filter((item, index, array) => array.findIndex((candidate) => candidate.trick.id === item.trick.id) === index).slice(0, 3);
  const weakTricks = weakStats.slice(0, 3).map((item, index) => toAdviceTrick(item, index, item.trendDelta <= -15 ? "最近の成功率が下がっています" : "成功率が低めです"));
  const recommendedTricks = recommendedSource.map((item, index) => {
    const reason = item.daysSinceLastPractice === null ? "まだ記録がありません" : item.daysSinceLastPractice >= 21 ? `${item.daysSinceLastPractice}日練習していません` : item.trendDelta <= -15 ? "直近10回で成功率が低下" : "基礎固めに向いています";
    return toAdviceTrick(item, index, reason);
  });

  const trendAnalysis: string[] = [];
  const declining = weakStats.find((item) => item.trendDelta <= -15);
  if (declining) trendAnalysis.push(`${declining.trick.nameJa}の成功率が最近低下しています`);
  if (detectCategoryShortage(tricks, sortedLogs, ["オーリー", "Ollie", "弾き"])) trendAnalysis.push("オーリー系の練習量が不足しています");
  const fsStats = practicedStats.filter((item) => includesAny(`${item.trick.nameJa}${item.trick.nameEn}`, ["FS", "Front"]));
  if (fsStats.length && fsStats.every((item) => item.recentSuccessRate >= 60)) trendAnalysis.push("FS系は安定しています");
  const practiceDays = new Set(sortedLogs.slice(0, 10).map((log) => log.date)).size;
  if (practiceDays <= 2 && sortedLogs.length > 0) trendAnalysis.push("直近の練習頻度は少なめです");
  if (videoContexts.length > 0) trendAnalysis.push(`動画付き記録が${videoContexts.length}件あります。直近の動画付きログから見直し候補を選べます`);
  if (shibakatsuCount > 0) trendAnalysis.push(`シバカツ記録は${shibakatsuCount}件あります。動作確認の習慣は作れています`);
  trendAnalysis.push(offTrainingStatus(offTrainingPlan));

  const top = recommendedTricks[0];
  const videoHint = videoContexts[0] ? `${videoContexts[0].trickName}の動画を見直して、${videoContexts[0].weakPoint || videoContexts[0].nextTask || "姿勢と抜けのタイミング"}を確認しましょう。` : "動画を追加すると、より具体的なアドバイスができます。";
  const shibakatsuHint = shibakatsuCount > 0 ? "シバカツの日は、同じ系統の動作確認を短く反復しましょう。" : "シバカツ記録も残すと、雪上以外の伸びが見えやすくなります。";
  const message = top
    ? `最近は${top.trick.nameJa}を優先すると良さそうです。${top.reason}。${videoHint} ${shibakatsuHint}`
    : sortedLogs.length
      ? `全体的に大きな崩れは少なめです。次は直近で練習していない技を1つ選び、成功率の変化を見ていきましょう。${videoHint}`
      : "まだ練習記録が少ないので、まずは今日の1本を記録しましょう。動画も一緒に残すと、あとで姿勢やタイミングを見直せます。";

  return { weakTricks, recommendedTricks, trendAnalysis: trendAnalysis.slice(0, 6), message, videoContextCount: videoContexts.length };
}

export function convertRuleBasedToOpenAiAdvice(advice: AIAdvice, videoContexts: PracticeVideoContextForAi[] = []): OpenAiAdvice {
  const firstVideo = videoContexts[0];
  return {
    summary: advice.message,
    weakPoints: advice.weakTricks.map((item) => `${item.trick.nameJa}: ${item.reason}`),
    recommendedTricks: advice.recommendedTricks.map((item) => `${item.priorityLabel}: ${item.trick.nameJa}（${item.reason}）`),
    nextPracticeMenu: advice.recommendedTricks.slice(0, 3).map((item) => `${item.trick.nameJa}を10本記録し、成功/失敗の理由をメモする`),
    offTrainingAdvice: advice.trendAnalysis.filter((item) => item.includes("オフトレ") || item.includes("シバカツ")),
    videoInsights: firstVideo ? [`${firstVideo.trickName}は動画付き記録があります。成功率${firstVideo.successRate}%、苦手ポイント「${firstVideo.weakPoint || "未記入"}」を確認しましょう。`] : ["動画を追加すると、より具体的なアドバイスができます"],
    videosToReview: videoContexts.slice(0, 3).map((context) => `${context.trickName}: ${context.videoFileNames.join(", ")}`),
    nextVideosToShoot: advice.recommendedTricks.slice(0, 2).map((item) => `${item.trick.nameJa}を次回撮影して、抜けと着地姿勢を確認する`),
    priority: advice.recommendedTricks[0]?.priority === "★★★★★" ? "high" : advice.recommendedTricks.length ? "medium" : "low",
  };
}

export async function generateAiAdvice(params: GenerateAdviceParams): Promise<OpenAiAdvice> {
  const videoContexts = buildPracticeVideoContexts(params);
  const fallback = convertRuleBasedToOpenAiAdvice(generateRuleBasedAdvice(params), videoContexts);
  try {
    const response = await fetch("/api/ai/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        practiceLogs: params.logs,
        practiceVideos: params.videos ?? [],
        videoContexts,
        goals: params.goals ?? [],
        profile: params.profile ?? null,
        offtrainingPlan: params.offTrainingPlan ?? null,
        trickStats: buildTrickStatsForAi(params),
        tricks: params.tricks,
      }),
    });
    if (!response.ok) return fallback;
    const data = (await response.json()) as OpenAiAdvice;
    return normalizeOpenAiAdvice(data, fallback);
  } catch {
    return fallback;
  }
}

export function generateAdvice(params: GenerateAdviceParams): AIAdvice {
  return generateRuleBasedAdvice(params);
}

export function normalizeOpenAiAdvice(value: Partial<OpenAiAdvice>, fallback: OpenAiAdvice): OpenAiAdvice {
  const priority = value.priority === "high" || value.priority === "medium" || value.priority === "low" ? value.priority : fallback.priority;
  return {
    summary: typeof value.summary === "string" && value.summary.trim() ? value.summary : fallback.summary,
    weakPoints: Array.isArray(value.weakPoints) ? value.weakPoints.map(String).slice(0, 5) : fallback.weakPoints,
    recommendedTricks: Array.isArray(value.recommendedTricks) ? value.recommendedTricks.map(String).slice(0, 3) : fallback.recommendedTricks,
    nextPracticeMenu: Array.isArray(value.nextPracticeMenu) ? value.nextPracticeMenu.map(String).slice(0, 6) : fallback.nextPracticeMenu,
    offTrainingAdvice: Array.isArray(value.offTrainingAdvice) ? value.offTrainingAdvice.map(String).slice(0, 5) : fallback.offTrainingAdvice,
    videoInsights: Array.isArray(value.videoInsights) ? value.videoInsights.map(String).slice(0, 5) : fallback.videoInsights,
    videosToReview: Array.isArray(value.videosToReview) ? value.videosToReview.map(String).slice(0, 5) : fallback.videosToReview,
    nextVideosToShoot: Array.isArray(value.nextVideosToShoot) ? value.nextVideosToShoot.map(String).slice(0, 5) : fallback.nextVideosToShoot,
    priority,
  };
}
