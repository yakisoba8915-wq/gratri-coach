"use client";

import { Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { canManageTricks } from "@/lib/accessControl";
import { dataRepository } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { TrainingType, Trick, TrickAccessType, TrickStance } from "@/lib/types";

const snowCategories = ["プレス基礎", "弾き基礎", "180系", "乗り系", "360系", "弾き系発展", "プレス発展", "高難度", "プレス系", "オーリー系", "ノーリー系", "540系", "その他"] as const;
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

interface ApiError {
  error?: string;
}

interface EditTrickModalProps {
  open: boolean;
  trick: Trick | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

function clampDifficulty(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(10, Math.max(1, Math.trunc(value)));
}

export default function EditTrickModal({ open, trick, onClose, onUpdated }: EditTrickModalProps) {
  const { user } = useAuth();
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const canEdit = Boolean(user && canManageTricks(profile?.planType));
  const trickType: TrainingType = trick?.trickType ?? "snow";
  const isShibakatsu = trickType === "shibakatsu";

  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [category, setCategory] = useState<string>(snowCategories[0]);
  const [takeoffType, setTakeoffType] = useState<string>("なし");
  const [spinDirection, setSpinDirection] = useState<string>("なし");
  const [stance, setStance] = useState<TrickStance>("both");
  const [accessType, setAccessType] = useState<TrickAccessType>("premium");
  const [description, setDescription] = useState("");
  const [tips, setTips] = useState("");
  const [prerequisite, setPrerequisite] = useState("");
  const [relatedSnowTrick, setRelatedSnowTrick] = useState("");
  const [cautions, setCautions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = useMemo(() => (isShibakatsu ? shibakatsuCategories : snowCategories), [isShibakatsu]);

  useEffect(() => {
    if (!trick || !open) return;
    setName(trick.nameJa);
    setDifficulty(clampDifficulty(trick.difficulty));
    setCategory(trick.category || (isShibakatsu ? shibakatsuCategories[0] : snowCategories[0]));
    setTakeoffType(trick.takeoffType || "なし");
    setSpinDirection(trick.spinDirection || "なし");
    setStance(trick.stance ?? "both");
    setAccessType(trick.accessType ?? "premium");
    setDescription(trick.description ?? "");
    setTips(trick.howTo[0] ?? "");
    setPrerequisite(trick.prerequisiteText ?? "");
    setRelatedSnowTrick(trick.relatedSnowTrick ?? "");
    setCautions(trick.cautions ?? "");
    setError("");
  }, [isShibakatsu, open, trick]);

  if (!open || !trick) return null;

  function close(): void {
    if (submitting) return;
    setError("");
    onClose();
  }

  async function submit(): Promise<void> {
    if (!trick) return;
    const currentTrick = trick;
    if (!canEdit) {
      setError("編集権限がありません");
      return;
    }
    if (!name.trim()) {
      setError(isShibakatsu ? "メニュー名を入力してください。" : "技名を入力してください。");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const response = await fetch(`/api/tricks/${encodeURIComponent(currentTrick.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          difficulty: clampDifficulty(difficulty),
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
        }),
      });
      const result = (await response.json().catch(() => ({}))) as ApiError;
      if (!response.ok) throw new Error(result.error || "入力内容を確認してください。");

      await onUpdated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "トリックの更新に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-end bg-navy/45 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="edit-trick-title">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-trick-title" className="text-xl font-black">{isShibakatsu ? "シバカツトリックを編集" : "トリックを編集"}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Admin / Editorのみ編集できます。保存内容はトリック一覧・詳細に反映されます。</p>
          </div>
          <button type="button" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500" aria-label="閉じる">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="text-sm font-bold">
            {isShibakatsu ? "メニュー名" : "技名"} <span className="text-rose-500">*</span>
            <input autoFocus className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="text-sm font-bold">
            難易度 1〜10
            <input type="number" min={1} max={10} className="field mt-2" value={difficulty} onChange={(event) => setDifficulty(clampDifficulty(Number(event.target.value)))} />
          </label>

          <label className="text-sm font-bold">
            系統
            <select className="field mt-2" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categoryOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="text-sm font-bold">
            対応スタンス
            <select className="field mt-2" value={stance} onChange={(event) => setStance(event.target.value as TrickStance)}>
              {stanceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>

          <label className="text-sm font-bold">
            公開範囲
            <select className="field mt-2" value={accessType} onChange={(event) => setAccessType(event.target.value as TrickAccessType)}>
              {accessOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>

          {isShibakatsu ? (
            <>
              <label className="text-sm font-bold">
                関連雪上トリック
                <input className="field mt-2" value={relatedSnowTrick} onChange={(event) => setRelatedSnowTrick(event.target.value)} placeholder="例：オーリー、BS180" />
              </label>
              <label className="text-sm font-bold">説明<textarea rows={3} className="field mt-2 resize-none" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <label className="text-sm font-bold">練習のコツ<textarea rows={3} className="field mt-2 resize-none" value={tips} onChange={(event) => setTips(event.target.value)} /></label>
              <label className="text-sm font-bold">注意点<textarea rows={3} className="field mt-2 resize-none" value={cautions} onChange={(event) => setCautions(event.target.value)} /></label>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-bold">
                  弾き元
                  <select className="field mt-2" value={takeoffType} onChange={(event) => setTakeoffType(event.target.value)}>
                    {takeoffTypes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  回転方向
                  <select className="field mt-2" value={spinDirection} onChange={(event) => setSpinDirection(event.target.value)}>
                    {spinDirections.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <label className="text-sm font-bold">説明<textarea rows={3} className="field mt-2 resize-none" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <label className="text-sm font-bold">練習のコツ<textarea rows={3} className="field mt-2 resize-none" value={tips} onChange={(event) => setTips(event.target.value)} /></label>
              <label className="text-sm font-bold">
                前提技
                <input className="field mt-2" value={prerequisite} onChange={(event) => setPrerequisite(event.target.value)} placeholder="例：オーリー、オーリーFS180" />
              </label>
            </>
          )}

          {!canEdit && <p className="rounded-2xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-600">編集権限がありません</p>}
        </div>

        {error && <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-600">{error}</p>}
        <button type="button" disabled={!canEdit || submitting || !name.trim()} onClick={submit} className="btn-primary mt-6 w-full py-4 disabled:bg-slate-200 disabled:text-slate-400">
          <Save size={18} />
          {submitting ? "更新中..." : "トリックを更新する"}
        </button>
      </div>
    </div>
  );
}
