"use client";

import Link from "next/link";
import { ArrowRight, CalendarPlus, Flame, MountainSnow, Target } from "lucide-react";
import { useEffect, useState } from "react";
import AIAdviceCard from "@/components/AIAdviceCard";
import GrowthAnalyticsCard from "@/components/GrowthAnalyticsCard";
import LandingPage from "@/components/LandingPage";
import SectionTitle from "@/components/SectionTitle";
import SeasonModeToggle from "@/components/SeasonModeToggle";
import TrickCard from "@/components/TrickCard";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedTrickStance } from "@/hooks/useSelectedTrickStance";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { generateAdvice } from "@/lib/aiAdvisor";
import { canUseTrick } from "@/lib/accessControl";
import { formatTrickName } from "@/lib/trickDisplay";
import { initialTricks } from "@/lib/mockData";
import { getRecommendations, getTrendingTrick } from "@/lib/recommendations";
import { dataRepository } from "@/lib/storage";
import { getPracticeVideosForCurrentUser } from "@/lib/videoStorage";
import type { SeasonMode } from "@/lib/types";

const GUEST_MODE_KEY = "gratri_guest_mode";
const TUTORIAL_SEEN_KEY = "gratri_onboarding_seen";
const LOGIN_DISMISSED_KEY = "gratri-login-prompt-dismissed";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [guestMode, setGuestMode] = useState(false);
  const [guestChecked, setGuestChecked] = useState(false);
  const [seasonMode, setSeasonMode] = useState<SeasonMode>("off_season");
  const [selectedStance] = useSelectedTrickStance();
  const [tricks] = useSupabaseData(dataRepository.getTricks);
  const [allTricks] = useSupabaseData(dataRepository.getAllTricks);
  const [logs] = useSupabaseData(dataRepository.getLogs);
  const [goals] = useSupabaseData(dataRepository.getGoals);
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [offTrainingPlan] = useSupabaseData(dataRepository.getOffTrainingPlan);
  const [practiceVideos] = useSupabaseData(getPracticeVideosForCurrentUser);
  const currentTricks = tricks ?? initialTricks;
  const analyticsTricks = allTricks ?? currentTricks;
  const planType = user ? profile?.planType ?? "free" : "free";
  const usableTricks = currentTricks.filter((trick) => canUseTrick(trick, planType));
  const currentLogs = user ? (logs ?? []) : [];
  const currentVideos = user ? (practiceVideos ?? []) : [];
  const recommendations = user ? getRecommendations(usableTricks, currentLogs) : [];
  const trending = user ? getTrendingTrick(usableTricks, currentLogs) : undefined;
  const advice = user ? generateAdvice({ tricks: usableTricks, logs: currentLogs, videos: currentVideos, offTrainingPlan }) : undefined;
  const nextTask = currentLogs[0]?.nextTask;
  const isInSeason = seasonMode === "in_season";
  const quickStartHref = user ? (isInSeason ? "/practice/new" : "/training") : "/profile";
  const quickStartTitle = user ? (isInSeason ? "練習を記録する" : "今日のオフトレを確認する") : "ログインして記録する";
  const quickStartDescription = user
    ? isInSeason
      ? "ゲレンデ練習と動画アップロードへ"
      : "シバカツ・筋トレ＋柔軟の予定をチェック"
    : "Googleログインが必要です";
  const recommendationTitle = isInSeason ? "今日の練習記録" : "今日のオフトレ予定";
  const recommendationSubtitle = isInSeason ? "雪上で意識したい3トリック" : "シバカツ / 筋トレ＋柔軟の確認";
  const trendingLabel = isInSeason ? "最近のゲレンデ練習" : "シバカツ練習メニュー";
  const nextTaskLabel = isInSeason ? "次回の雪上課題" : "次回のシバカツ課題";
  const modeFocusItems = isInSeason
    ? ["今日の練習記録", "最近のゲレンデ練習", "AI練習アドバイス", "動画アップロード導線"]
    : ["今日のオフトレ予定", "シバカツ練習メニュー", "筋トレ＋柔軟予定", "オフトレ診断/週間プラン"];

  useEffect(() => {
    setGuestMode(localStorage.getItem(GUEST_MODE_KEY) === "true");
    setGuestChecked(true);
  }, []);

  function startGuestMode(): void {
    localStorage.setItem(GUEST_MODE_KEY, "true");
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    sessionStorage.setItem(LOGIN_DISMISSED_KEY, "true");
    setGuestMode(true);
    window.dispatchEvent(new Event("gratri-storage"));
  }

  if (loading || !guestChecked) {
    return <main><div className="card py-12 text-center text-sm font-bold text-slate-400">読み込み中...</div></main>;
  }

  if (!user && !guestMode) {
    return <LandingPage onGuestStart={startGuestMode} />;
  }

  return (
    <main>
      <SeasonModeToggle value={seasonMode} onChange={setSeasonMode} />

      <header className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[.18em] text-glacier">GRATRI COACH</p>
          <h1 className="mt-1 text-2xl font-black">今日も、一本ずつ。</h1>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-card">
          <MountainSnow className="text-glacier" />
        </div>
      </header>

      <section className="mb-5 rounded-3xl border border-white/80 bg-white p-4 shadow-card">
        <p className="text-xs font-black tracking-[.16em] text-glacier">{isInSeason ? "IN SEASON" : "OFF SEASON"}</p>
        <h2 className="mt-1 text-lg font-black">{isInSeason ? "雪上練習を中心に確認" : "オフトレとシバカツを中心に確認"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {modeFocusItems.map((item) => (
            <span key={item} className="rounded-full bg-ice px-3 py-1 text-[11px] font-bold text-glacier">
              {item}
            </span>
          ))}
        </div>
      </section>

      <Link href={quickStartHref} className="mb-8 flex items-center justify-between overflow-hidden rounded-3xl bg-navy p-5 text-white shadow-xl shadow-navy/15">
        <div>
          <p className="text-xs font-bold text-cyan-200">QUICK START</p>
          <h2 className="mt-1 text-xl font-black">{quickStartTitle}</h2>
          <p className="mt-1 text-xs text-white/60">{quickStartDescription}</p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
          <CalendarPlus size={28} />
        </div>
      </Link>

      {advice && <AIAdviceCard advice={advice} tricks={usableTricks} logs={currentLogs} videos={currentVideos} goals={goals ?? []} profile={profile} offTrainingPlan={offTrainingPlan} selectedStance={selectedStance} />}

      <GrowthAnalyticsCard isLoggedIn={Boolean(user)} logs={currentLogs} tricks={analyticsTricks} seasonMode={seasonMode} selectedStance={selectedStance} />

      <section className="mb-8">
        <SectionTitle title={recommendationTitle} subtitle={recommendationSubtitle} href={isInSeason ? "/tricks" : "/training"} />
        <div className="space-y-2">
          {!isInSeason && user && (
            <Link href="/training" className="card flex items-center justify-between gap-3 !rounded-2xl !p-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400">オフトレ診断 / 週間プラン</p>
                <p className="mt-1 truncate font-black">{offTrainingPlan?.title ?? "あなた専用の週間プランを確認"}</p>
                <p className="mt-1 text-xs text-slate-400">シバカツの日と筋トレ＋柔軟の日をチェック</p>
              </div>
              <ArrowRight size={17} className="shrink-0 text-slate-300" />
            </Link>
          )}
          {recommendations.map(({ trick, reason }, index) => (
            <Link key={trick.id} href={`/tricks/${trick.id}?stance=${selectedStance}`} className="card flex items-center gap-3 !rounded-2xl !p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ice text-sm font-black text-glacier">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black">{formatTrickName(trick.nameJa, selectedStance)}</p>
                <p className="text-xs text-slate-400">{reason}</p>
              </div>
              <ArrowRight size={17} className="text-slate-300" />
            </Link>
          ))}
          {!user && <div className="card py-8 text-center text-sm text-slate-400">{isInSeason ? "ログインするとおすすめ練習が表示されます" : "ログインすると今日のオフトレ予定が表示されます"}</div>}
          {user && recommendations.length === 0 && <div className="card py-8 text-center text-sm text-slate-400">練習記録が増えるとおすすめが表示されます</div>}
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <Link href={trending ? `/tricks/${trending.id}?stance=${selectedStance}` : user ? "/tricks" : "/profile"} className="card">
          <Flame size={20} className="mb-3 text-orange-500" />
          <p className="text-xs font-bold text-slate-400">{trendingLabel}</p>
          <p className="mt-1 font-black">{trending ? formatTrickName(trending.nameJa, selectedStance) : "—"}</p>
        </Link>
        <Link href={user ? "/goals" : "/profile"} className="card">
          <Target size={20} className="mb-3 text-violet-500" />
          <p className="text-xs font-bold text-slate-400">{nextTaskLabel}</p>
          <p className="mt-1 line-clamp-2 text-sm font-black">{nextTask || "—"}</p>
        </Link>
      </div>

      {trending && (
        <section>
          <SectionTitle title="ピックアップ" />
          <TrickCard trick={trending} selectedStance={selectedStance} canUse={canUseTrick(trending, planType)} />
        </section>
      )}
    </main>
  );
}
