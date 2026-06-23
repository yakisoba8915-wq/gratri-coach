"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import PracticeLogCard from "@/components/PracticeLogCard";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import type { TrainingType } from "@/lib/types";

type TrainingTypeFilter = "all" | TrainingType;

export default function PracticePage() {
  const { user } = useAuth();
  const [storedLogs] = useSupabaseData(dataRepository.getLogs);
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const logs = user ? (storedLogs ?? []) : [];
  const tricks = storedTricks ?? initialTricks;
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
        <div className="card mb-4 grid gap-2 !p-3 sm:grid-cols-3">
          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <select aria-label="技名で絞り込み" className="field pl-9" value={trickId} onChange={(e) => setTrickId(e.target.value)}>
              <option value="all">すべての技</option>
              {tricks.map((trick) => (
                <option key={trick.id} value={trick.id}>
                  {trick.nameJa}
                </option>
              ))}
            </select>
          </label>
          <select aria-label="練習タイプで絞り込み" className="field" value={trainingType} onChange={(e) => setTrainingType(e.target.value as TrainingTypeFilter)}>
            <option value="all">すべて</option>
            <option value="snow">ゲレンデ</option>
            <option value="shibakatsu">シバカツ</option>
          </select>
          <input aria-label="日付で絞り込み" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((log) => (
          <PracticeLogCard key={log.id} log={log} trick={tricks.find((trick) => trick.id === log.trickId)} />
        ))}
        {filtered.length === 0 && <div className="card py-12 text-center text-sm text-slate-400">{user ? "記録がありません" : "ログインすると練習を記録できます"}</div>}
      </div>
    </main>
  );
}
