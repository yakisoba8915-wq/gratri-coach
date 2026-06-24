"use client";

import { getCurrentUser } from "./auth";
import { supabase } from "./supabase";
import type {
  FeedbackPriority,
  FeedbackStatus,
  FeedbackTargetScreen,
  FeedbackType,
  SubmitFeedbackInput,
  UserFeedback,
} from "./types";

interface UserFeedbackRow {
  id: string;
  user_id: string;
  feedback_type: FeedbackType;
  target_screen: FeedbackTargetScreen;
  message: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  created_at: string;
}

function fromRow(row: UserFeedbackRow): UserFeedback {
  return {
    id: row.id,
    userId: row.user_id,
    feedbackType: row.feedback_type,
    targetScreen: row.target_screen,
    message: row.message,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function requireFeedbackUser(): Promise<string> {
  if (!supabase) throw new Error("Supabaseが設定されていません。");
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインするとフィードバックを送信できます");
  return user.id;
}

export async function submitFeedback(input: SubmitFeedbackInput): Promise<UserFeedback> {
  const userId = await requireFeedbackUser();
  const message = input.message.trim();
  if (!message) throw new Error("内容を入力してください。");
  if (!supabase) throw new Error("Supabaseが設定されていません。");

  const { data, error } = await supabase
    .from("user_feedback")
    .insert({
      user_id: userId,
      feedback_type: input.feedbackType,
      target_screen: input.targetScreen,
      message,
      priority: input.priority,
    })
    .select("*")
    .single();

  if (error) throw error;
  return fromRow(data as UserFeedbackRow);
}

export async function getMyFeedback(): Promise<UserFeedback[]> {
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_feedback")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Gratri Coach] Failed to load feedback.", error);
    return [];
  }

  return (data as UserFeedbackRow[]).map(fromRow);
}
