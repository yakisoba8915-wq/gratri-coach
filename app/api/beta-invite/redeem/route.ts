import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizePlanType } from "@/lib/adminApi";
import { isPremiumPlan } from "@/lib/accessControl";

interface RedeemBody {
  code?: unknown;
}

interface InviteCodeRow {
  id: string;
  code: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

function createAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createAuthClient(accessToken: string): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function normalizeCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RedeemBody;
  const code = normalizeCode(body.code);
  if (!code) return NextResponse.json({ error: "招待コードを入力してください。" }, { status: 400 });

  const token = bearerToken(request);
  const authClient = token ? createAuthClient(token) : null;
  const adminClient = createAdminClient();
  if (!token || !authClient || !adminClient) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  const user = userData.user;

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("plan_type")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: "プロフィール確認に失敗しました。" }, { status: 500 });

  const currentPlan = normalizePlanType(profile?.plan_type);
  if (isPremiumPlan(currentPlan)) {
    return NextResponse.json({ message: "すでにPremium機能を利用できます。", planType: currentPlan });
  }

  const { data: invite, error: inviteError } = await adminClient
    .from("beta_invite_codes")
    .select("id,code,max_uses,used_count,expires_at,is_active")
    .eq("code", code)
    .maybeSingle();
  if (inviteError) return NextResponse.json({ error: "招待コードの確認に失敗しました。" }, { status: 500 });
  if (!invite) return NextResponse.json({ error: "招待コードが無効です。" }, { status: 400 });

  const inviteCode = invite as InviteCodeRow;
  if (!inviteCode.is_active) return NextResponse.json({ error: "招待コードが無効です。" }, { status: 400 });
  if (inviteCode.expires_at && new Date(inviteCode.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "招待コードの有効期限が切れています。" }, { status: 400 });
  }
  if (inviteCode.used_count >= inviteCode.max_uses) {
    return NextResponse.json({ error: "招待コードの利用上限に達しています。" }, { status: 400 });
  }

  const { data: redeemed } = await adminClient
    .from("beta_invite_redemptions")
    .select("id")
    .eq("code_id", inviteCode.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (redeemed) return NextResponse.json({ error: "この招待コードはすでに使用済みです。" }, { status: 400 });

  const { error: redemptionError } = await adminClient
    .from("beta_invite_redemptions")
    .insert({ code_id: inviteCode.id, user_id: user.id });
  if (redemptionError) {
    if (redemptionError.code === "23505") return NextResponse.json({ error: "この招待コードはすでに使用済みです。" }, { status: 400 });
    return NextResponse.json({ error: "招待コードの使用履歴保存に失敗しました。" }, { status: 500 });
  }

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: user.id,
        user_id: user.id,
        display_name: user.user_metadata?.full_name ?? user.email ?? "Gratri Rider",
        plan_type: "beta_tester",
      },
      { onConflict: "user_id" },
    );
  if (profileUpdateError) return NextResponse.json({ error: "βテスター権限の反映に失敗しました。" }, { status: 500 });

  const { error: countError } = await adminClient
    .from("beta_invite_codes")
    .update({ used_count: inviteCode.used_count + 1 })
    .eq("id", inviteCode.id);
  if (countError) return NextResponse.json({ error: "招待コード利用回数の更新に失敗しました。" }, { status: 500 });

  return NextResponse.json({ message: "βテスター特典が有効になりました", planType: "beta_tester" });
}
