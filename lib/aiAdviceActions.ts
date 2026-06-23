"use client";

import { getCurrentUser } from "./auth";
import { supabase } from "./supabase";
import type {
  AiAdviceAction,
  AiAdviceActionType,
  AiAdviceAppliedTo,
  AiPracticeMenuUpdate,
  OffTrainingPlan,
  OffTrainingPlanItem,
  PracticeLog,
  TrainingCategory,
  VideoAnalysisResult,
  WeeklyOffTrainingDay,
} from "./types";

interface AiAdviceActionRow {
  id: string;
  user_id: string;
  practice_log_id: string;
  practice_video_id: string;
  analysis_result_id: string;
  action_type: AiAdviceActionType;
  applied_to: AiAdviceAppliedTo;
  content: Record<string, unknown>;
  created_at: string;
}

interface ApplyAiVideoAnalysisParams {
  practiceLog: PracticeLog;
  practiceVideoId: string;
  analysisResultId: string;
  analysis: VideoAnalysisResult;
}

const SHIBAKATSU_CATEGORY = "シバカツ" as TrainingCategory;
const STRENGTH_CATEGORY = "筋トレ" as TrainingCategory;
const FLEXIBILITY_CATEGORY = "柔軟" as TrainingCategory;

const fromActionRow = (row: AiAdviceActionRow): AiAdviceAction => ({
  id: row.id,
  userId: row.user_id,
  practiceLogId: row.practice_log_id,
  practiceVideoId: row.practice_video_id,
  analysisResultId: row.analysis_result_id,
  actionType: row.action_type,
  appliedTo: row.applied_to,
  content: row.content,
  createdAt: row.created_at,
});

async function requireActionUser(): Promise<string> {
  if (!supabase) throw new Error("Supabase が未設定です。");
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインするとAI解析結果を練習メニューへ反映できます。");
  return user.id;
}

function textOf(analysis: VideoAnalysisResult): string {
  return [analysis.summary, ...analysis.likelyIssues, ...analysis.improvementPoints, ...analysis.nextPractice, ...analysis.shibakatsuAdvice].join(" ");
}

function includesAny(source: string, keywords: string[]): boolean {
  return keywords.some((keyword) => source.includes(keyword));
}

function item(name: string, category: TrainingCategory, amount: string, purpose: string): OffTrainingPlanItem {
  return {
    name,
    category,
    amount,
    purpose,
    caution: "AI解析由来の補強メニューです。痛みや違和感がある場合は中止してください。",
  };
}

function uniqueItems(items: OffTrainingPlanItem[]): OffTrainingPlanItem[] {
  const seen = new Set<string>();
  return items.filter((nextItem) => {
    const key = `${nextItem.category}:${nextItem.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function generatePracticeMenuUpdateFromAnalysis(analysis: VideoAnalysisResult): AiPracticeMenuUpdate {
  const source = textOf(analysis);
  const shibakatsuItems: OffTrainingPlanItem[] = [];
  const strengthFlexItems: OffTrainingPlanItem[] = [];

  if (includesAny(source, ["回転", "肩", "先行", "目線", "上半身"])) {
    shibakatsuItems.push(item("回転導入練習", SHIBAKATSU_CATEGORY, "10回 × 3セット", "上半身の先行動作と回転の入りを整える"));
    strengthFlexItems.push(item("ロシアンツイスト", STRENGTH_CATEGORY, "20回 × 3セット", "回転力と体幹の連動を高める"));
    strengthFlexItems.push(item("胸椎回旋", FLEXIBILITY_CATEGORY, "左右30秒 × 2セット", "上半身をスムーズに先行させる"));
  }

  if (includesAny(source, ["着地", "ランディング", "後傾", "前傾", "バランス"])) {
    shibakatsuItems.push(item("着地姿勢確認", SHIBAKATSU_CATEGORY, "5分", "板の上で安定した着地姿勢を確認する"));
    strengthFlexItems.push(item("片足バランス", STRENGTH_CATEGORY, "左右30秒 × 3セット", "着地時の左右ブレを減らす"));
  }

  if (includesAny(source, ["弾き", "抜け", "オーリー", "ノーリー", "高さ"])) {
    shibakatsuItems.push(item("オーリー動作確認", SHIBAKATSU_CATEGORY, "10回 × 3セット", "弾きのタイミングと抜けを確認する"));
    strengthFlexItems.push(item("ジャンプスクワット", STRENGTH_CATEGORY, "10回 × 3セット", "弾きの初速と下半身の出力を高める"));
  }

  if (includesAny(source, ["プレス", "ノーズ", "テール", "重心", "乗せ替え"])) {
    shibakatsuItems.push(item("ノーズ・テールプレス練習", SHIBAKATSU_CATEGORY, "各5分", "プレス姿勢と重心位置を安定させる"));
    strengthFlexItems.push(item("股関節ストレッチ", FLEXIBILITY_CATEGORY, "左右30秒 × 2セット", "プレス姿勢を作りやすくする"));
  }

  if (strengthFlexItems.length === 0 && shibakatsuItems.length === 0) {
    shibakatsuItems.push(item("基本姿勢チェック", SHIBAKATSU_CATEGORY, "5分", "目線・肩・膝の向きを整える"));
    strengthFlexItems.push(item("プランク", STRENGTH_CATEGORY, "30秒 × 3セット", "姿勢を支える体幹を強化する"));
  }

  const nextTask = analysis.nextPractice[0] || analysis.improvementPoints[0] || analysis.likelyIssues[0] || "AI解析結果をもとに、姿勢とタイミングを動画で確認する";

  return {
    nextTask,
    recommendedTricks: analysis.nextPractice.slice(0, 3),
    shibakatsuItems: uniqueItems(shibakatsuItems).slice(0, 3),
    strengthFlexItems: uniqueItems(strengthFlexItems).slice(0, 4),
  };
}

async function saveAction(userId: string, params: ApplyAiVideoAnalysisParams, actionType: AiAdviceActionType, appliedTo: AiAdviceAppliedTo, content: Record<string, unknown>): Promise<AiAdviceAction> {
  if (!supabase) throw new Error("Supabase が未設定です。");
  const { data, error } = await supabase
    .from("ai_advice_actions")
    .insert({
      user_id: userId,
      practice_log_id: params.practiceLog.id,
      practice_video_id: params.practiceVideoId,
      analysis_result_id: params.analysisResultId,
      action_type: actionType,
      applied_to: appliedTo,
      content,
    })
    .select("*")
    .single();

  if (error) throw error;
  return fromActionRow(data as AiAdviceActionRow);
}

function shouldAppendToShibakatsuDay(day: WeeklyOffTrainingDay): boolean {
  return day.dayType === "シバカツの日" || day.items.some((planItem) => planItem.category === SHIBAKATSU_CATEGORY);
}

function shouldAppendToStrengthFlexDay(day: WeeklyOffTrainingDay): boolean {
  return day.dayType === "筋トレ＋柔軟の日" || day.items.some((planItem) => planItem.category === STRENGTH_CATEGORY || planItem.category === FLEXIBILITY_CATEGORY);
}

function appendItems(days: WeeklyOffTrainingDay[], items: OffTrainingPlanItem[], predicate: (day: WeeklyOffTrainingDay) => boolean): WeeklyOffTrainingDay[] {
  if (!items.length) return days;
  let appended = false;
  return days.map((day) => {
    if (appended || !predicate(day)) return day;
    appended = true;
    const existingNames = new Set(day.items.map((planItem) => `${planItem.category}:${planItem.name}`));
    const nextItems = items.filter((planItem) => !existingNames.has(`${planItem.category}:${planItem.name}`));
    if (!nextItems.length) return day;
    return {
      ...day,
      title: day.title.includes("AI補強") ? day.title : `${day.title} + AI補強`,
      focus: Array.from(new Set([...day.focus, "AI動画解析補強"])),
      items: [...day.items, ...nextItems],
    };
  });
}

async function applyNextTask(userId: string, params: ApplyAiVideoAnalysisParams, update: AiPracticeMenuUpdate): Promise<void> {
  if (!supabase) throw new Error("Supabase が未設定です。");
  const { error } = await supabase.from("practice_logs").update({ next_task: update.nextTask }).eq("id", params.practiceLog.id).eq("user_id", userId);
  if (error) throw error;
  await saveAction(userId, params, "next_task", "practice_logs", { nextTask: update.nextTask });
  if (update.recommendedTricks.length) {
    await saveAction(userId, params, "recommended_trick", "home_recommendations", { recommendedTricks: update.recommendedTricks });
  }
}

async function applyOffTrainingPlan(userId: string, params: ApplyAiVideoAnalysisParams, update: AiPracticeMenuUpdate): Promise<boolean> {
  if (!supabase) throw new Error("Supabase が未設定です。");
  const { data, error } = await supabase
    .from("offtraining_plans")
    .select("id,title,description,weekly_days,session_minutes,plan_json")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;

  const plan = {
    id: String(data.id),
    title: String(data.title),
    description: String(data.description ?? ""),
    weeklyDays: Number(data.weekly_days),
    sessionMinutes: Number(data.session_minutes),
    weeklyPlan: Array.isArray(data.plan_json) ? (data.plan_json as WeeklyOffTrainingDay[]) : [],
  } satisfies OffTrainingPlan;

  const withShibakatsu = appendItems(plan.weeklyPlan, update.shibakatsuItems, shouldAppendToShibakatsuDay);
  const weeklyPlan = appendItems(withShibakatsu, update.strengthFlexItems, shouldAppendToStrengthFlexDay);

  const { error: updateError } = await supabase
    .from("offtraining_plans")
    .update({
      plan_json: weeklyPlan,
      description: plan.description.includes("AI動画解析") ? plan.description : `${plan.description}\nAI動画解析の補強メニューを反映済み。`.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", plan.id)
    .eq("user_id", userId);

  if (updateError) throw updateError;
  await saveAction(userId, params, "offtraining_plan", "offtraining_plans", {
    shibakatsuItems: update.shibakatsuItems,
    strengthFlexItems: update.strengthFlexItems,
  });
  return true;
}

export async function applyAiVideoAnalysisToPracticeMenu(params: ApplyAiVideoAnalysisParams): Promise<{ update: AiPracticeMenuUpdate; offTrainingUpdated: boolean }> {
  const userId = await requireActionUser();
  const update = generatePracticeMenuUpdateFromAnalysis(params.analysis);
  await applyNextTask(userId, params, update);
  const offTrainingUpdated = await applyOffTrainingPlan(userId, params, update);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("gratri-storage"));
  return { update, offTrainingUpdated };
}

export async function applyAiVideoAnalysisToNextTask(params: ApplyAiVideoAnalysisParams): Promise<AiPracticeMenuUpdate> {
  const userId = await requireActionUser();
  const update = generatePracticeMenuUpdateFromAnalysis(params.analysis);
  await applyNextTask(userId, params, update);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("gratri-storage"));
  return update;
}
