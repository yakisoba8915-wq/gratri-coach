"use client";

import Link from "next/link";
import { Bot, Dumbbell, Home, ListChecks, Snowflake, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/tricks", label: "トリック", icon: Snowflake },
  { href: "/practice", label: "練習", icon: ListChecks },
  { href: "/training", label: "オフトレ", icon: Dumbbell },
  { href: "/ai-chat", label: "AI対話", icon: Bot },
  { href: "/profile", label: "プロフィール", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl justify-around px-1 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-bold ${active ? "text-glacier" : "text-slate-400"}`}>
              <Icon size={20} strokeWidth={active ? 2.6 : 2} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
