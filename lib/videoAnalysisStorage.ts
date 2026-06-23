"use client";

import { getCurrentUser } from "./auth";
import { supabase } from "./supabase";
import type { PracticeVideoAnalysisResult, VideoAnalysisComparison, VideoAnalysisResult } from "./types";

interface PracticeVideoAnalysisResultRow {
  id: string;
  user_id: string;
  practice_video_id: string;
  practice_log_id: string;
  trick_id: string;
  summary: string;
  likely_issues: string[] | null;
  improvement_points: string[] | null;
  next_practice: string[] | null;
  shibakatsu_advice: string[] | null;
  confidence: "low" | "medium" | "high";
  created_at: string;
}

interface SaveVideoAnalysisResultParams {
  practiceVideoId: string;
  practiceLogId: string;
  trickId: string;
  result: VideoAnalysisResult;
}

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
};

const fromRow = (row: PracticeVideoAnalysisResultRow): PracticeVideoAnalysisResult => ({
  id: row.id,
  userId: row.user_id,
  practiceVideoId: row.practice_video_id,
  practiceLogId: row.practice_log_id,
  trickId: row.trick_id,
  summary: row.summary,
  likelyIssues: toStringList(row.likely_issues),
  improvementPoints: toStringList(row.improvement_points),
  nextPractice: toStringList(row.next_practice),
  shibakatsuAdvice: toStringList(row.shibakatsu_advice),
  confidence: row.confidence,
  createdAt: row.created_at,
});

async function requireAnalysisUser(): Promise<string> {
  if (!supabase) throw new Error("Supabase が未設定です。");
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインするとAI解析結果を保存できます。");
  return user.id;
}

export async function saveVideoAnalysisResult({ practiceVideoId, practiceLogId, trickId, result }: SaveVideoAnalysisResultParams): Promise<PracticeVideoAnalysisResult> {
  const userId = await requireAnalysisUser();
  if (!supabase) throw new Error("Supabase が未設定です。");

  const { data, error } = await supabase
    .from("practice_video_analysis_results")
    .insert({
      user_id: userId,
      practice_video_id: practiceVideoId,
      practice_log_id: practiceLogId,
      trick_id: trickId,
      summary: result.summary,
      likely_issues: result.likelyIssues,
      improvement_points: result.improvementPoints,
      next_practice: result.nextPractice,
      shibakatsu_advice: result.shibakatsuAdvice,
      confidence: result.confidence,
    })
    .select("*")
    .single();

  if (error) throw error;
  return fromRow(data as PracticeVideoAnalysisResultRow);
}

export async function getVideoAnalysisResultsByVideoId(practiceVideoId: string): Promise<PracticeVideoAnalysisResult[]> {
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("practice_video_analysis_results")
    .select("*")
    .eq("user_id", user.id)
    .eq("practice_video_id", practiceVideoId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Gratri Coach] Failed to load video analysis results.", error);
    return [];
  }

  return (data as PracticeVideoAnalysisResultRow[]).map(fromRow);
}

export async function getVideoAnalysisResultsByTrickId(trickId: string): Promise<PracticeVideoAnalysisResult[]> {
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("practice_video_analysis_results")
    .select("*")
    .eq("user_id", user.id)
    .eq("trick_id", trickId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Gratri Coach] Failed to load trick analysis history.", error);
    return [];
  }

  return (data as PracticeVideoAnalysisResultRow[]).map(fromRow);
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function includesSimilar(items: string[], target: string): boolean {
  const normalizedTarget = target.toLowerCase();
  return items.some((item) => {
    const normalizedItem = item.toLowerCase();
    return normalizedItem === normalizedTarget || normalizedItem.includes(normalizedTarget) || normalizedTarget.includes(normalizedItem);
  });
}

export function compareVideoAnalysisResults(current: VideoAnalysisResult, previousResults: PracticeVideoAnalysisResult[]): VideoAnalysisComparison {
  const previousIssues = unique(previousResults.flatMap((result) => result.likelyIssues));
  const currentIssues = unique(current.likelyIssues);
  const previousImprovements = unique(previousResults.flatMap((result) => result.improvementPoints));
  const currentImprovements = unique(current.improvementPoints);

  const repeatedIssues = currentIssues.filter((issue) => includesSimilar(previousIssues, issue));
  const newIssues = currentIssues.filter((issue) => !includesSimilar(previousIssues, issue));
  const improvedPoints = previousIssues
    .filter((issue) => !includesSimilar(currentIssues, issue))
    .concat(currentImprovements.filter((point) => includesSimilar(previousImprovements, point) || includesSimilar(previousIssues, point)));

  const nextFocus = unique([...repeatedIssues.slice(0, 2), ...newIssues.slice(0, 2), ...current.nextPractice.slice(0, 2)]).slice(0, 4);

  return {
    repeatedIssues: unique(repeatedIssues).slice(0, 5),
    improvedPoints: unique(improvedPoints).slice(0, 5),
    newIssues: unique(newIssues).slice(0, 5),
    nextFocus,
  };
}
