"use client";

import Link from "next/link";
import { Check, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedTrickStance } from "@/hooks/useSelectedTrickStance";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { formatTrickName } from "@/lib/trickDisplay";
import { dataRepository } from "@/lib/storage";
import type { Goal, GoalType } from "@/lib/types";

const goalTypes = ["技をメイクする", "成功率を上げる"] as GoalType[];

export default function GoalsPage() {
  const { user } = useAuth();
  const [selectedStance] = useSelectedTrickStance();
  const [storedGoals, refresh] = useSupabaseData(dataRepository.getGoals);
  const [storedTricks] = useSupabaseData(dataRepository.getTricks);
  const goals = user ? (storedGoals ?? []) : [];
  const tricks = storedTricks ?? [];
  const [open, setOpen] = useState(false);
  const [season, setSeason] = useState("2026-27");
  const [type, setType] = useState<GoalType>(goalTypes[0]);
  const [trickId, setTrickId] = useState("");
  const [targetRate, setTargetRate] = useState(50);
  const seasons = [...new Set(goals.map((goal) => goal.season))];

  async function save() {
    if (!trickId) return;
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      season,
      type,
      trickId,
      completed: false,
      ...(type === goalTypes[1] ? { targetRate } : {}),
    };
    await dataRepository.saveGoals([...goals, goal]);
    await refresh();
    setOpen(false);
  }

  async function update(id: string, patch: Partial<Goal>) {
    await dataRepository.saveGoals(goals.map((goal) => goal.id === id ? { ...goal, ...patch } : goal));
    await refresh();
  }

  async function remove(id: string) {
    await dataRepository.saveGoals(goals.filter((goal) => goal.id !== id));
    await refresh();
  }

  return (
    <main>
      <div className="flex items-start justify-between">
        <PageHeader title="目標管理" eyebrow="SEASON GOALS" />
        {user ? (
          <button onClick={() => setOpen(!open)} className="btn-primary !p-3" aria-label="目標追加"><Plus /></button>
        ) : (
          <Link href="/profile" className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400">ログイン</Link>
        )}
      </div>

      {user && open && (
        <section className="card mb-5 grid gap-3">
          <h2 className="font-black">新しい目標</h2>
          <input className="field" value={season} onChange={(event) => setSeason(event.target.value)} placeholder="2026-27" />
          <select className="field" value={type} onChange={(event) => setType(event.target.value as GoalType)}>
            {goalTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="field" value={trickId} onChange={(event) => setTrickId(event.target.value)}>
            <option value="">トリックを選択</option>
            {tricks.map((trick) => <option key={trick.id} value={trick.id}>{formatTrickName(trick.nameJa, selectedStance)}</option>)}
          </select>
          {tricks.length === 0 && <p className="rounded-2xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-500">トリック情報を取得できませんでした。時間をおいて再度お試しください。</p>}
          {type === goalTypes[1] && (
            <label className="text-sm font-bold">
              目標成功率
              <input type="number" min="1" max="100" className="field mt-2" value={targetRate} onChange={(event) => setTargetRate(Number(event.target.value))} />
            </label>
          )}
          <button onClick={save} disabled={!trickId} className="btn-primary disabled:bg-slate-200 disabled:text-slate-400"><Check size={17} />追加する</button>
        </section>
      )}

      <div className="space-y-7">
        {seasons.map((seasonName) => (
          <section key={seasonName}>
            <div className="mb-3 flex items-center gap-2">
              <Target size={19} className="text-violet-500" />
              <h2 className="text-lg font-black">{seasonName} Season</h2>
            </div>
            <div className="space-y-3">
              {goals.filter((goal) => goal.season === seasonName).map((goal) => {
                const trick = tricks.find((item) => item.id === goal.trickId);
                return (
                  <article key={goal.id} className={`card flex items-center gap-3 ${goal.completed ? "opacity-60" : ""}`}>
                    <button onClick={() => update(goal.id, { completed: !goal.completed })} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${goal.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200"}`}>
                      {goal.completed && <Check size={17} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-violet-500">{goal.type}</p>
                      <p className={`font-black ${goal.completed ? "line-through" : ""}`}>{trick ? formatTrickName(trick.nameJa, selectedStance) : goal.trickId}{goal.targetRate ? ` ${goal.targetRate}%` : ""}</p>
                    </div>
                    <button onClick={() => remove(goal.id)} aria-label="削除" className="p-2 text-slate-300"><Trash2 size={17} /></button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        {!user && <div className="card py-12 text-center text-sm text-slate-400">ログインすると目標を管理できます</div>}
      </div>
    </main>
  );
}
