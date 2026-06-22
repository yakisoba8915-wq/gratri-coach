import type { LucideIcon } from "lucide-react";

export default function StatCard({ label, value, suffix, icon:Icon }: { label:string; value:string | number; suffix?:string; icon?:LucideIcon }) {
  return <div className="card flex-1"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500">{Icon && <Icon size={15} className="text-glacier"/>}{label}</div><div className="text-2xl font-black">{value}<span className="ml-1 text-xs font-bold text-slate-400">{suffix}</span></div></div>;
}
