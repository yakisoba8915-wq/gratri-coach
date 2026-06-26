"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { TrainingType, TrickAccessType, TrickStance } from "@/lib/types";

const snowCategories = ["プレス系", "オーリー系", "ノーリー系", "乗り系", "180系", "360系", "540系", "その他"] as const;
const shibakatsuCategories = ["プレス練習", "弾き練習", "回転練習", "バランス練習", "乗り練習", "連続動作", "その他"] as const;
const takeoffTypes = ["なし", "オーリー", "ノーリー", "プレス", "乗り", "その他"] as const;
const spinDirections = ["なし", "FS", "BS"] as const;
const stanceOptions: { value: TrickStance; label: string }[] = [
  { value: "both", label: "両方" },
  { value: "regular", label: "レギュラー" },
  { value: "goofy", label: "グーフィー" },
];
const accessOptions: { value: TrickAccessType; label: string }[] = [
  { value: "premium", label: "Premium限定" },
  { value: "free", label: "無料公開" },
];

interface AddTrickModalProps {
  open: boolean;
  trickType?: TrainingType;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

interface ApiError {
  error?: string;
}

export default function AddTrickModal({ open, trickType = "snow", onClose, onCreated }: AddTrickModalProps) {
  const isShibakatsu = trickType === "shibakatsu";
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [category, setCategory] = useState<string>(snowCategories[0]);
  const [takeoffType, setTakeoffType] = useState<(typeof takeoffTypes)[number]>("なし");
  const [spinDirection, setSpinDirection] = useState<(typeof spinDirections)[number]>("なし");
  const [stance, setStance] = useState<TrickStance>("both");
  const [accessType, setAccessType] = useState<TrickAccessType>("premium");
  const [description, setDescription] = useState("");
  const [tips, setTips] = useState("");
  const [prerequisite, setPrerequisite] = useState("");
  const [relatedSnowTrick, setRelatedSnowTrick] = useState("");
  const [cautions, setCautions] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCategory(isShibakatsu ? shibakatsuCategories[0] : snowCategories[0]);
  }, [isShibakatsu]);

  if (!open) return null;

  function reset(): void {
    setName("");
    setDifficulty(1);
    setCategory(isShibakatsu ? shibakatsuCategories[0] : snowCategories[0]);
    setTakeoffType("なし");
    setSpinDirection("なし");
    setStance("both");
    setAccessType("premium");
    setDescription("");
    setTips("");
    setPrerequisite("");
    setRelatedSnowTrick("");
    setCautions("");
    setPassword("");
    setError("");
  }

  function close(): void {
    if (submitting) return;
    setPassword("");
    setError("");
    onClose();
  }

  async function submit(): Promise<void> {
    if (!name.trim() || !password) {
      setError(`${isShibakatsu ? "メニュー名" : "技名"}と管理パスワードを入力してください。`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const response = await fetch("/api/tricks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          name,
          difficulty,
          category,
          takeoffType,
          spinDirection,
          description,
          tips,
          prerequisite,
          trickType,
          stance,
          accessType,
          relatedSnowTrick,
          cautions,
          password,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as ApiError;
      if (!response.ok) throw new Error(result.error || "入力内容を確認してください。");

      reset();
      await onCreated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "技の追加に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = isShibakatsu ? shibakatsuCategories : snowCategories;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-end bg-navy/45 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="add-trick-title">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-trick-title" className="text-xl font-black">{isShibakatsu ? "シバカツ技を追加" : "技を追加"}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">辞典の品質維持のため、管理パスワードが必要です。</p>
          </div>
          <button type="button" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500" aria-label="閉じる">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="text-sm font-bold">{isShibakatsu ? "メニュー名 / 技名" : "技名"} <span className="text-rose-500">*</span><input autoFocus className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="text-sm font-bold">難易度 1〜10<input type="number" min={1} max={10} className="field mt-2" value={difficulty} onChange={(event) => setDifficulty(Number(event.target.value))} /></label>
          <label className="text-sm font-bold">系統<select className="field mt-2" value={category} onChange={(event) => setCategory(event.target.value)}>{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-bold">対応スタンス<select className="field mt-2" value={stance} onChange={(event) => setStance(event.target.value as TrickStance)}>{stanceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="text-sm font-bold">公開範囲<select className="field mt-2" value={accessType} onChange={(event) => setAccessType(event.target.value as TrickAccessType)}>{accessOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>

          {isShibakatsu ? (
            <>
              <label className="text-sm font-bold">関連する雪上トリック<input className="field mt-2" value={relatedSnowTrick} onChange={(event) => setRelatedSnowTrick(event.target.value)} placeholder="例：オーリー、BS180" /></label>
              <label className="text-sm font-bold">説明<textarea rows={3} className="field mt-2 resize-none" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <label className="text-sm font-bold">練習のコツ<textarea rows={3} className="field mt-2 resize-none" value={tips} onChange={(event) => setTips(event.target.value)} /></label>
              <label className="text-sm font-bold">注意点<textarea rows={3} className="field mt-2 resize-none" value={cautions} onChange={(event) => setCautions(event.target.value)} /></label>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-bold">弾き元<select className="field mt-2" value={takeoffType} onChange={(event) => setTakeoffType(event.target.value as (typeof takeoffTypes)[number])}>{takeoffTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="text-sm font-bold">回転方向<select className="field mt-2" value={spinDirection} onChange={(event) => setSpinDirection(event.target.value as (typeof spinDirections)[number])}>{spinDirections.map((item) => <option key={item}>{item}</option>)}</select></label>
              </div>
              <label className="text-sm font-bold">説明<textarea rows={3} className="field mt-2 resize-none" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <label className="text-sm font-bold">練習のコツ<textarea rows={3} className="field mt-2 resize-none" value={tips} onChange={(event) => setTips(event.target.value)} /></label>
              <label className="text-sm font-bold">前提技<input className="field mt-2" value={prerequisite} onChange={(event) => setPrerequisite(event.target.value)} placeholder="例：オーリー、オーリーFS180" /></label>
            </>
          )}

          <label className="text-sm font-bold">管理パスワード <span className="text-rose-500">*</span><input type="password" autoComplete="off" className="field mt-2" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        </div>

        {error && <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-600">{error}</p>}
        <button type="button" disabled={submitting || !name.trim() || !password} onClick={submit} className="btn-primary mt-6 w-full py-4 disabled:bg-slate-200 disabled:text-slate-400">
          <Plus size={18} />
          {submitting ? "追加中..." : isShibakatsu ? "シバカツ技を追加する" : "技を追加する"}
        </button>
      </div>
    </div>
  );
}
