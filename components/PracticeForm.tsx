"use client";

import { Plus, Save, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import { snowConditions, type PracticeLog, type SnowCondition } from "@/lib/types";
import { uploadPracticeVideo } from "@/lib/videoStorage";

const maxVideoSizeMb = 100;
const allowedVideoExtensions = ".mp4,.mov,.webm";

export default function PracticeForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const tricks = storedTricks ?? initialTricks;

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [trickId, setTrickId] = useState("");
  const [resortName, setResortName] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [snowCondition, setSnowCondition] = useState<SnowCondition>(snowConditions[snowConditions.length - 1]);
  const [memo, setMemo] = useState("");
  const [selfAnalysis, setSelfAnalysis] = useState("");
  const [weakPoint, setWeakPoint] = useState("");
  const [nextTask, setNextTask] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState("");
  const [videoError, setVideoError] = useState("");

  const totalUploadSize = useMemo(() => videoFiles.reduce((sum, file) => sum + file.size, 0), [videoFiles]);

  function addFiles(files: FileList | null): void {
    if (!files) return;
    setVideoError("");
    const nextFiles = Array.from(files);
    const invalid = nextFiles.find((file) => file.size > maxVideoSizeMb * 1024 * 1024);
    if (invalid) {
      setVideoError(`${invalid.name} は100MBを超えています。`);
      return;
    }
    setVideoFiles((current) => [...current, ...nextFiles]);
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setVideoError("");
    setUploadedCount(0);

    if (!date || !trickId) {
      setError("日付と技名を入力してください");
      return;
    }

    const logId = `log-${Date.now()}`;
    const log: PracticeLog = {
      id: logId,
      date,
      trickId,
      resortName,
      successCount,
      failCount,
      snowCondition,
      memo,
      selfAnalysis,
      weakPoint,
      nextTask,
      videoUrls: videoUrls.filter(Boolean),
    };

    const logs = await dataRepository.getLogs();
    await dataRepository.saveLogs([log, ...logs]);

    if (videoFiles.length > 0) {
      if (!user) {
        setVideoError("ログインすると動画を保存できます");
        return;
      }

      try {
        setUploading(true);
        for (const file of videoFiles) {
          await uploadPracticeVideo({ file, practiceLogId: logId, trickId });
          setUploadedCount((count) => count + 1);
        }
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : "動画アップロードに失敗しました。";
        setVideoError(message);
        return;
      } finally {
        setUploading(false);
      }
    }

    router.push("/practice");
  }

  if (loading) {
    return <div className="card py-12 text-center text-sm text-slate-400">ログイン状態を確認中...</div>;
  }

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
    <form onSubmit={submit} className="space-y-4">
      <div className="card grid gap-4">
        <label className="text-sm font-bold">
          日付 <span className="text-rose-500">*</span>
          <input type="date" required className="field mt-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="text-sm font-bold">
          技名 <span className="text-rose-500">*</span>
          <select required className="field mt-2" value={trickId} onChange={(e) => setTrickId(e.target.value)}>
            <option value="">選択してください</option>
            {tricks.map((trick) => (
              <option key={trick.id} value={trick.id}>
                {trick.nameJa}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          スキー場
          <input className="field mt-2" value={resortName} onChange={(e) => setResortName(e.target.value)} placeholder="例：かぐらスキー場" />
        </label>
        <label className="text-sm font-bold">
          雪質
          <select className="field mt-2" value={snowCondition} onChange={(e) => setSnowCondition(e.target.value as SnowCondition)}>
            {snowConditions.map((condition) => (
              <option key={condition}>{condition}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="card">
        <h2 className="mb-3 font-black">トライ回数</h2>
        <div className="grid grid-cols-2 gap-3">
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

      <div className="card grid gap-4">
        <label className="text-sm font-bold">
          メモ
          <textarea className="field mt-2 min-h-20" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
        <label className="text-sm font-bold">
          自己分析
          <textarea className="field mt-2 min-h-20" value={selfAnalysis} onChange={(e) => setSelfAnalysis(e.target.value)} />
        </label>
        <label className="text-sm font-bold">
          弱点
          <input className="field mt-2" value={weakPoint} onChange={(e) => setWeakPoint(e.target.value)} />
        </label>
        <label className="text-sm font-bold">
          次回課題
          <input className="field mt-2" value={nextTask} onChange={(e) => setNextTask(e.target.value)} />
        </label>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-black">動画を追加</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">mp4 / mov / webm、最大100MB</p>
          </div>
          <UploadCloud className="text-glacier" size={22} />
        </div>
        <label className="grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
          ファイル選択
          <input type="file" accept={allowedVideoExtensions} multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </label>
        {videoFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {videoFiles.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500">
                <span className="truncate">{file.name}</span>
                <button type="button" aria-label="動画を削除" onClick={() => setVideoFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))} className="text-slate-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <p className="text-xs font-bold text-slate-400">合計 {(totalUploadSize / 1024 / 1024).toFixed(1)}MB</p>
          </div>
        )}
        {uploading && <p className="mt-3 text-sm font-bold text-glacier">アップロード中... {uploadedCount}/{videoFiles.length}</p>}
        {!uploading && uploadedCount > 0 && <p className="mt-3 text-sm font-bold text-emerald-600">アップロード完了 {uploadedCount}件</p>}
        {videoError && <p className="mt-3 text-sm font-bold text-rose-500">{videoError}</p>}
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black">動画URL</h2>
          <button type="button" onClick={() => setVideoUrls([...videoUrls, ""])} className="text-xs font-bold text-glacier">
            <Plus size={14} className="inline" /> 追加
          </button>
        </div>
        <div className="space-y-2">
          {videoUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input type="url" className="field" placeholder="https://..." value={url} onChange={(e) => setVideoUrls(videoUrls.map((value, valueIndex) => (valueIndex === index ? e.target.value : value)))} />
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
      <button disabled={uploading} className="btn-primary w-full py-4 disabled:opacity-60">
        <Save size={19} />
        {uploading ? "動画をアップロード中..." : "練習記録を保存"}
      </button>
    </form>
  );
}
