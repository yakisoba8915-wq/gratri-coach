"use client";

import AIChat from "@/components/AIChat";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";

export default function AIChatPage() {
  const { user } = useAuth();
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [practiceLogs] = useSupabaseData(dataRepository.getLogs);
  const [goals] = useSupabaseData(dataRepository.getGoals);
  const [offTrainingPlan] = useSupabaseData(dataRepository.getOffTrainingPlan);
  const [tricks] = useSupabaseData(dataRepository.getTricks);

  return (
    <main>
      <PageHeader title="AIコーチ" eyebrow="AI CHAT" />
      <p className="mb-5 text-sm font-bold leading-7 text-slate-500">トリックのコツ、練習メニュー、シバカツ、オフトレについて相談できます。</p>
      <AIChat
        isLoggedIn={Boolean(user)}
        profile={user ? profile : undefined}
        practiceLogs={user ? (practiceLogs ?? []) : []}
        goals={user ? (goals ?? []) : []}
        offTrainingPlan={user ? (offTrainingPlan ?? null) : null}
        tricks={tricks ?? initialTricks}
      />
    </main>
  );
}
