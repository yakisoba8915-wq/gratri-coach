import { NextResponse } from "next/server";
import { getAdminContext, normalizePlanType, type AdminProfileRow } from "@/lib/adminApi";

export async function GET(request: Request) {
  const context = await getAdminContext(request);
  if (!context) {
    return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });
  }

  const { data, error } = await context.adminClient.from("profiles").select("*");
  if (error) {
    return NextResponse.json({ error: "ユーザー一覧の取得に失敗しました。" }, { status: 500 });
  }

  const users = ((data ?? []) as AdminProfileRow[]).map((row) => ({
    userId: String(row.user_id ?? row.id ?? ""),
    displayName: row.display_name ?? "",
    email: row.email ?? null,
    stance: row.stance ?? "",
    planType: normalizePlanType(row.plan_type),
    createdAt: row.created_at ?? null,
  })).filter((row) => row.userId);

  return NextResponse.json({ users });
}
