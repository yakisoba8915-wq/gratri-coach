"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedTrickStance } from "@/hooks/useSelectedTrickStance";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import { formatTrickName } from "@/lib/trickDisplay";
import { snowConditions, type PracticeLog, type SnowCondition, type TrainingType } from "@/lib/types";
import PracticeVideoUploader, { type PracticeVideoUploaderHandle } from "@/components/PracticeVideoUploader";

const shibakatsuMenus = ["プレス練習", "ノーズプレス姿勢", "テールプレス姿勢", "乗せ替え練習", "オーリー動作確認", "ノーリー動作確認", "回転導入練習", "着地姿勢確認"];

export default function PracticeForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const videoUploaderRef = useRef<PracticeVideoUploaderHandle>(null);
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const [selectedStance] = useSelectedTrickStance();
  const tricks = storedTricks ?? initialTricks;
  const [logId] = useState(() => `log-${Date.now()}`);

  const [trainingType, setTrainingType] = useState<TrainingType>("snow");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [trickId, setTrickId] = useState("");
  const [resortName, setResortName] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [snowCondition, setSnowCondition] = useState<SnowCondition>(snowConditions[snowConditions.length - 1]);
  const [shibakatsuMenu, setShibakatsuMenu] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [reps, setReps] = useState(0);
  const [sets, setSets] = useState(0);
  const [memo, setMemo] = useState("");
  const [selfAnalysis, setSelfAnalysis] = useState("");
  const [weakPoint, setWeakPoint] = useState("");
  const [nextTask, setNextTask] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");

    if (!date || !trickId) {
      setError("日付と技名を入力してください");
      return;
    }
    if (trainingType === "shibakatsu" && !shibakatsuMenu.trim()) {
      setError("シバカツ練習メニューを入力してください");
      return;
    }

    const log: PracticeLog = {
      id: logId,
      date,
      trainingType,
      trickId,
      resortName: trainingType === "snow" ? resortName : "",
      successCount,
      failCount,
      snowCondition,
      memo,
      selfAnalysis,
      weakPoint,
      nextTask,
      videoUrls: videoUrls.filter(Boolean),
      ...(trainingType === "shibakatsu" ? { shibakatsuMenu: shibakatsuMenu.trim(), durationMinutes, reps, sets } : {}),
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
        <p className="mt-2 text-xs font-bold text-slate-400">ログインすると動画を保存できます</p>
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

        {trainingType === "snow" ? (
          <label className="text-sm font-bold">
            ゲレンデ
            <input className="field mt-2" value={resortName} onChange={(e) => setResortName(e.target.value)} placeholder="例：かぐらスキー場" />
          </label>
        ) : (
          <label className="text-sm font-bold">
            練習メニュー <span className="text-rose-500">*</span>
            <input className="field mt-2" list="shibakatsu-menu-list" value={shibakatsuMenu} onChange={(e) => setShibakatsuMenu(e.target.value)} placeholder="例：乗せ替え練習" />
            <datalist id="shibakatsu-menu-list">
              {shibakatsuMenus.map((menu) => (
                <option key={menu} value={menu} />
              ))}
            </datalist>
          </label>
        )}

        <label className="text-sm font-bold">
          {trainingType === "snow" ? "技名" : "関連トリック"} <span className="text-rose-500">*</span>
          <select required className="field mt-2" value={trickId} onChange={(e) => setTrickId(e.target.value)}>
            <option value="">選択してください</option>
            {tricks.map((trick) => (
              <option key={trick.id} value={trick.id}>
                {formatTrickName(trick.nameJa, selectedStance)}
              </option>
            ))}
          </select>
        </label>

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
              <input type="number" min="0" className="field mt-2" value={durationMinutes} onChange={(e) => setDurationMinutes(Math.max(0, Number(e.target.value)))} />
            </label>
            <label className="text-sm font-bold">
              回数
              <input type="number" min="0" className="field mt-2" value={reps} onChange={(e) => setReps(Math.max(0, Number(e.target.value)))} />
            </label>
            <label className="text-sm font-bold">
              セット数
              <input type="number" min="0" className="field mt-2" value={sets} onChange={(e) => setSets(Math.max(0, Number(e.target.value)))} />
            </label>
          </div>
        )}
      </div>

      <div className="card flex flex-col">
        <h2 className="mb-3 font-black">トライ回数</h2>
        <div className="grid min-w-0 w-full max-w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2">
          <label className="text-sm font-bold text-emerald-600">
            成功回数
            <input type="number" min="0" className="field mt-2" value={successCount} onChange={(e) => setSuccessCount(Math.max(0, Number(e.target.value)))} />
          </label>
          <label className="text-sm font-bold text-rose-500">
            失敗回数
            <input type="number" min="0" className="field mt-2" value={failCount} onChange={(e) => setFailCount(Math.max(0, Number(e.target.value)))} />
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
