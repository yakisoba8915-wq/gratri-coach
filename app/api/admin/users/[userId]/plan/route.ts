import { NextResponse } from "next/server";
import { getAdminContext, isEditablePlanType } from "@/lib/adminApi";

interface UpdatePlanBody {
  planType?: unknown;
  plan_type?: unknown;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const context = await getAdminContext(request);
  if (!context) {
    return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });
  }

  const { userId } = await params;
  const body = (await request.json().catch(() => ({}))) as UpdatePlanBody;
  const planType = body.planType ?? body.plan_type;

  if (!isEditablePlanType(planType)) {
    return NextResponse.json({ error: "plan_type を確認してください。" }, { status: 400 });
  }

  const { data, error } = await context.adminClient
    .from("profiles")
    .update({ plan_type: planType })
    .eq("user_id", userId)
    .select("user_id,plan_type")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "plan_type の更新に失敗しました。" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "対象ユーザーが見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({ userId: data.user_id, planType: data.plan_type });
}
