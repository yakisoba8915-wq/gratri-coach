"use client";

import { ExternalLink, MapPin, PlayCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateSuccessRate, formatDate } from "@/lib/calculations";
import type { PracticeLog, PracticeVideo, Trick } from "@/lib/types";
import { deletePracticeVideo, getPracticeVideosByLogId } from "@/lib/videoStorage";

export default function PracticeLogCard({ log, trick }: { log: PracticeLog; trick?: Trick }) {
  const rate = calculateSuccessRate(log.successCount, log.failCount);
  const [videos, setVideos] = useState<PracticeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState("");

  async function loadVideos(): Promise<void> {
    setLoadingVideos(true);
    setVideoError("");
    try {
      setVideos(await getPracticeVideosByLogId(log.id));
    } catch {
      setVideoError("動画の読み込みに失敗しました。");
    } finally {
      setLoadingVideos(false);
    }
  }

  async function removeVideo(video: PracticeVideo): Promise<void> {
    if (!window.confirm(`${video.fileName} を削除しますか？`)) return;
    setVideoError("");
    try {
      await deletePracticeVideo(video);
      setVideos((current) => current.filter((item) => item.id !== video.id));
    } catch {
      setVideoError("動画の削除に失敗しました。");
    }
  }

  useEffect(() => {
    void loadVideos();
  }, [log.id]);

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-glacier">{formatDate(log.date)}</p>
          <h3 className="mt-1 text-lg font-black">{trick?.nameJa ?? "不明な技"}</h3>
          {log.resortName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={12} />
              {log.resortName}
            </p>
          )}
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-ice">
          <div className="text-center">
            <div className="text-lg font-black text-glacier">{rate}%</div>
            <div className="text-[9px] font-bold text-slate-400">成功率</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-[10px] font-bold text-slate-400">次回課題</p>
        <p className="mt-1 text-sm font-bold">{log.nextTask || "次の練習で決めよう"}</p>
      </div>

      {videos.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-black">
            <PlayCircle size={16} className="text-glacier" />
            保存済み動画
          </div>
          {videos.map((video) => (
            <div key={video.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
              <video src={video.fileUrl} controls preload="metadata" className="aspect-video w-full bg-slate-900 object-contain" />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <a href={video.fileUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-bold text-glacier">
                  {video.fileName}
                </a>
                <button type="button" onClick={() => void removeVideo(video)} className="rounded-full bg-white p-2 text-rose-500 shadow-sm" aria-label="動画を削除">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loadingVideos && <p className="mt-3 text-xs font-bold text-slate-400">動画を確認中...</p>}
      {videoError && <p className="mt-3 text-xs font-bold text-rose-500">{videoError}</p>}

      {log.videoUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {log.videoUrls.map((url, index) => (
            <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-glacier">
              <ExternalLink size={13} />
              動画URL {index + 1}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
