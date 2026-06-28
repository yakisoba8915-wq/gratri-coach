"use client";

import Link from "next/link";
import { Lock, X } from "lucide-react";

export default function PremiumLockedTrickModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-end bg-navy/45 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="premium-trick-title">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Lock size={20} />
            </div>
            <div>
              <h2 id="premium-trick-title" className="text-lg font-black text-slate-900">Premium限定トリックです</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-500">このトリックを利用するにはPremium登録が必要です。</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500" aria-label="閉じる">
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500">
            閉じる
          </button>
          <Link href="/premium" onClick={onClose} className="rounded-2xl bg-navy px-4 py-3 text-center text-sm font-black text-white">
            Premiumについて
          </Link>
        </div>
      </div>
    </div>
  );
}
