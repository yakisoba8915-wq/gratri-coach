import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminApi";

interface BetaInviteCodeRow {
  id: string;
  code: string;
  description: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface CreateInviteBody {
  description?: unknown;
  max_uses?: unknown;
  expires_at?: unknown;
}

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `BETA-${part()}-${part()}`;
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toResponse(row: BetaInviteCodeRow) {
  return {
    id: row.id,
    code: row.code,
    description: row.description ?? "",
    maxUses: row.max_uses,
    usedCount: row.used_count,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const context = await getAdminContext(request);
  if (!context) return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });

  const { data, error } = await context.adminClient
    .from("beta_invite_codes")
    .select("id,code,description,max_uses,used_count,expires_at,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "招待コード一覧の取得に失敗しました。" }, { status: 500 });
  return NextResponse.json({ codes: ((data ?? []) as BetaInviteCodeRow[]).map(toResponse) });
}

export async function POST(request: Request) {
  const context = await getAdminContext(request);
  if (!context) return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as CreateInviteBody;
  const maxUses = Math.max(1, Math.floor(Number(body.max_uses ?? 1) || 1));
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const expiresAt = normalizeDate(body.expires_at);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await context.adminClient
      .from("beta_invite_codes")
      .insert({
        code: generateCode(),
        description,
        max_uses: maxUses,
        expires_at: expiresAt,
        created_by: context.user.id,
      })
      .select("id,code,description,max_uses,used_count,expires_at,is_active,created_at")
      .single();

    if (!error && data) return NextResponse.json({ code: toResponse(data as BetaInviteCodeRow) }, { status: 201 });
    if (error?.code !== "23505") return NextResponse.json({ error: "招待コードの作成に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ error: "招待コードの生成に失敗しました。もう一度お試しください。" }, { status: 500 });
}
