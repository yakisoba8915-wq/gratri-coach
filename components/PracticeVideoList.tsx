"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Trash2 } from "lucide-react";
import { deletePracticeVideo, getPracticeVideosByLogId } from "@/lib/videoStorage";
import type { PracticeVideo } from "@/lib/types";

export default function PracticeVideoList({ practiceLogId }: { practiceLogId: string }) {
  const [videos, setVideos] = useState<PracticeVideo[]>([]);
  const [loading, setLoading] = useState(false);
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
    } catch {
      setError("動画の削除に失敗しました。");
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
        </>
      )}
      {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
}
