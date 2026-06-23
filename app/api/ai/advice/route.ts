import { NextResponse } from "next/server";
import { convertRuleBasedToOpenAiAdvice, generateRuleBasedAdvice, normalizeOpenAiAdvice, type OpenAiAdvice, type TrickStatForAi } from "@/lib/aiAdvisor";
import type { Goal, OffTrainingPlan, PracticeLog, Profile, Trick } from "@/lib/types";

interface AdviceRequestBody {
  practiceLogs?: PracticeLog[];
  goals?: Goal[];
  profile?: Profile | null;
  offtrainingPlan?: OffTrainingPlan | null;
  trickStats?: TrickStatForAi[];
  tricks?: Trick[];
}

interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

const fallbackTricks = (trickStats: TrickStatForAi[] = []): Trick[] =>
  trickStats.map((stat) => ({
    id: stat.trickId,
    nameJa: stat.nameJa,
    nameEn: stat.nameJa,
    category: stat.category,
    difficulty: stat.difficulty,
    description: "",
    howTo: [],
    commonMistakes: [],
    prerequisites: [],
    relatedTrainings: [],
    referenceVideos: [],
    imageUrls: [],
    masteryStatus: "未挑戦",
    favorite: false,
  }));

function buildFallback(body: AdviceRequestBody): OpenAiAdvice {
  const ruleAdvice = generateRuleBasedAdvice({
    tricks: body.tricks?.length ? body.tricks : fallbackTricks(body.trickStats),
    logs: body.practiceLogs ?? [],
    goals: body.goals ?? [],
    profile: body.profile ?? undefined,
    offTrainingPlan: body.offtrainingPlan ?? null,
  });
  return convertRuleBasedToOpenAiAdvice(ruleAdvice);
}

function buildPrompt(body: AdviceRequestBody): string {
  return JSON.stringify(
    {
      instruction:
        "あなたはスノーボードのグラトリ練習コーチです。入力データを分析し、必ず指定JSON形式だけを日本語で返してください。医学的診断や危険な断定は避け、実践しやすい短い助言にしてください。",
      outputSchema: {
        summary: "string",
        weakPoints: ["string"],
        recommendedTricks: ["string"],
        nextPracticeMenu: ["string"],
        offTrainingAdvice: ["string"],
        priority: "high | medium | low",
      },
      data: {
        practiceLogs: body.practiceLogs ?? [],
        goals: body.goals ?? [],
        profile: body.profile ?? null,
        offtrainingPlan: body.offtrainingPlan ?? null,
        trickStats: body.trickStats ?? [],
      },
    },
    null,
    2,
  );
}

function parseAdvice(content: string, fallback: OpenAiAdvice): OpenAiAdvice {
  try {
    const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
    return normalizeOpenAiAdvice(JSON.parse(cleaned) as Partial<OpenAiAdvice>, fallback);
  } catch {
    return fallback;
  }
}

export async function POST(request: Request): Promise<NextResponse<OpenAiAdvice>> {
  const body = (await request.json().catch(() => ({}))) as AdviceRequestBody;
  const fallback = buildFallback(body);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "あなたはグラトリ練習支援アプリのAIコーチです。出力はJSONのみです。",
          },
          {
            role: "user",
            content: buildPrompt(body),
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) return NextResponse.json(fallback);
    const data = (await response.json()) as OpenAiChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json(fallback);
    return NextResponse.json(parseAdvice(content, fallback));
  } catch {
    return NextResponse.json(fallback);
  }
}
