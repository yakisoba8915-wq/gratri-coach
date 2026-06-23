export const masteryStatuses = ["未挑戦", "練習中", "1回だけメイク", "低確率メイク", "ほぼ安定", "完成"] as const;
export type MasteryStatus = (typeof masteryStatuses)[number];

export const snowConditions = ["パウダー", "圧雪", "シャバ雪", "アイスバーン", "ザラメ", "湿雪", "人工雪", "不明"] as const;
export type SnowCondition = (typeof snowConditions)[number];
export type TrainingCategory = "シバカツ" | "筋トレ" | "柔軟";
export type GoalType = "技をメイクする" | "成功率を上げる";
export type Stance = "レギュラー" | "グーフィー";

export interface Trick {
  id: string; nameJa: string; nameEn: string; category: string; difficulty: number;
  description: string; howTo: string[]; commonMistakes: string[]; prerequisites: string[];
  relatedTrainings: string[]; referenceVideos: string[]; imageUrls: string[];
  masteryStatus: MasteryStatus; favorite: boolean;
}
export type TrainingType = "snow" | "shibakatsu";
export interface PracticeLog {
  id: string; date: string; trainingType?: TrainingType; resortName: string; trickId: string; successCount: number; failCount: number;
  memo: string; selfAnalysis: string; weakPoint: string; nextTask: string; snowCondition: SnowCondition; videoUrls: string[];
  shibakatsuMenu?: string; durationMinutes?: number; reps?: number; sets?: number;
}
export interface PracticeVideo {
  id: string; userId: string; practiceLogId: string; trickId: string; fileUrl: string; filePath: string;
  fileName: string; fileSize: number; mimeType: string; createdAt: string;
}
export interface PracticeVideoFrame {
  id: string; userId: string; practiceVideoId: string; practiceLogId: string; frameUrl: string; framePath: string;
  frameIndex: number; capturedAtPercent: number; createdAt: string;
}
export interface VideoAnalysisResult {
  summary: string; likelyIssues: string[]; improvementPoints: string[]; nextPractice: string[];
  shibakatsuAdvice: string[]; confidence: "low" | "medium" | "high";
}
export interface PracticeVideoAnalysisResult extends VideoAnalysisResult {
  id: string; userId: string; practiceVideoId: string; practiceLogId: string; trickId: string; createdAt: string;
}
export interface VideoAnalysisComparison {
  repeatedIssues: string[]; improvedPoints: string[]; newIssues: string[]; nextFocus: string[];
}
export type AiAdviceActionType = "next_task" | "offtraining_plan" | "recommended_trick";
export type AiAdviceAppliedTo = "practice_logs" | "offtraining_plans" | "home_recommendations";
export interface AiAdviceAction {
  id: string; userId: string; practiceLogId: string; practiceVideoId: string; analysisResultId: string;
  actionType: AiAdviceActionType; appliedTo: AiAdviceAppliedTo; content: Record<string, unknown>; createdAt: string;
}
export interface AiPracticeMenuUpdate {
  nextTask: string; recommendedTricks: string[]; shibakatsuItems: OffTrainingPlanItem[]; strengthFlexItems: OffTrainingPlanItem[];
}
export type AiCoachRole = "user" | "assistant" | "system";
export type AiCoachSourceType = "chat" | "advice" | "video_analysis" | "training_plan";
export interface AiCoachMessage {
  id: string; userId: string; role: AiCoachRole; message: string; sourceType: AiCoachSourceType;
  relatedPracticeLogId?: string | null; relatedVideoId?: string | null; relatedAnalysisResultId?: string | null; createdAt: string;
}
export interface Training { id: string; name: string; category: TrainingCategory; description: string; relatedTrickIds: string[]; minutes: number; }
export interface Goal { id: string; season: string; type: GoalType; trickId: string; targetRate?: number; completed: boolean; }
export type PlanType = "free" | "premium" | "admin";
export type AiFeatureType = "ai_chat" | "ai_advice" | "ai_video_analysis";
export interface AiUsageStatus {
  featureType: AiFeatureType; planType: PlanType; used: number; limit: number | null; remaining: number | null; unlimited: boolean; limitReached: boolean;
}
export interface Profile { displayName: string; stance: Stance | ""; avatarUrl?: string | null; avatarPath?: string | null; planType?: PlanType; }
export interface Recommendation { trick: Trick; reason: string; score: number; }

export type OffTrainingEquipment = "シバカツボードを持っている" | "トリックスノーを持っている" | "その他の練習器具を持っている" | "どれも持っていない" | "これから購入予定";
export type OffTrainingIntensity = "軽め" | "普通" | "きつめ";
export interface OffTrainingPreferences {
  equipment: OffTrainingEquipment[]; weeklyDays: number; sessionMinutes: number; location: string[];
  gymAvailable: string; focusAbility: string[]; targetTrickType: string[]; exerciseHabit: string;
  injuryConcern: string[]; intensity: OffTrainingIntensity;
}
export type Weekday = "月" | "火" | "水" | "木" | "金" | "土" | "日";
export type OffTrainingDayType = "シバカツの日" | "板操作イメージトレーニングの日" | "筋トレ＋柔軟の日" | "休み";
export interface OffTrainingPlanItem {
  name: string; category: TrainingCategory; amount: string; purpose: string; caution: string;
}
export interface WeeklyOffTrainingDay {
  day: Weekday; dayType: OffTrainingDayType; title: string; focus: string[]; estimatedMinutes: number; items: OffTrainingPlanItem[];
}
export interface OffTrainingPlan {
  id: string; title: string; description: string; weeklyDays: number; sessionMinutes: number; weeklyPlan: WeeklyOffTrainingDay[];
}
