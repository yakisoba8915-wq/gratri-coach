import { ExternalLink, MapPin } from "lucide-react";
import { calculateSuccessRate, formatDate } from "@/lib/calculations";
import type { PracticeLog, Trick } from "@/lib/types";

export default function PracticeLogCard({ log, trick }: { log:PracticeLog; trick?:Trick }) {
  const rate = calculateSuccessRate(log.successCount, log.failCount);
  return <article className="card"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-glacier">{formatDate(log.date)}</p><h3 className="mt-1 text-lg font-black">{trick?.nameJa ?? "不明な技"}</h3>{log.resortName && <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><MapPin size={12}/>{log.resortName}</p>}</div><div className="grid h-16 w-16 place-items-center rounded-full bg-ice"><div className="text-center"><div className="text-lg font-black text-glacier">{rate}%</div><div className="text-[9px] font-bold text-slate-400">成功率</div></div></div></div><div className="mt-4 rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400">次回課題</p><p className="mt-1 text-sm font-bold">{log.nextTask || "次の練習で決めよう"}</p></div>{log.videoUrls.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{log.videoUrls.map((url,index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-glacier"><ExternalLink size={13}/>動画 {index+1}</a>)}</div>}</article>;
}
