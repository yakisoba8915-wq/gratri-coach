"use client";

import { Clock, ExternalLink, MapPin, Repeat } from "lucide-react";
import { calculateSuccessRate, formatDate } from "@/lib/calculations";
import type { PracticeLog, Trick } from "@/lib/types";
import PracticeVideoList from "@/components/PracticeVideoList";

export default function PracticeLogCard({ log, trick }: { log: PracticeLog; trick?: Trick }) {
  const rate = calculateSuccessRate(log.successCount, log.failCount);
  const isShibakatsu = (log.trainingType ?? "snow") === "shibakatsu";

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-glacier">{formatDate(log.date)}</p>
            <span className={`rounded-full px-2 py-1 text-[10px] font-black ${isShibakatsu ? "bg-emerald-50 text-emerald-600" : "bg-ice text-glacier"}`}>
              {isShibakatsu ? "シバカツ" : "ゲレンデ"}
            </span>
          </div>
          <h3 className="mt-1 truncate text-lg font-black">{isShibakatsu && log.shibakatsuMenu ? log.shibakatsuMenu : trick?.nameJa ?? "不明な技"}</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">{isShibakatsu ? `関連：${trick?.nameJa ?? "未設定"}` : trick?.nameJa}</p>
          {!isShibakatsu && log.resortName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={12} />
              {log.resortName}
            </p>
          )}
        </div>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ice">
          <div className="text-center">
            <div className="text-lg font-black text-glacier">{rate}%</div>
            <div className="text-[9px] font-bold text-slate-400">成功率</div>
          </div>
        </div>
      </div>

      {isShibakatsu && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold text-slate-500">
          <div className="rounded-2xl bg-slate-50 p-2">
            <Clock size={14} className="mb-1 text-glacier" />
            {log.durationMinutes ?? 0}分
          </div>
          <div className="rounded-2xl bg-slate-50 p-2">
            <Repeat size={14} className="mb-1 text-glacier" />
            {log.reps ?? 0}回
          </div>
          <div className="rounded-2xl bg-slate-50 p-2">
            <Repeat size={14} className="mb-1 text-glacier" />
            {log.sets ?? 0}セット
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-[10px] font-bold text-slate-400">次回課題</p>
        <p className="mt-1 text-sm font-bold">{log.nextTask || "次の練習で決めよう"}</p>
      </div>

      <PracticeVideoList practiceLogId={log.id} log={log} trick={trick} />

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
