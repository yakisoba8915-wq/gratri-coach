import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PageHeader({ title, eyebrow, back }: { title:string; eyebrow?:string; back?:string }) {
  return <header className="mb-6">{back && <Link href={back} className="mb-3 inline-flex items-center text-sm font-bold text-slate-500"><ChevronLeft size={18}/>戻る</Link>} {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-glacier">{eyebrow}</p>}<h1 className="text-3xl font-black tracking-tight">{title}</h1></header>;
}
