"use client";

import Link from "next/link";
import { ArrowRight, CalendarPlus, Flame, MountainSnow, Target } from "lucide-react";
import AIAdviceCard from "@/components/AIAdviceCard";
import SectionTitle from "@/components/SectionTitle";
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

export default function HomePage() {
  const { user } = useAuth();
  const [selectedStance] = useSelectedTrickStance();
  const [tricks] = useSupabaseData(dataRepository.getTricks);
  const [logs] = useSupabaseData(dataRepository.getLogs);
  const [goals] = useSupabaseData(dataRepository.getGoals);
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [offTrainingPlan] = useSupabaseData(dataRepository.getOffTrainingPlan);
  const [practiceVideos] = useSupabaseData(getPracticeVideosForCurrentUser);
  const currentTricks = tricks ?? initialTricks;
  const planType = user ? profile?.planType ?? "free" : "free";
  const usableTricks = currentTricks.filter((trick) => canUseTrick(trick, planType));
  const currentLogs = user ? (logs ?? []) : [];
  const currentVideos = user ? (practiceVideos ?? []) : [];
  const recommendations = user ? getRecommendations(usableTricks, currentLogs) : [];
  const trending = user ? getTrendingTrick(usableTricks, currentLogs) : undefined;
  const advice = user ? generateAdvice({ tricks: usableTricks, logs: currentLogs, videos: currentVideos, offTrainingPlan }) : undefined;
  const nextTask = currentLogs[0]?.nextTask;

  return (
    <main>
      <header className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[.18em] text-glacier">GRATRI COACH</p>
          <h1 className="mt-1 text-2xl font-black">今日も、一本ずつ。</h1>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-card">
          <MountainSnow className="text-glacier" />
        </div>
      </header>

      <Link href={user ? "/practice/new" : "/profile"} className="mb-8 flex items-center justify-between overflow-hidden rounded-3xl bg-navy p-5 text-white shadow-xl shadow-navy/15">
        <div>
          <p className="text-xs font-bold text-cyan-200">QUICK START</p>
          <h2 className="mt-1 text-xl font-black">{user ? "練習を記録する" : "ログインして記録する"}</h2>
          <p className="mt-1 text-xs text-white/60">{user ? "日付と技名だけでもOK" : "Googleログインが必要です"}</p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
          <CalendarPlus size={28} />
        </div>
      </Link>

      {advice && <AIAdviceCard advice={advice} tricks={usableTricks} logs={currentLogs} videos={currentVideos} goals={goals ?? []} profile={profile} offTrainingPlan={offTrainingPlan} selectedStance={selectedStance} />}

      <section className="mb-8">
        <SectionTitle title="今日のおすすめ" subtitle="いま伸ばしたい3トリック" href="/tricks" />
        <div className="space-y-2">
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
          {!user && <div className="card py-8 text-center text-sm text-slate-400">ログインするとおすすめ練習が表示されます</div>}
          {user && recommendations.length === 0 && <div className="card py-8 text-center text-sm text-slate-400">練習記録が増えるとおすすめが表示されます</div>}
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <Link href={trending ? `/tricks/${trending.id}?stance=${selectedStance}` : user ? "/tricks" : "/profile"} className="card">
          <Flame size={20} className="mb-3 text-orange-500" />
          <p className="text-xs font-bold text-slate-400">最近伸びている技</p>
          <p className="mt-1 font-black">{trending ? formatTrickName(trending.nameJa, selectedStance) : "—"}</p>
        </Link>
        <Link href={user ? "/goals" : "/profile"} className="card">
          <Target size={20} className="mb-3 text-violet-500" />
          <p className="text-xs font-bold text-slate-400">次回課題</p>
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
