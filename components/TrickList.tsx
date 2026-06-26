import TrickCard from "./TrickCard";
import type { Trick } from "@/lib/types";
import type { SelectedTrickDisplayStance } from "@/lib/trickStance";

export default function TrickList({ tricks, view, showUserData=true, selectedStance="regular" }: { tricks:Trick[]; view:"card"|"list"; showUserData?:boolean; selectedStance?:SelectedTrickDisplayStance }) {
  if (!tricks.length) return <div className="card py-12 text-center text-sm text-slate-500">条件に合うトリックがありません</div>;
  return <div className={view === "card" ? "grid gap-3 sm:grid-cols-2" : "space-y-2"}>{tricks.map((trick) => <TrickCard key={trick.id} trick={trick} compact={view === "list"} showUserData={showUserData} selectedStance={selectedStance}/>)}</div>;
}
