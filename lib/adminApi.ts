import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { PlanType } from "./types";

export const editablePlanTypes: PlanType[] = ["free", "premium", "beta_tester", "admin"];

interface AdminContext {
  adminClient: SupabaseClient;
  user: User;
}

export interface AdminProfileRow {
  id?: string | null;
  user_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  stance?: string | null;
  plan_type?: string | null;
  created_at?: string | null;
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

export function normalizePlanType(value: unknown): PlanType {
  return value === "premium" || value === "admin" || value === "beta_tester" ? value : "free";
}

export function isEditablePlanType(value: unknown): value is PlanType {
  return editablePlanTypes.includes(value as PlanType);
}

export async function getAdminContext(request: Request): Promise<AdminContext | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = bearerToken(request);

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !token) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return null;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("plan_type")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profileError || normalizePlanType(profile?.plan_type) !== "admin") return null;
  return { adminClient, user: userData.user };
}
