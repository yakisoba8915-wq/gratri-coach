import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canManageTricks } from "./accessControl";
import type { PlanType } from "./types";

interface TrickManagementAuthResult {
  adminClient: SupabaseClient;
  createdBy: string | null;
  planType: PlanType;
  canManage: boolean;
  error?: string;
  status?: number;
}

interface TrickManagementAuthOptions {
  allowPassword?: boolean;
  requireLogin?: boolean;
  requireManager?: boolean;
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

function normalizePlanType(value: unknown): PlanType {
  return value === "premium" || value === "admin" || value === "beta_tester" || value === "editor" ? value : "free";
}

export async function authorizeTrickMutation(request: Request, password?: string, options: TrickManagementAuthOptions = {}): Promise<TrickManagementAuthResult> {
  const allowPassword = options.allowPassword ?? true;
  const requireLogin = options.requireLogin ?? false;
  const requireManager = options.requireManager ?? false;
  const adminPassword = process.env.TRICK_ADMIN_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      adminClient: null as unknown as SupabaseClient,
      createdBy: null,
      planType: "free",
      canManage: false,
      error: "技管理機能のサーバー設定が完了していません。",
      status: 503,
    };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let createdBy: string | null = null;
  let planType: PlanType = "free";
  const token = bearerToken(request);

  if (token && supabaseAnonKey) {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await authClient.auth.getUser(token);
    createdBy = userData.user?.id ?? null;
    if (createdBy) {
      const { data } = await adminClient.from("profiles").select("plan_type").eq("user_id", createdBy).maybeSingle();
      planType = normalizePlanType(data?.plan_type);
    }
  }

  const canManage = canManageTricks(planType);
  if (requireLogin && !createdBy) {
    return { adminClient, createdBy, planType, canManage, error: "ログインが必要です。", status: 401 };
  }
  if (requireManager && !canManage) {
    return { adminClient, createdBy, planType, canManage, error: "EditorまたはAdmin権限が必要です。", status: 403 };
  }
  if (!allowPassword && !canManage) {
    return { adminClient, createdBy, planType, canManage, error: "EditorまたはAdmin権限が必要です。", status: 403 };
  }
  if (!canManage && !adminPassword) {
    return {
      adminClient,
      createdBy,
      planType,
      canManage,
      error: "管理パスワードのサーバー設定が完了していません。",
      status: 503,
    };
  }

  if (!canManage && (!password || password !== adminPassword)) {
    return { adminClient, createdBy, planType, canManage, error: "パスワードが違います。", status: 401 };
  }

  return { adminClient, createdBy, planType, canManage };
}
