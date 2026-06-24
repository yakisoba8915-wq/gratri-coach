import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { initialTricks } from "@/lib/mockData";

const categories = ["プレス系", "オーリー系", "ノーリー系", "乗り系", "180系", "360系", "540系", "その他"] as const;
const takeoffTypes = ["なし", "オーリー", "ノーリー", "プレス", "乗り", "その他"] as const;
const spinDirections = ["なし", "FS", "BS"] as const;

interface CreateTrickBody {
  name?: string;
  difficulty?: number;
  category?: string;
  takeoffType?: string;
  spinDirection?: string;
  description?: string;
  tips?: string;
  prerequisite?: string;
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

  const name = body.name?.trim() ?? "";
  const difficulty = Number(body.difficulty);
  const category = body.category ?? "";
  const takeoffType = body.takeoffType ?? "";
  const spinDirection = body.spinDirection ?? "";
  const description = body.description?.trim() ?? "";
  const tips = body.tips?.trim() ?? "";
  const prerequisite = body.prerequisite?.trim() ?? "";

  if (
    !name ||
    !Number.isInteger(difficulty) ||
    difficulty < 1 ||
    difficulty > 10 ||
    !categories.includes(category as (typeof categories)[number]) ||
    !takeoffTypes.includes(takeoffType as (typeof takeoffTypes)[number]) ||
    !spinDirections.includes(spinDirection as (typeof spinDirections)[number])
  ) {
    return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }

  if (initialTricks.some((trick) => normalized(trick.nameJa) === normalized(name))) {
    return NextResponse.json({ error: "同名の技がすでに登録されています。" }, { status: 409 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: duplicateCheckError } = await adminClient
    .from("tricks")
    .select("id")
    .ilike("name", name)
    .limit(1);

  if (duplicateCheckError) {
    return NextResponse.json({ error: "技データを確認できませんでした。" }, { status: 500 });
  }
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "同名の技がすでに登録されています。" }, { status: 409 });
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
      takeoff_type: takeoffType,
      spin_direction: spinDirection,
      description,
      tips,
      prerequisite,
      created_by: createdBy,
      is_official: false,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "同名の技がすでに登録されています。" }, { status: 409 });
    }
    return NextResponse.json({ error: "技の追加に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ trick: data }, { status: 201 });
}
