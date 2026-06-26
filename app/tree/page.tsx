"use client";

import PageHeader from "@/components/PageHeader";
import TrickSkillTree from "@/components/TrickSkillTree";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import { matchesTrickStance, type TrickStanceView } from "@/lib/trickStance";
import { useMemo, useState } from "react";

export default function TreePage() {
  const { user } = useAuth();
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [stanceView, setStanceView] = useState<TrickStanceView>("own");
  const tricks = storedTricks ?? initialTricks;
  const visibleTricks = useMemo(
    () => tricks.filter((trick) => matchesTrickStance(trick, user ? profile?.stance : "", stanceView)),
    [tricks, user, profile?.stance, stanceView],
  );

  return (
    <main className="min-w-0">
      <PageHeader title="技ツリー" eyebrow="TRICK SKILL TREE" back="/tricks" />
      <p className="mb-5 text-sm leading-6 text-slate-500">
        線でつながった前提技から順にたどって、次に練習する技を見つけましょう。
      </p>
      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button type="button" onClick={() => setStanceView("own")} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${stanceView === "own" ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}>
          自分のスタンス向け
        </button>
        <button type="button" onClick={() => setStanceView("all")} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${stanceView === "all" ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}>
          全スタンス
        </button>
      </div>
      <TrickSkillTree tricks={visibleTricks} showStatus={Boolean(user)} />
    </main>
  );
}
