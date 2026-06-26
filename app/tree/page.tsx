"use client";

import PageHeader from "@/components/PageHeader";
import TrickSkillTree from "@/components/TrickSkillTree";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedTrickStance } from "@/hooks/useSelectedTrickStance";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";

export default function TreePage() {
  const { user } = useAuth();
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [selectedStance, setSelectedStance] = useSelectedTrickStance();
  const tricks = storedTricks ?? initialTricks;
  const planType = user ? profile?.planType ?? "free" : "free";

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
      <TrickSkillTree tricks={tricks} showStatus={Boolean(user)} selectedStance={selectedStance} planType={planType} />
    </main>
  );
}
