import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { initialTricks } from "@/lib/mockData";
import type { TrainingType, TrickStance } from "@/lib/types";

const snowCategories = ["プレス系", "オーリー系", "ノーリー系", "乗り系", "180系", "360系", "540系", "その他"] as const;
const shibakatsuCategories = ["プレス練習", "弾き練習", "回転練習", "バランス練習", "乗り練習", "連続動作", "その他"] as const;
const takeoffTypes = ["なし", "オーリー", "ノーリー", "プレス", "乗り", "その他"] as const;
const spinDirections = ["なし", "FS", "BS"] as const;
const trickStances = ["regular", "goofy", "both"] as const;

interface CreateTrickBody {
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
  relatedSnowTrick?: string;
  cautions?: string;
  password?: string;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("ja-JP");
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
}

export async function POST(request: Request) {
  const adminPassword = process.env.TRICK_ADMIN_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminPassword || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "技追加機能のサーバー設定が完了していません。" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateTrickBody;
  if (!body.password || body.password !== adminPassword) {
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }

  const trickType: TrainingType = body.trickType === "shibakatsu" ? "shibakatsu" : body.trickType === undefined || body.trickType === "snow" ? "snow" : body.trickType as TrainingType;
  if (trickType !== "snow" && trickType !== "shibakatsu") {
    return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const difficulty = Number(body.difficulty);
  const category = body.category ?? "";
  const takeoffType = body.takeoffType ?? "なし";
  const spinDirection = body.spinDirection ?? "なし";
  const description = body.description?.trim() ?? "";
  const tips = body.tips?.trim() ?? "";
  const prerequisite = body.prerequisite?.trim() ?? "";
  const relatedSnowTrick = body.relatedSnowTrick?.trim() ?? "";
  const cautions = body.cautions?.trim() ?? "";
  const stance: TrickStance = body.stance === undefined || body.stance === "" ? "both" : body.stance as TrickStance;
  const allowedCategories = trickType === "snow" ? snowCategories : shibakatsuCategories;

  if (
    !name ||
    !Number.isInteger(difficulty) ||
    difficulty < 1 ||
    difficulty > 10 ||
    !trickStances.includes(stance) ||
    !allowedCategories.includes(category as never) ||
    (trickType === "snow" && !takeoffTypes.includes(takeoffType as (typeof takeoffTypes)[number])) ||
    (trickType === "snow" && !spinDirections.includes(spinDirection as (typeof spinDirections)[number]))
  ) {
    return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }

  if (trickType === "snow" && initialTricks.some((trick) => normalized(trick.nameJa) === normalized(name))) {
    return NextResponse.json({ error: "同じ種類に同名の技がすでに登録されています。" }, { status: 409 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: duplicateCheckError } = await adminClient
    .from("tricks")
    .select("id")
    .eq("trick_type", trickType)
    .ilike("name", name)
    .limit(1);

  if (duplicateCheckError) {
    return NextResponse.json({ error: "技データを確認できませんでした。" }, { status: 500 });
  }
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "同じ種類に同名の技がすでに登録されています。" }, { status: 409 });
  }

  let createdBy: string | null = null;
  const token = bearerToken(request);
  if (token) {
    const { data } = await adminClient.auth.getUser(token);
    createdBy = data.user?.id ?? null;
  }

  const { data, error } = await adminClient
    .from("tricks")
    .insert({
      name,
      difficulty,
      category,
      takeoff_type: trickType === "snow" ? takeoffType : "なし",
      spin_direction: trickType === "snow" ? spinDirection : "なし",
      description,
      tips,
      prerequisite: trickType === "snow" ? prerequisite : "",
      trick_type: trickType,
      stance,
      related_snow_trick: trickType === "shibakatsu" ? relatedSnowTrick : "",
      cautions: trickType === "shibakatsu" ? cautions : "",
      created_by: createdBy,
      is_official: false,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "同じ種類に同名の技がすでに登録されています。" }, { status: 409 });
    }
    return NextResponse.json({ error: "技の追加に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ trick: data }, { status: 201 });
}
