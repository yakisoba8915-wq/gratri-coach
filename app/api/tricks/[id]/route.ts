import { NextResponse } from "next/server";
import { initialTricks } from "@/lib/mockData";
import { authorizeTrickMutation } from "@/lib/trickManagementAuth";
import type { TrainingType, Trick, TrickAccessType, TrickStance } from "@/lib/types";

const snowCategories = ["プレス系", "オーリー系", "ノーリー系", "乗り系", "180系", "360系", "540系", "その他"] as const;
const shibakatsuCategories = ["プレス練習", "弾き練習", "回転練習", "バランス練習", "乗り練習", "連続動作", "その他"] as const;
const takeoffTypes = ["なし", "オーリー", "ノーリー", "プレス", "乗り", "その他"] as const;
const spinDirections = ["なし", "FS", "BS"] as const;
const trickStances = ["regular", "goofy", "both"] as const;
const accessTypes = ["free", "premium"] as const;

interface UpdateTrickBody {
  name?: string;
  difficulty?: number;
  category?: string;
  takeoffType?: string;
  spinDirection?: string;
  description?: string;
  tips?: string;
  prerequisite?: string;
  trickType?: string;
  stance?: string;
  accessType?: string;
  access_type?: string;
  relatedSnowTrick?: string;
  cautions?: string;
}

interface TrickRow {
  id: string;
  name: string;
  difficulty: number;
  category: string;
  takeoff_type: string;
  spin_direction: string;
  description: string;
  tips: string;
  prerequisite: string;
  trick_type: TrainingType;
  stance: TrickStance;
  access_type: TrickAccessType;
  related_snow_trick: string;
  cautions: string;
  source_trick_id?: string | null;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("ja-JP");
}

function normalizeTrickType(value: string | undefined): TrainingType | null {
  if (value === undefined || value === "snow") return "snow";
  if (value === "shibakatsu") return "shibakatsu";
  return null;
}

function initialToRow(trick: Trick): TrickRow {
  return {
    id: trick.id,
    name: trick.nameJa,
    difficulty: trick.difficulty,
    category: trick.category,
    takeoff_type: trick.takeoffType ?? "なし",
    spin_direction: trick.spinDirection ?? "なし",
    description: trick.description,
    tips: trick.howTo[0] ?? "",
    prerequisite: trick.prerequisiteText ?? "",
    trick_type: trick.trickType ?? "snow",
    stance: trick.stance ?? "both",
    access_type: trick.accessType ?? "free",
    related_snow_trick: trick.relatedSnowTrick ?? "",
    cautions: trick.cautions ?? "",
    source_trick_id: trick.id,
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as UpdateTrickBody;
  const authorization = await authorizeTrickMutation(request, undefined, { allowPassword: false, requireLogin: true, requireManager: true });
  if (authorization.error) {
    return NextResponse.json({ error: authorization.status === 403 ? "編集権限がありません" : authorization.error }, { status: authorization.status ?? 401 });
  }
  const { adminClient } = authorization;
  const initialSource = initialTricks.find((trick) => trick.id === id);

  const existingQuery = initialSource
    ? adminClient.from("tricks").select("*").eq("source_trick_id", id).maybeSingle()
    : adminClient.from("tricks").select("*").eq("id", id).maybeSingle();
  const { data: existing, error: existingError } = await existingQuery;
  if (existingError) return NextResponse.json({ error: "トリックデータを確認できませんでした。" }, { status: 500 });
  if (!existing && !initialSource) return NextResponse.json({ error: "対象のトリックが見つかりません。" }, { status: 404 });

  const current = (existing as TrickRow | null) ?? initialToRow(initialSource as Trick);
  const trickType = normalizeTrickType(body.trickType ?? current.trick_type);
  if (!trickType) return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });

  const name = body.name?.trim() ?? current.name;
  const difficulty = body.difficulty === undefined ? Number(current.difficulty) : Number(body.difficulty);
  const category = body.category ?? current.category;
  const takeoffType = body.takeoffType ?? current.takeoff_type ?? "なし";
  const spinDirection = body.spinDirection ?? current.spin_direction ?? "なし";
  const stance: TrickStance = body.stance === undefined || body.stance === "" ? current.stance ?? "both" : body.stance as TrickStance;
  const accessTypeValue = body.accessType ?? body.access_type ?? current.access_type;
  const accessType: TrickAccessType = accessTypeValue === "free" ? "free" : "premium";
  const allowedCategories = trickType === "snow" ? snowCategories : shibakatsuCategories;

  if (
    !name ||
    !Number.isInteger(difficulty) ||
    difficulty < 1 ||
    difficulty > 10 ||
    !trickStances.includes(stance) ||
    !accessTypes.includes(accessType) ||
    !allowedCategories.includes(category as never) ||
    (trickType === "snow" && !takeoffTypes.includes(takeoffType as (typeof takeoffTypes)[number])) ||
    (trickType === "snow" && !spinDirections.includes(spinDirection as (typeof spinDirections)[number]))
  ) {
    return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }

  const duplicatedInitial = trickType === "snow" && initialTricks.some((trick) => trick.id !== id && normalized(trick.nameJa) === normalized(name));
  if (duplicatedInitial) return NextResponse.json({ error: "初期トリックと同名の技は登録できません。" }, { status: 409 });

  let duplicateQuery = adminClient
    .from("tricks")
    .select("id")
    .eq("trick_type", trickType)
    .ilike("name", name)
    .limit(1);
  if (existing?.id) duplicateQuery = duplicateQuery.neq("id", existing.id);
  const { data: duplicate, error: duplicateError } = await duplicateQuery;
  if (duplicateError) return NextResponse.json({ error: "トリックデータを確認できませんでした。" }, { status: 500 });
  if (duplicate && duplicate.length > 0) return NextResponse.json({ error: "同じ種類に同名のトリックがすでに登録されています。" }, { status: 409 });

  const payload = {
    name,
    difficulty,
    category,
    takeoff_type: trickType === "snow" ? takeoffType : "なし",
    spin_direction: trickType === "snow" ? spinDirection : "なし",
    description: body.description?.trim() ?? current.description ?? "",
    tips: body.tips?.trim() ?? current.tips ?? "",
    prerequisite: trickType === "snow" ? body.prerequisite?.trim() ?? current.prerequisite ?? "" : "",
    trick_type: trickType,
    stance,
    access_type: accessType,
    related_snow_trick: trickType === "shibakatsu" ? body.relatedSnowTrick?.trim() ?? current.related_snow_trick ?? "" : "",
    cautions: trickType === "shibakatsu" ? body.cautions?.trim() ?? current.cautions ?? "" : "",
    created_by: authorization.createdBy,
    is_official: Boolean(initialSource),
    source_trick_id: initialSource ? id : null,
  };

  const query = existing?.id
    ? adminClient.from("tricks").update(payload).eq("id", existing.id)
    : adminClient.from("tricks").insert(payload);

  const { data, error } = await query.select("*").single();
  if (error) return NextResponse.json({ error: "トリックの更新に失敗しました。" }, { status: 500 });
  return NextResponse.json({ trick: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const authorization = await authorizeTrickMutation(request, body.password, { allowPassword: false, requireLogin: true, requireManager: true });
  if (authorization.error) return NextResponse.json({ error: authorization.error }, { status: authorization.status ?? 401 });

  const { error } = await authorization.adminClient.from("tricks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "トリックの削除に失敗しました。" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
