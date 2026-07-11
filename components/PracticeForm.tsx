"use client";

import { Lock, Plus, Save, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedTrickStance } from "@/hooks/useSelectedTrickStance";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { canUseTrick } from "@/lib/accessControl";
import { formatTrickName } from "@/lib/trickDisplay";
import { dataRepository } from "@/lib/storage";
import { snowConditions, type PracticeLog, type SnowCondition, type TrainingType } from "@/lib/types";
import PracticeVideoUploader, { type PracticeVideoUploaderHandle } from "@/components/PracticeVideoUploader";

function toNonNegativeInt(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function numericText(value: string): string {
  return value.replace(/\D/g, "");
}

export default function PracticeForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const videoUploaderRef = useRef<PracticeVideoUploaderHandle>(null);
  const [storedTricks] = useSupabaseData(dataRepository.getAllTricks);
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [selectedStance] = useSelectedTrickStance();
  const planType = user ? profile?.planType ?? "free" : "free";
  const allTricks = storedTricks ?? [];
  const [logId] = useState(() => `log-${Date.now()}`);

  const [trainingType, setTrainingType] = useState<TrainingType>("snow");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [trickId, setTrickId] = useState("");
  const [trickSearch, setTrickSearch] = useState("");
  const [resortName, setResortName] = useState("");
  const [successCount, setSuccessCount] = useState("");
  const [failCount, setFailCount] = useState("");
  const [snowCondition, setSnowCondition] = useState<SnowCondition>(snowConditions[snowConditions.length - 1]);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");
  const [memo, setMemo] = useState("");
  const [selfAnalysis, setSelfAnalysis] = useState("");
  const [weakPoint, setWeakPoint] = useState("");
  const [nextTask, setNextTask] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const typeTricks = useMemo(
    () => allTricks.filter((trick) => (trick.trickType ?? "snow") === trainingType),
    [allTricks, trainingType],
  );
  const filteredTricks = useMemo(() => {
    const normalizedQuery = trickSearch.trim().toLowerCase();
    if (!normalizedQuery) return typeTricks;
    return typeTricks.filter((trick) =>
      `${trick.nameJa} ${trick.nameEn} ${trick.category}`.toLowerCase().includes(normalizedQuery),
    );
  }, [typeTricks, trickSearch]);
  const selectedTrick = typeTricks.find((trick) => trick.id === trickId);
  const hasLockedOptions = filteredTricks.some((trick) => !canUseTrick(trick, planType));

  useEffect(() => {
    setTrickId("");
    setTrickSearch("");
  }, [trainingType]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");

    if (!date || !trickId) {
      setError("日付と技名を選択してください");
      return;
    }
    if (!selectedTrick || !canUseTrick(selectedTrick, planType)) {
      setError("選択できる技を選んでください");
      return;
    }

    const log: PracticeLog = {
      id: logId,
      date,
      trainingType,
      trickId,
      resortName: trainingType === "snow" ? resortName : "",
      successCount: toNonNegativeInt(successCount),
      failCount: toNonNegativeInt(failCount),
      snowCondition,
      memo,
      selfAnalysis,
      weakPoint,
      nextTask,
      videoUrls: videoUrls.filter(Boolean),
      ...(trainingType === "shibakatsu" ? {
        shibakatsuMenu: selectedTrick.nameJa,
        durationMinutes: toNonNegativeInt(durationMinutes),
        reps: toNonNegativeInt(reps),
        sets: toNonNegativeInt(sets),
      } : {}),
    };

    setSaving(true);
    try {
      const logs = await dataRepository.getLogs();
      await dataRepository.saveLogs([log, ...logs.filter((item) => item.id !== log.id)]);
      await videoUploaderRef.current?.upload();
      router.push("/practice");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "練習記録の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="card py-12 text-center text-sm text-slate-400">ログイン状態を確認中...</div>;

  if (!user) {
    return (
      <div className="card py-12 text-center">
        <p className="text-sm text-slate-400">練習記録の追加にはログインが必要です</p>
        <p className="mt-2 text-xs font-bold text-slate-400">ログインすると動画も保存できます</p>
        <Link href="/profile" className="btn-primary mt-4">
          プロフィールでログイン
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="box-border w-full max-w-full space-y-4 overflow-hidden">
      <div className="card flex flex-col">
        <p className="mb-3 text-xs font-bold tracking-[.16em] text-glacier">PRACTICE TYPE</p>
        <div className="grid min-w-0 w-full max-w-full grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          {[
            ["snow", "ゲレンデでの滑走"],
            ["shibakatsu", "シバカツ練習"],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTrainingType(value as TrainingType)} className={`rounded-2xl px-3 py-3 text-sm font-black transition ${trainingType === value ? "bg-navy text-white shadow-card" : "bg-slate-100 text-slate-500"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card flex flex-col gap-4">
        <label className="text-sm font-bold">
          日付 <span className="text-rose-500">*</span>
          <input type="date" required className="field mt-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        {trainingType === "snow" && (
          <label className="text-sm font-bold">
            ゲレンデ
            <input className="field mt-2" value={resortName} onChange={(e) => setResortName(e.target.value)} placeholder="例：かぐらスキー場" />
          </label>
        )}

        <div className="text-sm font-bold">
          {trainingType === "snow" ? "技名" : "シバカツトリック"} <span className="text-rose-500">*</span>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={17} />
            <input className="field pl-11" value={trickSearch} onChange={(e) => setTrickSearch(e.target.value)} placeholder="技を選択" />
          </div>
          <select required className="field mt-2" value={trickId} onChange={(e) => setTrickId(e.target.value)}>
            <option value="">技を選択</option>
            {filteredTricks.map((trick) => {
              const selectable = canUseTrick(trick, planType);
              return (
                <option key={trick.id} value={trick.id} disabled={!selectable}>
                  {selectable ? "" : "🔒 Premium限定 / "}
                  {formatTrickName(trick.nameJa, selectedStance)} / Lv.{trick.difficulty}
                </option>
              );
            })}
          </select>
          {trainingType === "shibakatsu" && typeTricks.length === 0 && (
            <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-400">シバカツトリックがまだありません</p>
          )}
          {typeTricks.length > 0 && filteredTricks.length === 0 && (
            <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-400">検索条件に合う技がありません</p>
          )}
          {hasLockedOptions && (
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-600">
              <Lock size={13} />
              🔒 Premium限定の技は現在のプランでは選択できません
            </p>
          )}
        </div>

        {trainingType === "snow" && (
          <label className="text-sm font-bold">
            雪質
            <select className="field mt-2" value={snowCondition} onChange={(e) => setSnowCondition(e.target.value as SnowCondition)}>
              {snowConditions.map((condition) => (
                <option key={condition}>{condition}</option>
              ))}
            </select>
          </label>
        )}

        {trainingType === "shibakatsu" && (
          <div className="grid min-w-0 w-full max-w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm font-bold">
              実施時間
              <input type="text" inputMode="numeric" pattern="[0-9]*" className="field mt-2" value={durationMinutes} onChange={(e) => setDurationMinutes(numericText(e.target.value))} placeholder="0" />
            </label>
            <label className="text-sm font-bold">
              回数
              <input type="text" inputMode="numeric" pattern="[0-9]*" className="field mt-2" value={reps} onChange={(e) => setReps(numericText(e.target.value))} placeholder="0" />
            </label>
            <label className="text-sm font-bold">
              セット数
              <input type="text" inputMode="numeric" pattern="[0-9]*" className="field mt-2" value={sets} onChange={(e) => setSets(numericText(e.target.value))} placeholder="0" />
            </label>
          </div>
        )}
      </div>

      <div className="card flex flex-col">
        <h2 className="mb-3 font-black">トライ回数</h2>
        <div className="grid min-w-0 w-full max-w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2">
          <label className="text-sm font-bold text-emerald-600">
            成功回数
            <input type="text" inputMode="numeric" pattern="[0-9]*" className="field mt-2" value={successCount} onChange={(e) => setSuccessCount(numericText(e.target.value))} placeholder="0" />
          </label>
          <label className="text-sm font-bold text-rose-500">
            失敗回数
            <input type="text" inputMode="numeric" pattern="[0-9]*" className="field mt-2" value={failCount} onChange={(e) => setFailCount(numericText(e.target.value))} placeholder="0" />
          </label>
        </div>
      </div>

      <div className="card flex flex-col gap-4">
        <label className="text-sm font-bold">
          メモ
          <textarea className="field mt-2 min-h-20" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
        <label className="text-sm font-bold">
          自己分析
          <textarea className="field mt-2 min-h-20" value={selfAnalysis} onChange={(e) => setSelfAnalysis(e.target.value)} />
        </label>
        <label className="text-sm font-bold">
          苦手ポイント
          <input className="field mt-2" value={weakPoint} onChange={(e) => setWeakPoint(e.target.value)} />
        </label>
        <label className="text-sm font-bold">
          次回課題
          <input className="field mt-2" value={nextTask} onChange={(e) => setNextTask(e.target.value)} />
        </label>
      </div>

      <PracticeVideoUploader ref={videoUploaderRef} practiceLogId={logId} trickId={trickId} />

      <div className="card flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black">動画URL</h2>
          <button type="button" onClick={() => setVideoUrls([...videoUrls, ""])} className="text-xs font-bold text-glacier">
            <Plus size={14} className="inline" /> 追加
          </button>
        </div>
        <div className="space-y-2">
          {videoUrls.map((url, index) => (
            <div key={index} className="flex min-w-0 w-full max-w-full gap-2">
              <input type="url" className="field min-w-0 flex-1" placeholder="https://..." value={url} onChange={(e) => setVideoUrls(videoUrls.map((value, valueIndex) => (valueIndex === index ? e.target.value : value)))} />
              {videoUrls.length > 1 && (
                <button type="button" aria-label="削除" onClick={() => setVideoUrls(videoUrls.filter((_, valueIndex) => valueIndex !== index))} className="rounded-xl px-2 text-slate-400">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-center text-sm font-bold text-rose-500">{error}</p>}
      <button disabled={saving} className="btn-primary w-full py-4 disabled:opacity-60">
        <Save size={19} />
        {saving ? "保存・アップロード中..." : "練習記録を保存"}
      </button>
    </form>
  );
}
