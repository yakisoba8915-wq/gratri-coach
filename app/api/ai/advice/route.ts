import { NextResponse } from "next/server";
import { convertRuleBasedToOpenAiAdvice, generateRuleBasedAdvice, normalizeOpenAiAdvice, type OpenAiAdvice, type PracticeVideoContextForAi, type TrickStatForAi } from "@/lib/aiAdvisor";
import type { Goal, OffTrainingPlan, PracticeLog, PracticeVideo, Profile, Trick } from "@/lib/types";

interface AdviceRequestBody {
  practiceLogs?: PracticeLog[];
  practiceVideos?: PracticeVideo[];
  videoContexts?: PracticeVideoContextForAi[];
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
    videos: body.practiceVideos ?? [],
    goals: body.goals ?? [],
    profile: body.profile ?? undefined,
    offTrainingPlan: body.offtrainingPlan ?? null,
  });
  return convertRuleBasedToOpenAiAdvice(ruleAdvice, body.videoContexts ?? []);
}

function buildPrompt(body: AdviceRequestBody): string {
  return JSON.stringify(
    {
      instruction:
        "あなたはスノーボードのグラトリ練習コーチです。練習記録と動画メタデータを統合して分析してください。動画ファイルの中身は解析できないため、動画本数・ファイル名・作成日・紐づく練習記録から、見直すべき記録や次に撮影すべき技を提案してください。危険な無理な練習は勧めず、基礎技・前提技・安全確認を重視してください。必ず指定JSON形式だけを日本語で返してください。",
      outputSchema: {
        summary: "string",
        weakPoints: ["string"],
        recommendedTricks: ["string"],
        nextPracticeMenu: ["string"],
        offTrainingAdvice: ["string"],
        videoInsights: ["動画付き記録から見える傾向"],
        videosToReview: ["動画を見直すべき技や記録"],
        nextVideosToShoot: ["次に撮影すべき技"],
        priority: "high | medium | low",
      },
      data: {
        practiceLogs: body.practiceLogs ?? [],
        practiceVideos: body.practiceVideos ?? [],
        videoContexts: body.videoContexts ?? [],
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
            content: "あなたはグラトリ練習支援アプリのAIコーチです。出力はJSONのみです。動画内容の解析は行わず、動画メタデータと練習記録から助言してください。",
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
