"use client";

import { Info, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type TabTipKey = "home" | "tricks" | "practice" | "offtraining" | "ai_chat" | "profile";

interface TabFirstVisitTipProps {
  tabKey: TabTipKey;
  title: string;
  description: string;
}

const TUTORIAL_SEEN_KEY = "gratri_onboarding_seen";
const APP_READY_EVENT = "gratri-app-onboarding-ready";
const APP_READY_KEY = "gratri-app-onboarding-ready";

export default function TabFirstVisitTip({ tabKey, title, description }: TabFirstVisitTipProps) {
  const [visible, setVisible] = useState(false);
  const storageKey = `gratri_tab_tip_${tabKey}_seen`;

  const showWhenReady = useCallback(() => {
    if (
      localStorage.getItem(TUTORIAL_SEEN_KEY) === "true" &&
      localStorage.getItem(storageKey) !== "true"
    ) {
      setVisible(true);
    }
  }, [storageKey]);

  useEffect(() => {
    window.addEventListener(APP_READY_EVENT, showWhenReady);
    if (sessionStorage.getItem(APP_READY_KEY) === "true") showWhenReady();
    return () => window.removeEventListener(APP_READY_EVENT, showWhenReady);
  }, [showWhenReady]);

  function dismiss(): void {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-navy/25 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby={`tab-tip-${tabKey}-title`}>
      <div className="absolute inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] mx-auto max-w-md rounded-[1.75rem] border border-white bg-white p-5 shadow-2xl">
        <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-white bg-white" />
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ice text-glacier">
            <Info size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={`tab-tip-${tabKey}-title`} className="font-black text-navy">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <button type="button" onClick={dismiss} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400" aria-label="閉じる">
            <X size={17} />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={dismiss} className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-bold text-slate-500 sm:text-sm">
            今後表示しない
          </button>
          <button type="button" onClick={dismiss} className="btn-primary">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
