"use client";

import PageHeader from "@/components/PageHeader";
import TrickSkillTree from "@/components/TrickSkillTree";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";

export default function TreePage() {
  const { user } = useAuth();
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const tricks = storedTricks ?? initialTricks;

  return (
    <main className="min-w-0">
      <PageHeader title="技ツリー" eyebrow="TRICK SKILL TREE" back="/tricks" />
      <p className="mb-5 text-sm leading-6 text-slate-500">
        線でつながった前提技から順にたどって、次に練習する技を見つけましょう。
      </p>
      <TrickSkillTree tricks={tricks} showStatus={Boolean(user)} />
    </main>
  );
}
