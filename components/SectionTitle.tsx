import Link from "next/link";

export default function SectionTitle({ title, subtitle, href, linkLabel="すべて見る" }: { title:string; subtitle?:string; href?:string; linkLabel?:string }) {
  return <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-lg font-black tracking-tight">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}</div>{href && <Link href={href} className="shrink-0 text-xs font-bold text-glacier">{linkLabel} →</Link>}</div>;
}
