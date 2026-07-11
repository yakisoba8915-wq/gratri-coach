"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PracticeLogCard from "@/components/PracticeLogCard";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedTrickStance } from "@/hooks/useSelectedTrickStance";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { dataRepository } from "@/lib/storage";
import { canUseTrick } from "@/lib/accessControl";
import { formatTrickName } from "@/lib/trickDisplay";
import type { TrainingType } from "@/lib/types";

type TrainingTypeFilter = "all" | TrainingType;

const filterFieldClass =
  "field h-12 min-w-0 w-full max-w-full box-border appearance-none border border-slate-200 bg-white";

export default function PracticePage() {
  const { user } = useAuth();
  const [storedLogs] = useSupabaseData(dataRepository.getLogs);
  const [storedTricks] = useSupabaseData(dataRepository.getAllTricks);
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [selectedStance] = useSelectedTrickStance();
  const logs = user ? (storedLogs ?? []) : [];
  const tricks = storedTricks ?? [];
  const planType = user ? profile?.planType ?? "free" : "free";
  const selectableTricks = tricks.filter((trick) => canUseTrick(trick, planType));
  const [trickId, setTrickId] = useState("all");
  const [date, setDate] = useState("");
  const [trainingType, setTrainingType] = useState<TrainingTypeFilter>("all");

  const filtered = useMemo(
    () =>
      logs.filter(
        (log) =>
          (trickId === "all" || log.trickId === trickId) &&
          (!date || log.date === date) &&
          (trainingType === "all" || (log.trainingType ?? "snow") === trainingType),
      ),
    [logs, trickId, date, trainingType],
  );

  return (
    <main>
      <div className="flex items-start justify-between">
        <PageHeader title="練習記録" eyebrow="PRACTICE LOG" />
        {user ? (
          <Link href="/practice/new" className="btn-primary !p-3" aria-label="練習記録追加">
            <Plus />
          </Link>
        ) : (
          <Link href="/profile" className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400">
            ログイン
          </Link>
        )}
      </div>

      {user && (
        <div className="card mb-4 flex w-full max-w-full flex-col gap-3 overflow-visible !p-4 !pb-5">
          <label className="relative block min-w-0 w-full max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              aria-label="技名で絞り込み"
              className={`${filterFieldClass} pl-9`}
              value={trickId}
              onChange={(event) => setTrickId(event.target.value)}
            >
              <option value="all">すべての技</option>
              {selectableTricks.map((trick) => (
                <option key={trick.id} value={trick.id}>
                  {formatTrickName(trick.nameJa, selectedStance)}
                </option>
              ))}
            </select>
          </label>

          <select
            aria-label="練習タイプで絞り込み"
            className={filterFieldClass}
            value={trainingType}
            onChange={(event) => setTrainingType(event.target.value as TrainingTypeFilter)}
          >
            <option value="all">すべて</option>
            <option value="snow">ゲレンデ</option>
            <option value="shibakatsu">シバカツ</option>
          </select>

          <input
            aria-label="日付で絞り込み"
            type="date"
            className={filterFieldClass}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((log) => (
          <PracticeLogCard key={log.id} log={log} trick={tricks.find((trick) => trick.id === log.trickId)} selectedStance={selectedStance} />
        ))}
        {filtered.length === 0 && (
          <div className="card py-12 text-center text-sm text-slate-400">
            {user ? "記録がありません" : "ログインすると練習を記録できます"}
          </div>
        )}
      </div>
    </main>
  );
}
