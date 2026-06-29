import { NextResponse } from "next/server";
import type { VideoAnalysisResult } from "@/lib/types";

const unavailableMessage = "AI動画解析は現在開発中です。正式公開までお待ちください。";

function unavailableResult(): VideoAnalysisResult {
  return {
    summary: unavailableMessage,
    likelyIssues: [],
    improvementPoints: [],
    nextPractice: [],
    shibakatsuAdvice: [],
    confidence: "low",
  };
}

export async function POST(): Promise<NextResponse<VideoAnalysisResult>> {
  return NextResponse.json(unavailableResult(), { status: 503 });
}
