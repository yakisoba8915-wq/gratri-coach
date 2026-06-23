"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, GitCompareArrows, ImageIcon, Loader2, PlayCircle, Sparkles, Trash2 } from "lucide-react";
import { applyAiVideoAnalysisToNextTask, applyAiVideoAnalysisToPracticeMenu, generatePracticeMenuUpdateFromAnalysis } from "@/lib/aiAdviceActions";
import type { AiPracticeMenuUpdate, PracticeLog, PracticeVideo, PracticeVideoFrame, Trick, VideoAnalysisComparison, VideoAnalysisResult } from "@/lib/types";
import { compareVideoAnalysisResults, getVideoAnalysisResultsByTrickId, getVideoAnalysisResultsByVideoId, saveVideoAnalysisResult } from "@/lib/videoAnalysisStorage";
import { extractFramesFromVideo, saveVideoFrameMetadata, uploadVideoFrame } from "@/lib/videoFrameExtractor";
import { deletePracticeVideo, getPracticeVideosByLogId } from "@/lib/videoStorage";

interface PracticeVideoListProps {
  practiceLogId: string;
  log: PracticeLog;
  trick?: Trick;
}

const emptyAnalysisError = "AI動画解析は現在利用できません。動画と練習記録をもとに、自己分析メモを残してください。";

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[10px] font-black text-slate-400">{title}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2">
      <p className="text-[10px] font-black text-slate-400">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-xs font-bold text-slate-600">
              ・{item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs font-bold text-slate-400">{emptyText}</p>
      )}
    </div>
  );
}

function ComparisonCard({ comparison }: { comparison: VideoAnalysisComparison }) {
  return (
    <div className="space-y-2 rounded-3xl bg-ice/60 p-3">
      <p className="flex items-center gap-1 text-[10px] font-black text-glacier">
        <GitCompareArrows size={13} />
        過去動画との比較
      </p>
      <ComparisonList title="以前から続いている課題" items={comparison.repeatedIssues} emptyText="大きく繰り返している課題はまだ見つかっていません。" />
      <ComparisonList title="改善している点" items={comparison.improvedPoints} emptyText="比較できる改善点はこれから蓄積されます。" />
      <ComparisonList title="新しく出てきた課題" items={comparison.newIssues} emptyText="新しい課題は目立っていません。" />
      <ComparisonList title="次回重点ポイント" items={comparison.nextFocus} emptyText="次の解析結果が増えると重点ポイントを出しやすくなります。" />
    </div>
  );
}

function MenuUpdatePreview({ update }: { update: AiPracticeMenuUpdate }) {
  return (
    <div className="space-y-2 rounded-3xl bg-emerald-50 p-3">
      <p className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
        <Sparkles size={13} />
        自動生成される練習更新
      </p>
      <div className="rounded-2xl bg-white px-3 py-2">
        <p className="text-[10px] font-black text-slate-400">次回課題</p>
        <p className="mt-1 text-xs font-bold text-slate-700">{update.nextTask}</p>
      </div>
      {update.recommendedTricks.length > 0 && <ResultList title="次に練習すべき技" items={update.recommendedTricks} />}
      {update.shibakatsuItems.length > 0 && <ResultList title="シバカツで補う練習" items={update.shibakatsuItems.map((item) => `${item.name}：${item.amount}`)} />}
      {update.strengthFlexItems.length > 0 && <ResultList title="筋トレ＋柔軟で補う内容" items={update.strengthFlexItems.map((item) => `${item.name}：${item.amount}`)} />}
    </div>
  );
}

function fallbackAnalysis(): VideoAnalysisResult {
  return {
    summary: emptyAnalysisError,
    likelyIssues: [],
    improvementPoints: [],
    nextPractice: [],
    shibakatsuAdvice: [],
    confidence: "low",
  };
}

export default function PracticeVideoList({ practiceLogId, log, trick }: PracticeVideoListProps) {
  const [videos, setVideos] = useState<PracticeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingVideoId, setAnalyzingVideoId] = useState<string | null>(null);
  const [applyingVideoId, setApplyingVideoId] = useState<string | null>(null);
  const [applyingNextTaskVideoId, setApplyingNextTaskVideoId] = useState<string | null>(null);
  const [appliedVideoIds, setAppliedVideoIds] = useState<Set<string>>(new Set());
  const [nextTaskAppliedVideoIds, setNextTaskAppliedVideoIds] = useState<Set<string>>(new Set());
  const [framesByVideoId, setFramesByVideoId] = useState<Record<string, PracticeVideoFrame[]>>({});
  const [analysisByVideoId, setAnalysisByVideoId] = useState<Record<string, VideoAnalysisResult>>({});
  const [analysisResultIdByVideoId, setAnalysisResultIdByVideoId] = useState<Record<string, string>>({});
  const [comparisonByVideoId, setComparisonByVideoId] = useState<Record<string, VideoAnalysisComparison>>({});
  const [error, setError] = useState("");

  async function buildComparison(videoId: string, result: VideoAnalysisResult): Promise<void> {
    const history = await getVideoAnalysisResultsByTrickId(log.trickId);
    const previousResults = history.filter((item) => item.practiceVideoId !== videoId);
    setComparisonByVideoId((current) => ({ ...current, [videoId]: compareVideoAnalysisResults(result, previousResults) }));
  }

  async function loadVideos(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const loadedVideos = await getPracticeVideosByLogId(practiceLogId);
      setVideos(loadedVideos);

      const loadedAnalyses: Record<string, VideoAnalysisResult> = {};
      const loadedAnalysisIds: Record<string, string> = {};
      await Promise.all(
        loadedVideos.map(async (video) => {
          const results = await getVideoAnalysisResultsByVideoId(video.id);
          const latest = results[0];
          if (!latest) return;
          loadedAnalyses[video.id] = latest;
          loadedAnalysisIds[video.id] = latest.id;
          await buildComparison(video.id, latest);
        }),
      );
      setAnalysisByVideoId((current) => ({ ...current, ...loadedAnalyses }));
      setAnalysisResultIdByVideoId((current) => ({ ...current, ...loadedAnalysisIds }));
    } catch {
      setError("動画の読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function removeVideo(video: PracticeVideo): Promise<void> {
    if (!window.confirm(`${video.fileName} を削除しますか？`)) return;
    setError("");
    try {
      await deletePracticeVideo(video);
      setVideos((current) => current.filter((item) => item.id !== video.id));
      setFramesByVideoId((current) => {
        const next = { ...current };
        delete next[video.id];
        return next;
      });
      setAnalysisByVideoId((current) => {
        const next = { ...current };
        delete next[video.id];
        return next;
      });
      setAnalysisResultIdByVideoId((current) => {
        const next = { ...current };
        delete next[video.id];
        return next;
      });
      setComparisonByVideoId((current) => {
        const next = { ...current };
        delete next[video.id];
        return next;
      });
      setAppliedVideoIds((current) => {
        const next = new Set(current);
        next.delete(video.id);
        return next;
      });
      setNextTaskAppliedVideoIds((current) => {
        const next = new Set(current);
        next.delete(video.id);
        return next;
      });
    } catch {
      setError("動画の削除に失敗しました。");
    }
  }

  async function analyzeVideo(video: PracticeVideo): Promise<void> {
    setAnalyzingVideoId(video.id);
    setError("");
    try {
      const extractedFrames = await extractFramesFromVideo(video.fileUrl);
      const savedFrames: PracticeVideoFrame[] = [];

      for (const frame of extractedFrames) {
        const uploaded = await uploadVideoFrame({ frame, practiceVideoId: video.id, practiceLogId });
        const savedFrame = await saveVideoFrameMetadata({
          practiceVideoId: video.id,
          practiceLogId,
          frameUrl: uploaded.frameUrl || frame.previewUrl,
          framePath: uploaded.framePath,
          frameIndex: frame.frameIndex,
          capturedAtPercent: frame.capturedAtPercent,
        });
        savedFrames.push(savedFrame);
        URL.revokeObjectURL(frame.previewUrl);
      }

      setFramesByVideoId((current) => ({ ...current, [video.id]: savedFrames }));

      const response = await fetch("/api/ai/video-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trickName: trick?.nameJa ?? log.trickId, practiceLog: log, frames: savedFrames }),
      });

      const result = (await response.json().catch(() => fallbackAnalysis())) as VideoAnalysisResult;
      setAnalysisByVideoId((current) => ({ ...current, [video.id]: result }));

      try {
        const savedResult = await saveVideoAnalysisResult({ practiceVideoId: video.id, practiceLogId, trickId: log.trickId, result });
        setAnalysisResultIdByVideoId((current) => ({ ...current, [video.id]: savedResult.id }));
        const history = await getVideoAnalysisResultsByTrickId(log.trickId);
        const previousResults = history.filter((item) => item.id !== savedResult.id && item.practiceVideoId !== video.id);
        setComparisonByVideoId((current) => ({ ...current, [video.id]: compareVideoAnalysisResults(result, previousResults) }));
      } catch {
        setError("AI解析結果の保存に失敗しました。解析結果は画面上には表示されています。");
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : emptyAnalysisError;
      setError(message || emptyAnalysisError);
      setAnalysisByVideoId((current) => ({ ...current, [video.id]: fallbackAnalysis() }));
    } finally {
      setAnalyzingVideoId(null);
    }
  }

  async function applyAnalysis(videoId: string, analysis: VideoAnalysisResult): Promise<void> {
    const analysisResultId = analysisResultIdByVideoId[videoId];
    if (!analysisResultId) {
      setError("AI解析結果の保存後に反映できます。もう一度AI解析を実行してください。");
      return;
    }
    if (!window.confirm("このAI解析結果を次回課題とオフトレプランに反映しますか？")) return;

    setApplyingVideoId(videoId);
    setError("");
    try {
      await applyAiVideoAnalysisToPracticeMenu({
        practiceLog: log,
        practiceVideoId: videoId,
        analysisResultId,
        analysis,
      });
      setAppliedVideoIds((current) => new Set(current).add(videoId));
    } catch {
      setError("AI解析結果の練習メニュー反映に失敗しました。SupabaseのSQL設定を確認してください。");
    } finally {
      setApplyingVideoId(null);
    }
  }

  async function applyNextTaskOnly(videoId: string, analysis: VideoAnalysisResult): Promise<void> {
    const analysisResultId = analysisResultIdByVideoId[videoId];
    if (!analysisResultId) {
      setError("AI解析結果の保存後に反映できます。もう一度AI解析を実行してください。");
      return;
    }

    setApplyingNextTaskVideoId(videoId);
    setError("");
    try {
      await applyAiVideoAnalysisToNextTask({
        practiceLog: log,
        practiceVideoId: videoId,
        analysisResultId,
        analysis,
      });
      setNextTaskAppliedVideoIds((current) => new Set(current).add(videoId));
    } catch {
      setError("次回課題への反映に失敗しました。SupabaseのSQL設定を確認してください。");
    } finally {
      setApplyingNextTaskVideoId(null);
    }
  }

  useEffect(() => {
    void loadVideos();
  }, [practiceLogId]);

  if (loading) return <p className="mt-3 text-xs font-bold text-slate-400">動画を確認中...</p>;
  if (!videos.length && !error) return null;

  return (
    <div className="mt-4 space-y-3">
      {videos.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-sm font-black">
            <PlayCircle size={16} className="text-glacier" />
            保存済み動画
          </div>
          {videos.map((video) => {
            const frames = framesByVideoId[video.id] ?? [];
            const analysis = analysisByVideoId[video.id];
            const comparison = comparisonByVideoId[video.id];
            const isAnalyzing = analyzingVideoId === video.id;
            const isApplying = applyingVideoId === video.id;
            const isApplyingNextTask = applyingNextTaskVideoId === video.id;
            const generatedUpdate = analysis ? generatePracticeMenuUpdateFromAnalysis(analysis) : null;

            return (
              <div key={video.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
                <video src={video.fileUrl} controls preload="metadata" className="aspect-video w-full bg-slate-900 object-contain" />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <a href={video.fileUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-bold text-glacier">
                    {video.fileName}
                  </a>
                  <button
                    type="button"
                    onClick={() => void analyzeVideo(video)}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-1 rounded-full bg-glacier px-3 py-2 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                    AI解析
                  </button>
                  <button type="button" onClick={() => void removeVideo(video)} className="rounded-full bg-white p-2 text-rose-500 shadow-sm" aria-label="動画を削除">
                    <Trash2 size={15} />
                  </button>
                </div>

                {(isAnalyzing || frames.length > 0 || analysis) && (
                  <div className="space-y-3 border-t border-white px-3 py-3">
                    {isAnalyzing && (
                      <p className="inline-flex items-center gap-2 text-xs font-black text-glacier">
                        <Loader2 size={14} className="animate-spin" />
                        解析中：代表フレームを抽出しています...
                      </p>
                    )}

                    {frames.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1 text-[10px] font-black text-slate-400">
                          <ImageIcon size={13} />
                          抽出されたフレーム
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {frames.map((frame) => (
                            <div key={frame.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                              <img src={frame.frameUrl} alt={`${frame.capturedAtPercent}% frame`} className="aspect-video w-full object-cover" />
                              <p className="px-2 py-1 text-center text-[10px] font-bold text-slate-400">{frame.capturedAtPercent}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis && (
                      <div className="space-y-3 rounded-3xl bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-black text-glacier">AI解析結果</p>
                            <p className="mt-1 text-sm font-bold leading-relaxed text-slate-700">{analysis.summary}</p>
                          </div>
                          <span className="rounded-full bg-ice px-2 py-1 text-[10px] font-black text-glacier">信頼度 {analysis.confidence}</span>
                        </div>
                        <ResultList title="可能性のある課題" items={analysis.likelyIssues} />
                        <ResultList title="改善ポイント" items={analysis.improvementPoints} />
                        <ResultList title="次回練習" items={analysis.nextPractice} />
                        <ResultList title="シバカツ補強" items={analysis.shibakatsuAdvice} />
                        {comparison && <ComparisonCard comparison={comparison} />}
                        {generatedUpdate && <MenuUpdatePreview update={generatedUpdate} />}
                        <button
                          type="button"
                          onClick={() => void applyAnalysis(video.id, analysis)}
                          disabled={isApplying || appliedVideoIds.has(video.id)}
                          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isApplying ? "反映中..." : appliedVideoIds.has(video.id) ? "練習メニューに反映済み" : "この解析を練習メニューに反映"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void applyNextTaskOnly(video.id, analysis)}
                          disabled={isApplyingNextTask || nextTaskAppliedVideoIds.has(video.id)}
                          className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isApplyingNextTask ? "次回課題へ反映中..." : nextTaskAppliedVideoIds.has(video.id) ? "次回課題に反映済み" : "次回課題に反映する"}
                        </button>
                        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-[10px] font-bold leading-relaxed text-amber-700">
                          注意：静止画ベースの簡易解析です。動画全体の動きはまだ解析していないため、断定ではなく練習のヒントとして使ってください。
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
      {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
}
