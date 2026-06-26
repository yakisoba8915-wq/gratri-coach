"use client";

import PageHeader from "@/components/PageHeader";
import TrickSkillTree from "@/components/TrickSkillTree";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import { profileStanceToSelectedStance, type SelectedTrickDisplayStance } from "@/lib/trickStance";
import { useEffect, useState } from "react";

export default function TreePage() {
  const { user, loading } = useAuth();
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [selectedStance, setSelectedStance] = useState<SelectedTrickDisplayStance>("regular");
  const [stanceInitialized, setStanceInitialized] = useState(false);
  const tricks = storedTricks ?? initialTricks;

  useEffect(() => {
    if (stanceInitialized) return;
    if (loading) return;
    if (!user) {
      setSelectedStance("regular");
      setStanceInitialized(true);
      return;
    }
    if (profile) {
      setSelectedStance(profileStanceToSelectedStance(profile.stance));
      setStanceInitialized(true);
    }
  }, [loading, profile, stanceInitialized, user]);

  return (
    <main className="min-w-0">
      <PageHeader title="技ツリー" eyebrow="TRICK SKILL TREE" back="/tricks" />
      <p className="mb-5 text-sm leading-6 text-slate-500">
        線でつながった前提技から順にたどって、次に練習する技を見つけましょう。
      </p>
      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button type="button" onClick={() => setSelectedStance("regular")} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${selectedStance === "regular" ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}>
          レギュラー
        </button>
        <button type="button" onClick={() => setSelectedStance("goofy")} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${selectedStance === "goofy" ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}>
          グーフィー
        </button>
      </div>
      <TrickSkillTree tricks={tricks} showStatus={Boolean(user)} selectedStance={selectedStance} />
    </main>
  );
}
