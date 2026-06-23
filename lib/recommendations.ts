import { calculateTrickRate } from "./calculations";
import type { PracticeLog, Recommendation, Trick } from "./types";

const isSnowLog = (log: PracticeLog) => (log.trainingType ?? "snow") === "snow";

export function getRecommendations(tricks: Trick[], logs: PracticeLog[], limit = 3): Recommendation[] {
  const snowLogs = logs.filter(isSnowLog);
  const practiced = new Set(snowLogs.map((log) => log.trickId));

  return tricks
    .filter((trick) => trick.masteryStatus !== "完成")
    .map((trick) => {
      const rate = calculateTrickRate(snowLogs, trick.id, "snow");
      const missingPrerequisite = trick.prerequisites.some((id) => tricks.find((item) => item.id === id)?.masteryStatus === "未挑戦");
      let score = practiced.has(trick.id) ? 100 - rate : 20;
      let reason = practiced.has(trick.id) ? `ゲレンデ成功率 ${rate}%` : "ゲレンデ記録がまだありません";
      if (trick.favorite) {
        score += 35;
        reason = "お気に入りの技";
      }
      if (missingPrerequisite) {
        score += 20;
        reason = "前提技もあわせて確認";
      }
      return { trick, reason, score };
    })
    .sort((a, b) => b.score - a.score || a.trick.difficulty - b.trick.difficulty)
    .slice(0, limit);
}

export function getTrendingTrick(tricks: Trick[], logs: PracticeLog[]): Trick | undefined {
  const scores = new Map<string, number>();
  logs
    .filter(isSnowLog)
    .slice(0, 6)
    .forEach((log) => scores.set(log.trickId, (scores.get(log.trickId) ?? 0) + log.successCount));
  return [...tricks].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))[0];
}
