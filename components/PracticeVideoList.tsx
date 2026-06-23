"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, ImageIcon, Loader2, PlayCircle, Trash2 } from "lucide-react";
import { deletePracticeVideo, getPracticeVideosByLogId } from "@/lib/videoStorage";
import { extractFramesFromVideo, saveVideoFrameMetadata, uploadVideoFrame } from "@/lib/videoFrameExtractor";
import type { PracticeLog, PracticeVideo, PracticeVideoFrame, Trick, VideoAnalysisResult } from "@/lib/types";

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

export default function PracticeVideoList({ practiceLogId, log, trick }: PracticeVideoListProps) {
  const [videos, setVideos] = useState<PracticeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingVideoId, setAnalyzingVideoId] = useState<string | null>(null);
  const [framesByVideoId, setFramesByVideoId] = useState<Record<string, PracticeVideoFrame[]>>({});
  const [analysisByVideoId, setAnalysisByVideoId] = useState<Record<string, VideoAnalysisResult>>({});
  const [error, setError] = useState("");

  async function loadVideos(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      setVideos(await getPracticeVideosByLogId(practiceLogId));
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
        body: JSON.stringify({
          trickName: trick?.nameJa ?? log.trickId,
          practiceLog: log,
          frames: savedFrames,
        }),
      });

      const result = (await response.json().catch(() => ({
        summary: emptyAnalysisError,
        likelyIssues: [],
        improvementPoints: [],
        nextPractice: [],
        shibakatsuAdvice: [],
        confidence: "low",
      }))) as VideoAnalysisResult;

      setAnalysisByVideoId((current) => ({ ...current, [video.id]: result }));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : emptyAnalysisError;
      setError(message || emptyAnalysisError);
      setAnalysisByVideoId((current) => ({
        ...current,
        [video.id]: {
          summary: emptyAnalysisError,
          likelyIssues: [],
          improvementPoints: [],
          nextPractice: [],
          shibakatsuAdvice: [],
          confidence: "low",
        },
      }));
    } finally {
      setAnalyzingVideoId(null);
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
            const isAnalyzing = analyzingVideoId === video.id;

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
