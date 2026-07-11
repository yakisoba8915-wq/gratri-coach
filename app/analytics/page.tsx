"use client";

import { useState } from "react";
import GrowthAnalyticsDashboard from "@/components/GrowthAnalyticsDashboard";
import PageHeader from "@/components/PageHeader";
import SeasonModeToggle from "@/components/SeasonModeToggle";
import AuthButton from "@/components/AuthButton";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedTrickStance } from "@/hooks/useSelectedTrickStance";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { generateGrowthAnalyticsSummary } from "@/lib/analytics";
import { dataRepository } from "@/lib/storage";
import type { SeasonMode } from "@/lib/types";

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const [seasonMode, setSeasonMode] = useState<SeasonMode>("off_season");
  const [selectedStance] = useSelectedTrickStance();
  const [logs] = useSupabaseData(dataRepository.getLogs);
  const [tricks] = useSupabaseData(dataRepository.getAllTricks);
  const currentLogs = user ? (logs ?? []) : [];
  const currentTricks = tricks ?? [];
  const summary = generateGrowthAnalyticsSummary({ logs: currentLogs, tricks: currentTricks, seasonMode });

  if (loading) {
    return (
      <main>
        <PageHeader title="成長分析" eyebrow="ANALYTICS" back="/" />
        <div className="card py-12 text-center text-sm font-bold text-slate-400">読み込み中...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <PageHeader title="成長分析" eyebrow="ANALYTICS" back="/" />
        <div className="card py-12 text-center">
          <p className="text-sm font-bold text-slate-500">ログインすると成長分析を確認できます。</p>
          <div className="mt-5">
            <AuthButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeader title="成長分析" eyebrow="ANALYTICS" back="/" />
      <SeasonModeToggle value={seasonMode} onChange={setSeasonMode} />
      <GrowthAnalyticsDashboard summary={summary} selectedStance={selectedStance} />
    </main>
  );
}
