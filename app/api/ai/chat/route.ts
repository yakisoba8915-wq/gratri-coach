import { NextResponse } from "next/server";
import { AI_USAGE_LIMIT_MESSAGE, getServerAiUsageStatus, recordServerAiUsage } from "@/lib/aiUsageLimits";
import type { AiAdviceAction, AiCoachMessage, Goal, OffTrainingPlan, PracticeLog, PracticeVideoAnalysisResult, Profile } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message?: string;
  category?: string;
  messages?: ChatMessage[];
  context?: {
    profile?: Profile | null;
    practiceLogs?: PracticeLog[];
    goals?: Goal[];
    offtrainingPlan?: OffTrainingPlan | null;
    trickStats?: unknown[];
    aiCoachMessages?: AiCoachMessage[];
    videoAnalysisResults?: PracticeVideoAnalysisResult[];
    aiAdviceActions?: AiAdviceAction[];
  };
}

interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function ruleBasedReply(message: string, category?: string): string {
  const text = `${category ?? ""} ${message}`.toLowerCase();
  const prefix = "AI APIが未設定のため、基本アドバイスを表示しています。";
  if (text.includes("シバカツ")) return `${prefix}\nシバカツでは、姿勢キープ、重心移動、乗せ替え、着地姿勢確認を短く反復しましょう。筋トレや柔軟と混ぜず、板操作の感覚に集中するのがおすすめです。`;
  if (text.includes("オフトレ") || text.includes("筋トレ") || text.includes("柔軟")) return `${prefix}\nオフトレは体幹、股関節、足首を優先しましょう。15〜30分ならプランク、片足バランス、股関節ストレッチ、足首ストレッチから始めると雪上に繋がりやすいです。`;
  if (text.includes("360") || text.includes("180") || text.includes("回転")) return `${prefix}\n回転系は前提の180を安定させてから、目線・肩・腰の順に先行動作を作りましょう。無理に回し切るより、抜けと着地姿勢を崩さない練習が近道です。`;
  if (text.includes("ノーリー")) return `${prefix}\nノーリー系は前足側への荷重、上半身の先行、抜けのタイミングを分けて確認しましょう。まずノーリーFS/BS180の成功率を上げてから360へ進むのがおすすめです。`;
  if (text.includes("練習メニュー") || text.includes("今日")) return `${prefix}\n今日の練習は、基礎10本、メイン技20本、最後に成功率と次回課題を記録する流れがおすすめです。疲れたら難度を下げて、良い形で終えましょう。`;
  return `${prefix}\nまず前提技が安定しているか確認し、小さな動きから練習しましょう。成功回数だけでなく、失敗した理由と次回課題を1つだけメモすると上達が見えやすくなります。`;
}

function buildUserPrompt(body: ChatRequestBody): string {
  return JSON.stringify(
    {
      userQuestion: body.message ?? "",
      category: body.category ?? "",
      recentMessages: (body.messages ?? []).slice(-8),
      appContext: {
        profile: body.context?.profile ?? null,
        practiceLogs: (body.context?.practiceLogs ?? []).slice(0, 20),
        goals: body.context?.goals ?? [],
        offtrainingPlan: body.context?.offtrainingPlan ?? null,
        trickStats: body.context?.trickStats ?? [],
        aiCoachMessages: (body.context?.aiCoachMessages ?? []).slice(-20).map((message) => ({
          role: message.role,
          sourceType: message.sourceType,
          message: message.message,
          createdAt: message.createdAt,
        })),
        recentVideoAnalysisResults: (body.context?.videoAnalysisResults ?? []).slice(0, 8).map((result) => ({
          trickId: result.trickId,
          summary: result.summary,
          likelyIssues: result.likelyIssues,
          improvementPoints: result.improvementPoints,
          nextPractice: result.nextPractice,
          shibakatsuAdvice: result.shibakatsuAdvice,
          createdAt: result.createdAt,
        })),
        recentAiAdviceActions: (body.context?.aiAdviceActions ?? []).slice(0, 8).map((action) => ({
          actionType: action.actionType,
          appliedTo: action.appliedTo,
          content: action.content,
          createdAt: action.createdAt,
        })),
      },
      instruction:
        "過去の相談内容、最近の練習記録、苦手技、動画解析結果、オフトレ反映履歴があれば踏まえて回答してください。危険な無理な練習は勧めず、基礎技・前提技・安全確認を重視してください。回答は日本語で短く実践的にしてください。",
    },
    null,
    2,
  );
}

export async function POST(request: Request): Promise<NextResponse<{ reply: string; source: "openai" | "rule" }>> {
  const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
  const message = body.message?.trim() ?? "";
  const fallback = ruleBasedReply(message, body.category);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!message) return NextResponse.json({ reply: "質問を入力してください。", source: "rule" });
  if (!apiKey) return NextResponse.json({ reply: fallback, source: "rule" });

  const usageStatus = await getServerAiUsageStatus(request, "ai_chat");
  if (!usageStatus) return NextResponse.json({ reply: fallback, source: "rule" });
  if (usageStatus.limitReached) return NextResponse.json({ reply: AI_USAGE_LIMIT_MESSAGE, source: "rule" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "あなたはグラトリ初心者〜中級者向けのスノーボードコーチです。ユーザーの過去相談、練習記録、動画解析、反映履歴があれば踏まえて、無理のない範囲で、技の習得順、練習メニュー、シバカツ、オフトレ、注意点をわかりやすく説明してください。回答は日本語で短く実践的にしてください。",
          },
          {
            role: "user",
            content: buildUserPrompt(body),
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) return NextResponse.json({ reply: fallback, source: "rule" });
    const data = (await response.json()) as OpenAiChatResponse;
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (reply) await recordServerAiUsage(request, "ai_chat");
    return NextResponse.json({ reply: reply || fallback, source: reply ? "openai" : "rule" });
  } catch {
    return NextResponse.json({ reply: fallback, source: "rule" });
  }
}
