"use client";

import { getCurrentUser } from "./auth";
import { supabase } from "./supabase";
import type { AiCoachMessage, AiCoachRole, AiCoachSourceType } from "./types";

interface AiCoachMessageRow {
  id: string;
  user_id: string;
  role: AiCoachRole;
  message: string;
  source_type: AiCoachSourceType;
  related_practice_log_id: string | null;
  related_video_id: string | null;
  related_analysis_result_id: string | null;
  created_at: string;
}

interface SaveAiCoachMessageParams {
  role: AiCoachRole;
  message: string;
  sourceType: AiCoachSourceType;
  relatedPracticeLogId?: string | null;
  relatedVideoId?: string | null;
  relatedAnalysisResultId?: string | null;
}

const fromRow = (row: AiCoachMessageRow): AiCoachMessage => ({
  id: row.id,
  userId: row.user_id,
  role: row.role,
  message: row.message,
  sourceType: row.source_type,
  relatedPracticeLogId: row.related_practice_log_id,
  relatedVideoId: row.related_video_id,
  relatedAnalysisResultId: row.related_analysis_result_id,
  createdAt: row.created_at,
});

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function getAiCoachMessages(limit = 40): Promise<AiCoachMessage[]> {
  const userId = await currentUserId();
  if (!userId || !supabase) return [];

  const { data, error } = await supabase
    .from("ai_coach_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[Gratri Coach] Failed to load AI coach messages.", error);
    return [];
  }

  return (data as AiCoachMessageRow[]).map(fromRow).reverse();
}

export async function saveAiCoachMessage(params: SaveAiCoachMessageParams): Promise<AiCoachMessage | null> {
  const userId = await currentUserId();
  if (!userId || !supabase || !params.message.trim()) return null;

  const { data, error } = await supabase
    .from("ai_coach_messages")
    .insert({
      user_id: userId,
      role: params.role,
      message: params.message.trim(),
      source_type: params.sourceType,
      related_practice_log_id: params.relatedPracticeLogId ?? null,
      related_video_id: params.relatedVideoId ?? null,
      related_analysis_result_id: params.relatedAnalysisResultId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.warn("[Gratri Coach] Failed to save AI coach message.", error);
    return null;
  }

  if (typeof window !== "undefined") window.dispatchEvent(new Event("gratri-storage"));
  return fromRow(data as AiCoachMessageRow);
}

export async function resetAiCoachMessages(): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !supabase) return;
  const { error } = await supabase.from("ai_coach_messages").delete().eq("user_id", userId);
  if (error) throw error;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("gratri-storage"));
}
