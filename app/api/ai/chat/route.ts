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

interface ResponsesApiTextItem {
  type?: string;
  text?: string;
}

interface ResponsesApiOutputItem {
  type?: string;
  content?: ResponsesApiTextItem[];
}

interface OpenAiResponsesApiResponse {
  output_text?: string;
  output?: ResponsesApiOutputItem[];
}

type ChatSource = "openai" | "rule";
type ChatErrorType = "missing_api_key" | "openai_error" | "usage_limit" | "invalid_request";

interface ChatResponseBody {
  reply: string;
  source: ChatSource;
  errorType?: ChatErrorType;
  error?: string;
  debug?: string;
}

const missingApiKeyMessage = "AI APIが未設定のため、基本アドバイスを表示しています。";
const openAiErrorMessage = "AI応答の生成に失敗しました。少し時間をおいてもう一度お試しください。";
const defaultModel = "gpt-4.1-mini";

function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}

function normalizeError(error: unknown): { message: string; stack?: string; name?: string; raw: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      raw: String(error),
    };
  }
  return {
    message: typeof error === "string" ? error : JSON.stringify(error),
    raw: String(error),
  };
}

function buildDebugPayload(params: {
  error?: unknown;
  status?: number | null;
  statusText?: string | null;
  body?: string | null;
  responseText?: string | null;
  model?: string;
}): string {
  const normalized = params.error ? normalizeError(params.error) : undefined;
  return JSON.stringify(
    {
      error: normalized?.raw ?? null,
      errorMessage: normalized?.message ?? null,
      errorStack: normalized?.stack ?? null,
      errorName: normalized?.name ?? null,
      openAiStatus: params.status ?? null,
      openAiStatusText: params.statusText ?? null,
      openAiBody: params.body ?? null,
      responseText: params.responseText ?? null,
      model: params.model ?? null,
    },
    null,
    2,
  );
}

function errorResponse(params: {
  errorType: ChatErrorType;
  status?: number;
  debug?: string;
  reply?: string;
}): NextResponse<ChatResponseBody> {
  const reply = params.reply ?? openAiErrorMessage;
  return NextResponse.json(
    {
      reply,
      source: "rule",
      errorType: params.errorType,
      error: reply,
      ...(isDevelopment() && params.debug ? { debug: params.debug } : {}),
    },
    { status: params.status ?? 200 },
  );
}

function ruleBasedReply(message: string, category?: string, prefix = missingApiKeyMessage): string {
  const text = `${category ?? ""} ${message}`.toLowerCase();
  if (text.includes("シバカツ")) {
    return `${prefix}\nシバカツでは、姿勢キープ、重心移動、乗せ替え、着地姿勢確認を短く反復しましょう。筋トレや柔軟と混ぜず、板操作の感覚に集中するのがおすすめです。`;
  }
  if (text.includes("オフトレ") || text.includes("筋トレ") || text.includes("柔軟")) {
    return `${prefix}\nオフトレは体幹、股関節、足首を優先しましょう。15〜30分ならプランク、片足バランス、股関節ストレッチ、足首ストレッチから始めると雪上につながりやすいです。`;
  }
  if (text.includes("360") || text.includes("180") || text.includes("回転")) {
    return `${prefix}\n回転系は前提の180を安定させてから、目線・肩・腰の順に先行動作を作りましょう。無理に回し切るより、抜けと着地姿勢を崩さない練習が近道です。`;
  }
  if (text.includes("ノーリー")) {
    return `${prefix}\nノーリー系は前足側への荷重、上半身の先行、抜けのタイミングを分けて確認しましょう。まずノーリーFS/BS180の成功率を上げてから360へ進むのがおすすめです。`;
  }
  if (text.includes("練習メニュー") || text.includes("今日")) {
    return `${prefix}\n今日の練習は、基礎10本、メイン技20本、最後に成功率と次回課題を記録する流れがおすすめです。疲れたら難度を下げて、良い形で終えましょう。`;
  }
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

function extractResponseText(data: OpenAiResponsesApiResponse): string {
  const directText = data.output_text?.trim();
  if (directText) return directText;

  const nestedText = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();

  return nestedText ?? "";
}

export async function POST(request: Request): Promise<NextResponse<ChatResponseBody>> {
  const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
  const message = body.message?.trim() ?? "";
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || defaultModel;

  console.log("OpenAI Key Exists:", Boolean(process.env.OPENAI_API_KEY));

  if (!message) {
    return errorResponse({
      errorType: "invalid_request",
      reply: "質問を入力してください。",
    });
  }

  if (!apiKey) {
    console.warn("[ai-chat] OPENAI_API_KEY is not set. Returning rule-based fallback.");
    return errorResponse({
      errorType: "missing_api_key",
      reply: ruleBasedReply(message, body.category),
    });
  }

  const usageStatus = await getServerAiUsageStatus(request, "ai_chat");
  if (usageStatus?.limitReached) {
    return errorResponse({
      errorType: "usage_limit",
      reply: AI_USAGE_LIMIT_MESSAGE,
    });
  }
  if (!usageStatus) {
    console.warn("[ai-chat] AI usage status could not be resolved. Continuing OpenAI call without usage limit enforcement for this request.");
  }

  let response: Response | null = null;
  let responseText = "";
  let responseBody = "";

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions:
          "あなたはグラトリ初心者〜中級者向けのスノーボードコーチです。ユーザーの過去相談、練習記録、動画解析、反映履歴があれば踏まえて、無理のない範囲で、技の習得順、練習メニュー、シバカツ、オフトレ、注意点をわかりやすく説明してください。回答は日本語で短く実践的にしてください。",
        input: buildUserPrompt(body),
        temperature: 0.5,
      }),
    });

    responseText = await response.text();
    responseBody = responseText;

    if (!response.ok) {
      const debug = buildDebugPayload({
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
        responseText,
        model,
      });
      console.error("[ai-chat] OpenAI API request failed", {
        error: null,
        errorMessage: null,
        errorStack: null,
        openAiStatus: response.status,
        openAiStatusText: response.statusText,
        openAiBody: responseBody,
        responseText,
        model,
      });
      return errorResponse({ errorType: "openai_error", status: 502, debug });
    }

    const data = JSON.parse(responseText) as OpenAiResponsesApiResponse;
    const reply = extractResponseText(data);

    if (!reply) {
      const debug = buildDebugPayload({
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
        responseText,
        model,
      });
      console.error("[ai-chat] OpenAI API returned an empty reply", {
        error: null,
        errorMessage: "OpenAI response did not contain output_text",
        errorStack: null,
        openAiStatus: response.status,
        openAiStatusText: response.statusText,
        openAiBody: responseBody,
        responseText,
        model,
      });
      return errorResponse({ errorType: "openai_error", status: 502, debug });
    }

    await recordServerAiUsage(request, "ai_chat");
    console.log("OpenAI Response Success");
    return NextResponse.json({ reply, source: "openai" });
  } catch (error) {
    const normalized = normalizeError(error);
    const debug = buildDebugPayload({
      error,
      status: response?.status ?? null,
      statusText: response?.statusText ?? null,
      body: responseBody || null,
      responseText: responseText || null,
      model,
    });

    console.error("[ai-chat] OpenAI API call failed", {
      error,
      errorMessage: normalized.message,
      errorStack: normalized.stack,
      openAiStatus: response?.status ?? null,
      openAiStatusText: response?.statusText ?? null,
      openAiBody: responseBody || null,
      responseText: responseText || null,
      model,
    });

    return errorResponse({ errorType: "openai_error", status: 502, debug });
  }
}
