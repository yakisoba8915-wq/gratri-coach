"use client";

import { Grid2X2, List, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import TrickList from "@/components/TrickList";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { initialTricks } from "@/lib/mockData";
import { dataRepository } from "@/lib/storage";
import { masteryStatuses } from "@/lib/types";

export default function TricksPage() {
  const [stored] = useSupabaseData(dataRepository.getTricks); const tricks = stored ?? initialTricks;
  const [query,setQuery] = useState(""); const [category,setCategory] = useState("all"); const [difficulty,setDifficulty] = useState("all");
  const [status,setStatus] = useState("all"); const [favorites,setFavorites] = useState(false); const [view,setView] = useState<"card"|"list">("card");
  const categories = [...new Set(tricks.map((t) => t.category))];
  const filtered = useMemo(() => tricks.filter((trick) => {
    const matchesQuery = `${trick.nameJa} ${trick.nameEn}`.toLowerCase().includes(query.toLowerCase());
    const matchesDifficulty = difficulty === "all" || (difficulty === "1-3" ? trick.difficulty <= 3 : difficulty === "4-6" ? trick.difficulty >= 4 && trick.difficulty <= 6 : trick.difficulty >= 7);
    return matchesQuery && (category === "all" || trick.category === category) && matchesDifficulty && (status === "all" || trick.masteryStatus === status) && (!favorites || trick.favorite);
  }),[tricks,query,category,difficulty,status,favorites]);
  return <main><PageHeader eyebrow="TRICK LIBRARY" title="トリック"/><div className="relative mb-3"><Search className="absolute left-4 top-3.5 text-slate-400" size={18}/><input className="field pl-11" placeholder="技名で検索" value={query} onChange={(e)=>setQuery(e.target.value)}/></div>
    <div className="mb-4 grid grid-cols-2 gap-2"><select className="field" value={category} onChange={(e)=>setCategory(e.target.value)}><option value="all">全ジャンル</option>{categories.map((c)=><option key={c}>{c}</option>)}</select><select className="field" value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}><option value="all">全難易度</option><option value="1-3">Lv.1〜3</option><option value="4-6">Lv.4〜6</option><option value="7-10">Lv.7〜10</option></select><select className="field" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="all">全習得状態</option>{masteryStatuses.map((s)=><option key={s}>{s}</option>)}</select><button onClick={()=>setFavorites(!favorites)} className={`field flex items-center justify-center gap-2 font-bold ${favorites ? "border-rose-300 bg-rose-50 text-rose-500" : "text-slate-500"}`}><SlidersHorizontal size={16}/>お気に入り</button></div>
    <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-slate-400">{filtered.length} TRICKS</p><div className="flex rounded-xl bg-slate-100 p-1"><button aria-label="カード表示" onClick={()=>setView("card")} className={`rounded-lg p-2 ${view === "card" ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}><Grid2X2 size={16}/></button><button aria-label="リスト表示" onClick={()=>setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-white text-glacier shadow-sm" : "text-slate-400"}`}><List size={16}/></button></div></div><TrickList tricks={filtered} view={view}/></main>;
}
