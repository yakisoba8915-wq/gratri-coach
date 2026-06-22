import TrickCard from "./TrickCard";
import type { Trick } from "@/lib/types";

export default function TrickList({ tricks, view }: { tricks:Trick[]; view:"card"|"list" }) {
  if (!tricks.length) return <div className="card py-12 text-center text-sm text-slate-500">条件に合うトリックがありません</div>;
  return <div className={view === "card" ? "grid gap-3 sm:grid-cols-2" : "space-y-2"}>{tricks.map((trick) => <TrickCard key={trick.id} trick={trick} compact={view === "list"}/>)}</div>;
}
