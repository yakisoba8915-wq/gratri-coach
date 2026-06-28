"use client";

import Link from "next/link";
import { Circle, GitBranch, Lock } from "lucide-react";
import { useState } from "react";
import PremiumLockedTrickModal from "./PremiumLockedTrickModal";
import { initialTricks } from "@/lib/mockData";
import { canUseTrick } from "@/lib/accessControl";
import { formatTrickName } from "@/lib/trickDisplay";
import { selectedStanceLabels, trickStanceLabels } from "@/lib/trickStance";
import type { MasteryStatus, PlanType, Trick } from "@/lib/types";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";

interface TreeNodeDefinition {
  id: string;
  children?: TreeNodeDefinition[];
}

interface TreeSection {
  id: string;
  title: string;
  description: string;
  tone: string;
  roots: TreeNodeDefinition[];
}

interface TrickSkillTreeProps {
  tricks: Trick[];
  showStatus?: boolean;
  selectedStance?: SelectedTrickDisplayStance;
  planType?: PlanType;
}

const sections: TreeSection[] = [
  {
    id: "press",
    title: "プレス基礎ツリー",
    description: "まずは4方向の重心移動を身につけます。",
    tone: "from-cyan-400 to-sky-500",
    roots: [
      { id: "back-nose-press" },
      { id: "back-tail-press" },
      { id: "front-nose-press" },
      { id: "front-tail-press" },
    ],
  },
  {
    id: "ollie",
    title: "オーリー系ツリー",
    description: "オーリーから180、360へ段階的に進みます。",
    tone: "from-blue-400 to-indigo-500",
    roots: [
      {
        id: "ollie",
        children: [
          { id: "ollie-bs-180", children: [{ id: "ollie-bs-360" }] },
          { id: "ollie-fs-180", children: [{ id: "ollie-fs-360" }] },
        ],
      },
    ],
  },
  {
    id: "nollie",
    title: "ノーリー系ツリー",
    description: "ノーリーの基礎から高回転へつなげます。",
    tone: "from-violet-400 to-fuchsia-500",
    roots: [
      {
        id: "nollie",
        children: [
          { id: "nollie-bs-180", children: [{ id: "nollie-bs-360" }] },
          { id: "nollie-fs-180", children: [{ id: "nollie-fs-360", children: [{ id: "fs-nollie-540" }] }] },
        ],
      },
    ],
  },
  {
    id: "advanced",
    title: "応用・派生ツリー",
    description: "プレスや弾きを組み合わせた発展技です。",
    tone: "from-amber-400 to-orange-500",
    roots: [
      { id: "back-nose-press", children: [{ id: "back-nose-180" }] },
      { id: "front-tail-press", children: [{ id: "front-tail-180" }] },
      { id: "ollie", children: [{ id: "owen" }] },
      { id: "nollie", children: [{ id: "sone" }] },
      { id: "nollie-fs-360", children: [{ id: "andy" }] },
    ],
  },
];

const initialIds = new Set(initialTricks.map((trick) => trick.id));

const statusStyles: Record<MasteryStatus, string> = {
  未挑戦: "border-slate-200 bg-white",
  練習中: "border-sky-300 bg-sky-50",
  "1回だけメイク": "border-cyan-300 bg-cyan-50",
  低確率メイク: "border-indigo-300 bg-indigo-50",
  ほぼ安定: "border-emerald-300 bg-emerald-50",
  完成: "border-emerald-500 bg-emerald-100",
};

function buildDbChildren(tricks: Trick[]): Map<string, Trick[]> {
  const result = new Map<string, Trick[]>();
  for (const trick of tricks) {
    if (initialIds.has(trick.id) || (trick.trickType ?? "snow") !== "snow") continue;
    const parentId = trick.prerequisites.find((id) => tricks.some((candidate) => candidate.id === id));
    if (!parentId) continue;
    result.set(parentId, [...(result.get(parentId) ?? []), trick]);
  }
  return result;
}

function TrickNode({ trick, showStatus, selectedStance, planType }: { trick: Trick; showStatus: boolean; selectedStance: SelectedTrickDisplayStance; planType: PlanType }) {
  const allowed = canUseTrick(trick, planType);
  const [premiumOpen, setPremiumOpen] = useState(false);

  if (!allowed) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPremiumOpen(true)}
          className="block w-full min-w-0 rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-3 text-left opacity-80 shadow-sm transition active:scale-[.98]"
        >
          <div className="flex min-w-0 items-start gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-amber-600">
              <Lock size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-black leading-5 text-slate-800">{formatTrickName(trick.nameJa, selectedStance)}</p>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
                <Lock size={10} />
                Premium限定
              </p>
            </div>
          </div>
        </button>
        <PremiumLockedTrickModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      </>
    );
  }

  return (
    <Link
      href={`/tricks/${trick.id}?stance=${selectedStance}`}
      className={`block min-w-0 rounded-2xl border px-3 py-3 shadow-sm transition active:scale-[.98] ${showStatus ? statusStyles[trick.masteryStatus] : "border-slate-200 bg-white"}`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ice text-[10px] font-black text-glacier">Lv.{trick.difficulty}</span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-black leading-5">{formatTrickName(trick.nameJa, selectedStance)}</p>
          <p className="mt-1 truncate text-[10px] font-bold text-slate-400">{trick.category} / 対応 {trickStanceLabels[trick.stance ?? "both"]}</p>
          <p className="mt-0.5 text-[10px] font-bold text-blue-500">{selectedStanceLabels[selectedStance]}</p>
        </div>
      </div>
    </Link>
  );
}

function TreeBranch({
  definition,
  trickMap,
  dbChildren,
  showStatus,
  selectedStance,
  planType,
  path,
}: {
  definition: TreeNodeDefinition;
  trickMap: Map<string, Trick>;
  dbChildren: Map<string, Trick[]>;
  showStatus: boolean;
  selectedStance: SelectedTrickDisplayStance;
  planType: PlanType;
  path: Set<string>;
}) {
  const trick = trickMap.get(definition.id);
  if (!trick || path.has(definition.id)) return null;

  const nextPath = new Set(path).add(definition.id);
  const staticChildren = definition.children ?? [];
  const dynamicChildren = (dbChildren.get(definition.id) ?? []).map((child) => ({ id: child.id }));
  const children = [...staticChildren, ...dynamicChildren].filter((child, index, list) => list.findIndex((item) => item.id === child.id) === index);

  return (
    <div className="min-w-0">
      <TrickNode trick={trick} showStatus={showStatus} selectedStance={selectedStance} planType={planType} />
      {children.length > 0 && (
        <div className="relative ml-4 mt-2 space-y-2 border-l-2 border-sky-200 pl-5">
          {children.map((child) => (
            <div key={`${definition.id}-${child.id}`} className="relative min-w-0 before:absolute before:-left-5 before:top-6 before:h-0.5 before:w-5 before:bg-sky-200">
              <TreeBranch definition={child} trickMap={trickMap} dbChildren={dbChildren} showStatus={showStatus} selectedStance={selectedStance} planType={planType} path={nextPath} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrickSkillTree({ tricks, showStatus = false, selectedStance = "regular", planType = "free" }: TrickSkillTreeProps) {
  const snowTricks = tricks.filter((trick) => (trick.trickType ?? "snow") === "snow");
  const trickMap = new Map(snowTricks.map((trick) => [trick.id, trick]));
  const dbChildren = buildDbChildren(snowTricks);
  const assignedChildIds = new Set(Array.from(dbChildren.values()).flat().map((child) => child.id));
  const unresolved = snowTricks.filter((trick) => !initialIds.has(trick.id) && (trick.prerequisites.length === 0 || Boolean(trick.prerequisiteText?.trim())) && !assignedChildIds.has(trick.id));

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.id} className="card overflow-hidden !p-0">
          <div className={`h-1.5 bg-gradient-to-r ${section.tone}`} />
          <div className="p-4">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-glacier">
                <GitBranch size={20} />
              </div>
              <div>
                <h2 className="font-black">{section.title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
              </div>
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {section.roots.map((root) => (
                <TreeBranch key={`${section.id}-${root.id}`} definition={root} trickMap={trickMap} dbChildren={dbChildren} showStatus={showStatus} selectedStance={selectedStance} planType={planType} path={new Set()} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {unresolved.length > 0 && (
        <section className="card">
          <div className="mb-4 flex items-center gap-2">
            <Circle size={18} className="text-slate-400" />
            <div>
              <h2 className="font-black">その他</h2>
              <p className="mt-1 text-xs text-slate-500">前提技が未設定、または既存ツリーに一致しない追加トリックです。</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {unresolved.map((trick) => (
              <TrickNode key={trick.id} trick={trick} showStatus={showStatus} selectedStance={selectedStance} planType={planType} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
