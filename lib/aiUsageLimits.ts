import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { AiFeatureType, AiUsageStatus, PlanType } from "./types";

const usageLimitMessage = "本日のAI利用上限に達しました。明日また利用できます。";

const dailyLimits: Record<Exclude<PlanType, "admin">, Record<AiFeatureType, number>> = {
  free: {
    ai_chat: 3,
    ai_advice: 3,
    ai_video_analysis: 1,
  },
  premium: {
    ai_chat: 50,
    ai_advice: 50,
    ai_video_analysis: 10,
  },
};

interface UsageClientContext {
  client: SupabaseClient;
  userId: string;
}

export const AI_USAGE_LIMIT_MESSAGE = usageLimitMessage;

function normalizePlanType(value: unknown): PlanType {
  return value === "premium" || value === "admin" || value === "free" ? value : "free";
}

function startOfTodayIso(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function statusFor(featureType: AiFeatureType, planType: PlanType, used: number): AiUsageStatus {
  if (planType === "admin") {
    return { featureType, planType, used, limit: null, remaining: null, unlimited: true, limitReached: false };
  }
  const limit = dailyLimits[planType][featureType];
  const remaining = Math.max(0, limit - used);
  return { featureType, planType, used, limit, remaining, unlimited: false, limitReached: remaining <= 0 };
}

async function getBrowserContext(): Promise<UsageClientContext | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  return { client: supabase, userId: data.session.user.id };
}

async function getPlanType(context: UsageClientContext): Promise<PlanType> {
  const { data, error } = await context.client.from("profiles").select("plan_type").eq("user_id", context.userId).maybeSingle();
  if (error) return "free";
  return normalizePlanType(data?.plan_type);
}

async function getUsedCount(context: UsageClientContext, featureType: AiFeatureType): Promise<number> {
  const { count, error } = await context.client
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.userId)
    .eq("feature_type", featureType)
    .gte("used_at", startOfTodayIso());
  if (error) return 0;
  return count ?? 0;
}

async function getUsageStatus(context: UsageClientContext, featureType: AiFeatureType): Promise<AiUsageStatus> {
  const planType = await getPlanType(context);
  const used = await getUsedCount(context, featureType);
  return statusFor(featureType, planType, used);
}

export async function getAiUsageStatus(featureType: AiFeatureType): Promise<AiUsageStatus | null> {
  const context = await getBrowserContext();
  if (!context) return null;
  return getUsageStatus(context, featureType);
}

export async function recordAiUsage(featureType: AiFeatureType): Promise<void> {
  const context = await getBrowserContext();
  if (!context) return;
  await context.client.from("ai_usage_logs").insert({ user_id: context.userId, feature_type: featureType });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("gratri-storage"));
}

export async function getAiRequestHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function createServerClient(accessToken: string): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function getServerContext(request: Request): Promise<UsageClientContext | null> {
  const header = request.headers.get("authorization") ?? "";
  const accessToken = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!accessToken) return null;
  const client = createServerClient(accessToken);
  if (!client) return null;
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return { client, userId: data.user.id };
}

export async function getServerAiUsageStatus(request: Request, featureType: AiFeatureType): Promise<AiUsageStatus | null> {
  const context = await getServerContext(request);
  if (!context) return null;
  return getUsageStatus(context, featureType);
}

export async function recordServerAiUsage(request: Request, featureType: AiFeatureType): Promise<void> {
  const context = await getServerContext(request);
  if (!context) return;
  await context.client.from("ai_usage_logs").insert({ user_id: context.userId, feature_type: featureType });
}
