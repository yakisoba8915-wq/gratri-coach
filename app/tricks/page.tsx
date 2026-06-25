"use client";

import Link from "next/link";
import { GitBranch, Grid2X2, List, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import AddTrickModal from "@/components/AddTrickModal";
import PageHeader from "@/components/PageHeader";
import ShibakatsuTrickCard from "@/components/ShibakatsuTrickCard";
import TrickList from "@/components/TrickList";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import { masteryStatuses } from "@/lib/types";
import type { TrainingType } from "@/lib/types";

export default function TricksPage() {
  const { user } = useAuth();
  const [stored, refresh] = useSupabaseData(dataRepository.getAllTricks);
  const tricks = stored ?? initialTricks;
  const [activeType, setActiveType] = useState<TrainingType>("snow");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [favorites, setFavorites] = useState(false);
  const [view, setView] = useState<"card" | "list">("card");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [created, setCreated] = useState(false);

  const typeTricks = useMemo(
    () => tricks.filter((trick) => (trick.trickType ?? "snow") === activeType),
    [tricks, activeType],
  );
  const categories = [...new Set(typeTricks.map((trick) => trick.category))];
  const filtered = useMemo(
    () =>
      typeTricks.filter((trick) => {
        const matchesQuery = `${trick.nameJa} ${trick.nameEn}`.toLowerCase().includes(query.toLowerCase());
        const matchesDifficulty =
          difficulty === "all" ||
          (difficulty === "1-3"
            ? trick.difficulty <= 3
            : difficulty === "4-6"
              ? trick.difficulty >= 4 && trick.difficulty <= 6
              : trick.difficulty >= 7);
        const matchesUserFilters =
          activeType === "shibakatsu" ||
          ((!user || status === "all" || trick.masteryStatus === status) &&
            (!favorites || Boolean(user && trick.favorite)));
        return (
          matchesQuery &&
          (category === "all" || trick.category === category) &&
          matchesDifficulty &&
          matchesUserFilters
        );
      }),
    [typeTricks, query, category, difficulty, status, favorites, user, activeType],
  );

  function switchType(type: TrainingType): void {
    setActiveType(type);
    setCategory("all");
    setDifficulty("all");
    setStatus("all");
    setFavorites(false);
    setQuery("");
  }

  async function handleCreated(): Promise<void> {
    await refresh();
    setCreated(true);
    window.setTimeout(() => setCreated(false), 2500);
  }

  const isShibakatsu = activeType === "shibakatsu";

  return (
    <main>
      <div className="flex items-start justify-between gap-3">
        <PageHeader eyebrow="TRICK LIBRARY" title="トリック" />
        <div className="flex shrink-0 gap-2">
          {!isShibakatsu && (
            <Link href="/tree" aria-label="技ツリーを開く" className="grid h-12 w-12 place-items-center rounded-2xl bg-ice text-glacier">
              <GitBranch size={19} />
            </Link>
          )}
          <button type="button" onClick={() => setAddModalOpen(true)} className="btn-primary shrink-0 !px-3 !py-3 text-sm">
            <Plus size={18} />
            <span className="hidden sm:inline">{isShibakatsu ? "シバカツ技を追加" : "技を追加"}</span>
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button type="button" onClick={() => switchType("snow")} className={`rounded-xl px-3 py-3 text-sm font-black transition ${!isShibakatsu ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}>
          通常トリック
        </button>
        <button type="button" onClick={() => switchType("shibakatsu")} className={`rounded-xl px-3 py-3 text-sm font-black transition ${isShibakatsu ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}>
          シバカツトリック
        </button>
      </div>

      {created && <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{isShibakatsu ? "シバカツ技を追加しました" : "技を追加しました"}</p>}

      <div className="relative mb-3">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input className="field pl-11" placeholder={isShibakatsu ? "シバカツ技名で検索" : "技名で検索"} value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className={`mb-4 grid grid-cols-2 gap-2 ${isShibakatsu ? "" : ""}`}>
        <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">全ジャンル</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="field" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="all">全難易度</option>
          <option value="1-3">Lv.1〜3</option>
          <option value="4-6">Lv.4〜6</option>
          <option value="7-10">Lv.7〜10</option>
        </select>
        {!isShibakatsu && (
          <>
            <select disabled={!user} className="field disabled:bg-slate-50 disabled:text-slate-300" value={user ? status : "all"} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">全習得状態</option>
              {masteryStatuses.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button
              type="button"
              disabled={!user}
              onClick={() => setFavorites((current) => !current)}
              className={`field flex items-center justify-center gap-2 font-bold disabled:bg-slate-50 disabled:text-slate-300 ${favorites && user ? "border-rose-300 bg-rose-50 text-rose-500" : "text-slate-500"}`}
            >
              <SlidersHorizontal size={16} />
              お気に入り
            </button>
          </>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-400">{filtered.length} TRICKS</p>
        {!isShibakatsu && (
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button type="button" aria-label="カード表示" onClick={() => setView("card")} className={`rounded-lg p-2 ${view === "card" ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}>
              <Grid2X2 size={16} />
            </button>
            <button type="button" aria-label="リスト表示" onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}>
              <List size={16} />
            </button>
          </div>
        )}
      </div>

      {isShibakatsu ? (
        filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((trick) => <ShibakatsuTrickCard key={trick.id} trick={trick} />)}
          </div>
        ) : typeTricks.length === 0 ? (
          <div className="card py-12 text-center text-sm leading-6 text-slate-500">
            まだシバカツ用トリックがありません。<br />
            管理パスワードを持っている場合は追加できます。
          </div>
        ) : (
          <div className="card py-12 text-center text-sm text-slate-500">条件に合うシバカツトリックがありません。</div>
        )
      ) : (
        <TrickList tricks={filtered} view={view} showUserData={Boolean(user)} />
      )}

      <AddTrickModal
        open={addModalOpen}
        trickType={activeType}
        onClose={() => setAddModalOpen(false)}
        onCreated={handleCreated}
      />
    </main>
  );
}
