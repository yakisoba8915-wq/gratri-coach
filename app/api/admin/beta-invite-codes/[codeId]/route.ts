import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminApi";

interface UpdateInviteBody {
  description?: unknown;
  max_uses?: unknown;
  expires_at?: unknown;
  is_active?: unknown;
}

function normalizeDate(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ codeId: string }> }) {
  const context = await getAdminContext(request);
  if (!context) return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });

  const { codeId } = await params;
  const body = (await request.json().catch(() => ({}))) as UpdateInviteBody;
  const update: Record<string, unknown> = {};

  if (typeof body.description === "string") update.description = body.description.trim();
  if (body.max_uses !== undefined) {
    const maxUses = Math.floor(Number(body.max_uses));
    if (!Number.isFinite(maxUses) || maxUses < 1) return NextResponse.json({ error: "最大利用回数を確認してください。" }, { status: 400 });
    update.max_uses = maxUses;
  }
  const expiresAt = normalizeDate(body.expires_at);
  if (expiresAt !== undefined) update.expires_at = expiresAt;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "更新内容がありません。" }, { status: 400 });

  const { data, error } = await context.adminClient
    .from("beta_invite_codes")
    .update(update)
    .eq("id", codeId)
    .select("id,code,description,max_uses,used_count,expires_at,is_active,created_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "招待コードの更新に失敗しました。" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "招待コードが見つかりません。" }, { status: 404 });

  return NextResponse.json({ code: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ codeId: string }> }) {
  const context = await getAdminContext(request);
  if (!context) return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });

  const { codeId } = await params;
  const { error } = await context.adminClient.from("beta_invite_codes").update({ is_active: false }).eq("id", codeId);
  if (error) return NextResponse.json({ error: "招待コードの無効化に失敗しました。" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
