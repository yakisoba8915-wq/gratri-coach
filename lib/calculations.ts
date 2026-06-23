import type { PracticeLog, TrainingType } from "./types";

export function calculateSuccessRate(successCount: number, failCount: number): number {
  const total = successCount + failCount;
  return total === 0 ? 0 : Math.round((successCount / total) * 100);
}

export function calculateTrickRate(logs: PracticeLog[], trickId: string, trainingType?: TrainingType): number {
  return calculateSuccessRate(...logs.filter((log) => log.trickId === trickId && (!trainingType || (log.trainingType ?? "snow") === trainingType)).reduce<[number, number]>((sum, log) => [sum[0] + log.successCount, sum[1] + log.failCount], [0, 0]));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}
