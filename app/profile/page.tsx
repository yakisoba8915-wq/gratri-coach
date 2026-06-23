"use client";

import Link from "next/link";
import { Camera, ChevronRight, ImagePlus, Save, Target, Trash2, Trees, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthButton from "@/components/AuthButton";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { dataRepository } from "@/lib/storage";
import { deleteAvatar, uploadAvatar } from "@/lib/avatarStorage";
import type { Profile, Stance } from "@/lib/types";

const acceptedAvatarTypes = ".jpg,.jpeg,.png,.webp";

export default function ProfilePage() {
  const { user } = useAuth();
  const [stored, refresh] = useSupabaseData(dataRepository.getProfile);
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const [storedLogs] = useSupabaseData(dataRepository.getLogs);
  const profile: Profile = user && stored ? stored : { displayName: "", stance: "", avatarUrl: null, avatarPath: null };

  const [displayName, setDisplayName] = useState("");
  const [stance, setStance] = useState<Stance | "">("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user && stored) {
      setDisplayName(stored.displayName);
      setStance(stored.stance);
    } else if (!user) {
      setDisplayName("");
      setStance("");
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [stored, user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const completed = user ? (storedTricks ?? []).filter((trick) => trick.masteryStatus === "完成").length : 0;
  const logCount = user ? (storedLogs ?? []).length : 0;
  const avatarUrl = avatarPreview ?? profile.avatarUrl ?? "";
  const initial = useMemo(() => (user ? (profile.displayName || user.email || "G").slice(0, 1).toUpperCase() : "—"), [profile.displayName, user]);

  async function save(): Promise<void> {
    if (!user || !displayName.trim() || !stance) return;
    await dataRepository.saveProfile({ ...profile, displayName: displayName.trim(), stance });
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function chooseAvatar(file: File | null): void {
    setAvatarError("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("画像サイズは最大5MBまでです。");
      return;
    }
    setAvatarFile(file);
  }

  async function uploadSelectedAvatar(): Promise<void> {
    if (!user) {
      setAvatarError("ログインするとプロフィール画像を設定できます");
      return;
    }
    if (!avatarFile) {
      setAvatarError("画像を選択してください。");
      return;
    }

    setAvatarUploading(true);
    setAvatarError("");
    try {
      const oldPath = profile.avatarPath;
      const uploaded = await uploadAvatar(avatarFile, user.id);
      await dataRepository.saveProfileAvatar(uploaded.url, uploaded.path);
      if (oldPath && oldPath !== uploaded.path) {
        await deleteAvatar(oldPath);
      }
      setAvatarFile(null);
      await refresh();
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "プロフィール画像のアップロードに失敗しました。");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function removeAvatar(): Promise<void> {
    if (!user || !profile.avatarPath) return;
    if (!window.confirm("プロフィール画像を削除しますか？")) return;

    setAvatarUploading(true);
    setAvatarError("");
    try {
      await deleteAvatar(profile.avatarPath);
      await dataRepository.saveProfileAvatar(null, null);
      setAvatarFile(null);
      await refresh();
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "プロフィール画像の削除に失敗しました。");
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <main>
      <PageHeader title="プロフィール" eyebrow="MY PAGE" />

      <div className="mb-5 flex items-center gap-4">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-200 to-blue-200 text-2xl font-black text-glacier">
          {avatarUrl ? <img src={avatarUrl} alt="プロフィール画像" className="h-full w-full object-cover" /> : user ? initial : <UserRound size={30} />}
          <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-white text-glacier shadow-card">
            <Camera size={14} />
          </span>
        </div>
        <div>
          <h2 className="min-h-7 text-xl font-black">{user ? profile.displayName : ""}</h2>
          <p className="mt-1 min-h-4 text-xs font-bold text-slate-400">{user && profile.stance ? `${profile.stance}スタンス` : ""}</p>
        </div>
      </div>

      <div className="mb-5 flex gap-3">
        <StatCard label="練習記録" value={logCount} suffix="件" />
        <StatCard label="完成トリック" value={completed} suffix="技" />
      </div>

      <section className="card mb-4 grid gap-4">
        <div>
          <h2 className="font-black">プロフィール画像</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">{user ? "jpg / jpeg / png / webp、最大5MB" : "ログインするとプロフィール画像を設定できます"}</p>
        </div>

        <label className={`grid place-items-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-bold ${user ? "cursor-pointer text-slate-500" : "text-slate-300"}`}>
          <ImagePlus className="mb-2 text-glacier" size={22} />
          画像を選択
          <input disabled={!user || avatarUploading} type="file" accept={acceptedAvatarTypes} className="hidden" onChange={(e) => chooseAvatar(e.target.files?.[0] ?? null)} />
        </label>

        {avatarFile && <p className="truncate rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">選択中: {avatarFile.name}</p>}
        {avatarUploading && <p className="text-sm font-bold text-glacier">アップロード中...</p>}
        {avatarError && <p className="text-sm font-bold text-rose-500">{avatarError}</p>}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={!user || !avatarFile || avatarUploading} onClick={uploadSelectedAvatar} className="btn-primary disabled:bg-slate-200 disabled:text-slate-400">
            アップロード
          </button>
          <button type="button" disabled={!user || !profile.avatarPath || avatarUploading} onClick={removeAvatar} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-500 disabled:bg-slate-100 disabled:text-slate-300">
            <Trash2 size={16} />
            削除
          </button>
        </div>
      </section>

      <section className="card mb-4 grid gap-4">
        <h2 className="font-black">基本情報</h2>
        <label className="text-sm font-bold">
          表示名
          <input disabled={!user} className="field mt-2 disabled:bg-slate-50" value={user ? displayName : ""} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className="text-sm font-bold">
          スタンス
          <select disabled={!user} className="field mt-2 disabled:bg-slate-50" value={user ? stance : ""} onChange={(e) => setStance(e.target.value as Stance | "")}>
            <option value="">未選択</option>
            <option>レギュラー</option>
            <option>グーフィー</option>
          </select>
        </label>
        <button disabled={!user || !displayName.trim() || !stance} onClick={save} className="btn-primary disabled:bg-slate-200 disabled:text-slate-400">
          <Save size={17} />
          {!user ? "ログイン後に保存できます" : saved ? "保存しました" : "プロフィールを保存"}
        </button>
      </section>

      <div className="card mb-4 !p-2">
        <Link href="/goals" className="flex items-center gap-3 rounded-2xl p-3">
          <Target className="text-violet-500" />
          <span className="flex-1 font-bold">目標管理</span>
          <ChevronRight className="text-slate-300" />
        </Link>
        <Link href="/tree" className="flex items-center gap-3 rounded-2xl p-3">
          <Trees className="text-emerald-500" />
          <span className="flex-1 font-bold">技ツリー</span>
          <ChevronRight className="text-slate-300" />
        </Link>
      </div>

      <AuthButton />
    </main>
  );
}
