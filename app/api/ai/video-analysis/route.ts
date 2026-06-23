import { NextResponse } from "next/server";
import { AI_USAGE_LIMIT_MESSAGE, getServerAiUsageStatus, recordServerAiUsage } from "@/lib/aiUsageLimits";
import type { PracticeLog, PracticeVideoFrame, VideoAnalysisResult } from "@/lib/types";

interface VideoAnalysisRequestBody {
  trickName?: string;
  practiceLog?: PracticeLog;
  frames?: PracticeVideoFrame[];
}

interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

type Confidence = VideoAnalysisResult["confidence"];

const unavailableMessage = "AI動画解析は現在利用できません。動画と練習記録をもとに、自己分析メモを残してください。";

function fallbackResult(): VideoAnalysisResult {
  return {
    summary: unavailableMessage,
    likelyIssues: [],
    improvementPoints: [],
    nextPractice: [],
    shibakatsuAdvice: [],
    confidence: "low",
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function normalizeConfidence(value: unknown): Confidence {
  return value === "medium" || value === "high" || value === "low" ? value : "low";
}

function normalizeResult(value: unknown, fallback: VideoAnalysisResult): VideoAnalysisResult {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return {
    summary: typeof record.summary === "string" && record.summary.trim() ? record.summary.trim() : fallback.summary,
    likelyIssues: toStringArray(record.likelyIssues),
    improvementPoints: toStringArray(record.improvementPoints),
    nextPractice: toStringArray(record.nextPractice),
    shibakatsuAdvice: toStringArray(record.shibakatsuAdvice),
    confidence: normalizeConfidence(record.confidence),
  };
}

function parseResult(content: string, fallback: VideoAnalysisResult): VideoAnalysisResult {
  try {
    const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
    return normalizeResult(JSON.parse(cleaned), fallback);
  } catch {
    return fallback;
  }
}

function buildTextPrompt(body: VideoAnalysisRequestBody): string {
  const log = body.practiceLog;
  const total = (log?.successCount ?? 0) + (log?.failCount ?? 0);
  const successRate = total > 0 ? Math.round(((log?.successCount ?? 0) / total) * 100) : 0;

  return JSON.stringify(
    {
      instruction:
        "動画から抽出した数枚の静止画のみを見ているため、断定せず、可能性として改善点を提案してください。危険な練習は勧めず、基礎・前提技・安全確認を重視してください。必ず日本語のJSONのみで返してください。",
      outputSchema: {
        summary: "string",
        likelyIssues: ["string"],
        improvementPoints: ["string"],
        nextPractice: ["string"],
        shibakatsuAdvice: ["string"],
        confidence: "low | medium | high",
      },
      practiceData: {
        trickName: body.trickName ?? log?.trickId ?? "未設定",
        trainingType: log?.trainingType ?? "snow",
        successCount: log?.successCount ?? 0,
        failCount: log?.failCount ?? 0,
        successRate,
        selfAnalysis: log?.selfAnalysis ?? "",
        weakPoint: log?.weakPoint ?? "",
        nextTask: log?.nextTask ?? "",
        memo: log?.memo ?? "",
      },
      extractedFrames: (body.frames ?? []).map((frame) => ({
        frameIndex: frame.frameIndex,
        capturedAtPercent: frame.capturedAtPercent,
        createdAt: frame.createdAt,
      })),
    },
    null,
    2,
  );
}

export async function POST(request: Request): Promise<NextResponse<VideoAnalysisResult>> {
  const body = (await request.json().catch(() => ({}))) as VideoAnalysisRequestBody;
  const fallback = fallbackResult();
  const apiKey = process.env.OPENAI_API_KEY;
  const frames = (body.frames ?? []).filter((frame) => frame.frameUrl);

  if (!apiKey || frames.length === 0) return NextResponse.json(fallback);
  const usageStatus = await getServerAiUsageStatus(request, "ai_video_analysis");
  if (!usageStatus) return NextResponse.json(fallback);
  if (usageStatus.limitReached) return NextResponse.json({ ...fallback, summary: AI_USAGE_LIMIT_MESSAGE });

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
            content:
              "あなたはグラトリ初心者〜中級者向けのスノーボードコーチです。静止画だけで断定せず、可能性としてフォーム改善・次回練習・シバカツ補強を短く実践的に提案してください。出力はJSONのみです。",
          },
          {
            role: "user",
            content: [
              { type: "text", text: buildTextPrompt(body) },
              ...frames.map((frame) => ({
                type: "image_url",
                image_url: { url: frame.frameUrl },
              })),
            ],
          },
        ],
        temperature: 0.35,
      }),
    });

    if (!response.ok) return NextResponse.json(fallback);
    const data = (await response.json()) as OpenAiChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json(fallback);
    await recordServerAiUsage(request, "ai_video_analysis");
    return NextResponse.json(parseResult(content, fallback));
  } catch {
    return NextResponse.json(fallback);
  }
}
