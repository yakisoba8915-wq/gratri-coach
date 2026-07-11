"use client";

import Link from "next/link";
import { Clock, Dumbbell, Footprints, Sparkles } from "lucide-react";
import { useState } from "react";
import OffTrainingDiagnosisModal from "@/components/OffTrainingDiagnosisModal";
import OffTrainingPlanView from "@/components/OffTrainingPlanView";
import PageHeader from "@/components/PageHeader";
import SectionTitle from "@/components/SectionTitle";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedTrickStance } from "@/hooks/useSelectedTrickStance";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { generateOffTrainingPlan } from "@/lib/shibakatsuPlan";
import { trainings } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import { formatTrickName } from "@/lib/trickDisplay";
import type { OffTrainingPreferences, TrainingCategory } from "@/lib/types";

const categories: { name: TrainingCategory; icon: typeof Dumbbell; color: string }[] = [
  { name: "シバカツ" as TrainingCategory, icon: Footprints, color: "text-sky-500" },
  { name: "筋トレ" as TrainingCategory, icon: Dumbbell, color: "text-orange-500" },
  { name: "柔軟" as TrainingCategory, icon: Sparkles, color: "text-emerald-500" },
];

export default function TrainingPage() {
  const { user, loading } = useAuth();
  const [plan, refresh] = useSupabaseData(dataRepository.getOffTrainingPlan);
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [selectedStance] = useSelectedTrickStance();
  const [rebuilding, setRebuilding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [diagnosisDismissed, setDiagnosisDismissed] = useState(false);
  const tricks = storedTricks ?? [];
  const showDiagnosis = Boolean(user && plan !== undefined && !diagnosisDismissed && (plan === null || rebuilding));

  async function complete(preferences: OffTrainingPreferences) {
    if (!user) throw new Error("ログインが必要です");
    const next = await generateOffTrainingPlan(preferences, user.id, profile?.planType ?? "free");
    await dataRepository.saveOffTrainingPlan(preferences, next);
    const saved = await dataRepository.getOffTrainingPlan();
    if (!saved) throw new Error("プランを保存できませんでした。SQL設定を確認してください。");
    await refresh();
    setRebuilding(false);
    setDiagnosisDismissed(false);
  }

  function startRebuild() {
    setConfirming(false);
    setDiagnosisDismissed(false);
    setRebuilding(true);
  }

  function closeDiagnosis() {
    setRebuilding(false);
    setDiagnosisDismissed(true);
  }

  return (
    <main>
      <PageHeader title="オフトレ" eyebrow="OFF-SNOW TRAINING" />

      {!loading && !user && (
        <div className="card mb-7 py-10 text-center">
          <p className="text-sm text-slate-500">ログインすると、あなた専用のオフトレプランを作成できます。</p>
          <Link href="/profile" className="btn-primary mt-4">Googleでログイン</Link>
        </div>
      )}

      {user && plan && <OffTrainingPlanView plan={plan} onRebuild={() => setConfirming(true)} selectedStance={selectedStance} />}
      {showDiagnosis && <OffTrainingDiagnosisModal onComplete={complete} onClose={closeDiagnosis} />}

      {confirming && (
        <div className="fixed inset-0 z-[85] grid place-items-center bg-navy/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="rebuild-confirm-title">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 id="rebuild-confirm-title" className="text-lg font-black">もう一度診断しますか？</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">現在のオフトレプランを作り直します。よろしいですか？</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirming(false)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">キャンセル</button>
              <button onClick={startRebuild} className="btn-primary">作り直す</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-7">
        {categories.map(({ name, icon: Icon, color }) => (
          <section key={name}>
            <SectionTitle title={name} />
            <div className="space-y-3">
              {trainings.filter((training) => training.category === name).map((training) => (
                <article key={training.id} className="card">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50">
                      <Icon className={color} size={21} />
                    </div>
                    <div>
                      <h3 className="font-black">{training.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{training.description}</p>
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400"><Clock size={12} />{training.minutes}分</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {training.relatedTrickIds.map((id) => {
                      const trick = tricks.find((item) => item.id === id);
                      return trick ? (
                        <Link key={id} href={`/tricks/${trick.id}?stance=${selectedStance}`} className="rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold text-glacier">
                          {formatTrickName(trick.nameJa, selectedStance)}
                        </Link>
                      ) : null;
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
