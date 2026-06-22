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
export interface PracticeLog {
  id: string; date: string; resortName: string; trickId: string; successCount: number; failCount: number;
  memo: string; selfAnalysis: string; weakPoint: string; nextTask: string; snowCondition: SnowCondition; videoUrls: string[];
}
export interface Training { id: string; name: string; category: TrainingCategory; description: string; relatedTrickIds: string[]; minutes: number; }
export interface Goal { id: string; season: string; type: GoalType; trickId: string; targetRate?: number; completed: boolean; }
export interface Profile { displayName: string; stance: Stance | ""; }
export interface Recommendation { trick: Trick; reason: string; score: number; }

export type OffTrainingEquipment = "シバカツボードを持っている" | "トリックスノーを持っている" | "その他の練習器具を持っている" | "どれも持っていない" | "これから購入予定";
export type OffTrainingIntensity = "軽め" | "普通" | "きつめ";
export interface OffTrainingPreferences {
  equipment: OffTrainingEquipment[]; weeklyDays: number; sessionMinutes: number; location: string[];
  gymAvailable: string; focusAbility: string[]; targetTrickType: string[]; exerciseHabit: string;
  injuryConcern: string[]; intensity: OffTrainingIntensity;
}
export interface OffTrainingExercise {
  name: string; category: TrainingCategory; prescription: string; caution: string; ability: string;
}
export interface OffTrainingDay { label: string; theme: string; exercises: OffTrainingExercise[]; }
export interface OffTrainingPlan {
  id: string; title: string; description: string; weeklyDays: number; sessionMinutes: number; days: OffTrainingDay[];
}
