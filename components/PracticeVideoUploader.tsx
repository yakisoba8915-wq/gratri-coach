"use client";

import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Trash2, UploadCloud } from "lucide-react";
import { uploadPracticeVideo } from "@/lib/videoStorage";
import type { PracticeVideo } from "@/lib/types";

export interface PracticeVideoUploaderHandle {
  upload: () => Promise<PracticeVideo[]>;
  hasFiles: () => boolean;
  clear: () => void;
}

interface PracticeVideoUploaderProps {
  practiceLogId: string;
  trickId: string;
  disabled?: boolean;
}

const maxVideoSizeMb = 100;
const allowedVideoExtensions = ".mp4,.mov,.webm";

const PracticeVideoUploader = forwardRef<PracticeVideoUploaderHandle, PracticeVideoUploaderProps>(function PracticeVideoUploader({ practiceLogId, trickId, disabled = false }, ref) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState("");
  const totalUploadSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  function addFiles(fileList: FileList | null): void {
    if (!fileList || disabled) return;
    setError("");
    const nextFiles = Array.from(fileList);
    const invalid = nextFiles.find((file) => file.size > maxVideoSizeMb * 1024 * 1024);
    if (invalid) {
      setError(`${invalid.name} は100MBを超えています。`);
      return;
    }
    setFiles((current) => [...current, ...nextFiles]);
  }

  async function upload(): Promise<PracticeVideo[]> {
    if (!files.length) return [];
    if (!trickId) throw new Error("動画アップロード前に技名を選択してください。");

    setUploading(true);
    setError("");
    setUploadedCount(0);
    const uploaded: PracticeVideo[] = [];
    try {
      for (const file of files) {
        uploaded.push(await uploadPracticeVideo({ file, practiceLogId, trickId }));
        setUploadedCount((count) => count + 1);
      }
      setFiles([]);
      return uploaded;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "動画アップロードに失敗しました。";
      setError(message);
      throw cause;
    } finally {
      setUploading(false);
    }
  }

  useImperativeHandle(ref, () => ({
    upload,
    hasFiles: () => files.length > 0,
    clear: () => {
      setFiles([]);
      setError("");
      setUploadedCount(0);
    },
  }));

  return (
    <div className="card flex w-full max-w-full flex-col overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-black">動画を追加</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">{disabled ? "ログインすると動画を保存できます" : "mp4 / mov / webm、最大100MB"}</p>
        </div>
        <UploadCloud className="text-glacier" size={22} />
      </div>

      <label className={`grid place-items-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold ${disabled ? "text-slate-300" : "cursor-pointer text-slate-500"}`}>
        ファイル選択
        <input disabled={disabled || uploading} type="file" accept={allowedVideoExtensions} multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
      </label>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 w-full max-w-full items-center justify-between gap-2 overflow-hidden rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500">
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button type="button" aria-label="動画を削除" disabled={uploading} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="text-slate-400 disabled:opacity-40">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <p className="text-xs font-bold text-slate-400">合計 {(totalUploadSize / 1024 / 1024).toFixed(1)}MB</p>
        </div>
      )}

      {uploading && <p className="mt-3 text-sm font-bold text-glacier">アップロード中... {uploadedCount}/{files.length}</p>}
      {!uploading && uploadedCount > 0 && <p className="mt-3 text-sm font-bold text-emerald-600">アップロード完了 {uploadedCount}件</p>}
      {error && <p className="mt-3 text-sm font-bold text-rose-500">{error}</p>}
    </div>
  );
});

export default PracticeVideoUploader;
