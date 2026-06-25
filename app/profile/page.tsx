"use client";

import Link from "next/link";
import { Camera, ChevronRight, Save, Target, Trash2, Trees, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthButton from "@/components/AuthButton";
import FeedbackSection from "@/components/FeedbackSection";
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

      <section className="card mb-5 !p-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-visible">
            <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-200 to-blue-200 text-2xl font-black text-glacier">
              {avatarUrl ? <img src={avatarUrl} alt="プロフィール画像" className="h-full w-full object-cover" /> : user ? initial : <UserRound size={30} />}
            </div>
            <label
              className={`absolute -bottom-1 -right-1 z-20 grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-95 ${
                user && !avatarUploading ? "cursor-pointer" : "pointer-events-none opacity-50"
              }`}
              aria-label={profile.avatarPath ? "プロフィール画像を変更" : "プロフィール画像を追加"}
              title={profile.avatarPath ? "プロフィール画像を変更" : "プロフィール画像を追加"}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-white text-glacier shadow-md sm:h-9 sm:w-9">
                <Camera className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" strokeWidth={2.3} />
              </span>
              <input
                disabled={!user || avatarUploading}
                type="file"
                accept={acceptedAvatarTypes}
                className="hidden"
                onChange={(event) => chooseAvatar(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-black">{user ? profile.displayName : ""}</h2>
            <p className="mt-0.5 min-h-4 text-xs font-bold text-slate-400">{user && profile.stance ? `${profile.stance}スタンス` : ""}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-400">{user ? "jpg / jpeg / png / webp・最大5MB" : "ログインするとプロフィール画像を設定できます"}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-ice px-3 py-2 text-xs font-black text-glacier ${user && !avatarUploading ? "cursor-pointer" : "pointer-events-none opacity-40"}`}>
            <Camera size={14} />
            {profile.avatarPath ? "画像を変更" : "画像を追加"}
            <input disabled={!user || avatarUploading} type="file" accept={acceptedAvatarTypes} className="hidden" onChange={(event) => chooseAvatar(event.target.files?.[0] ?? null)} />
          </label>

          {avatarFile && (
            <button type="button" disabled={avatarUploading} onClick={uploadSelectedAvatar} className="inline-flex items-center justify-center rounded-xl bg-navy px-3 py-2 text-xs font-black text-white disabled:opacity-40">
              {avatarUploading ? "アップロード中..." : "アップロード"}
            </button>
          )}

          {profile.avatarPath && (
            <button type="button" disabled={!user || avatarUploading} onClick={removeAvatar} className="inline-flex items-center gap-1 px-2 py-2 text-xs font-bold text-rose-500 disabled:opacity-40">
              <Trash2 size={13} />
              削除
            </button>
          )}
        </div>

        {avatarFile && <p className="mt-2 min-w-0 truncate text-[11px] font-bold text-slate-400">選択中: {avatarFile.name}</p>}
        {avatarError && <p className="mt-2 text-xs font-bold text-rose-500">{avatarError}</p>}
      </section>

      <div className="mb-5 flex gap-3">
        <StatCard label="練習記録" value={logCount} suffix="件" />
        <StatCard label="完成トリック" value={completed} suffix="技" />
      </div>

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

      <FeedbackSection isLoggedIn={Boolean(user)} />
      <AuthButton />
    </main>
  );
}
