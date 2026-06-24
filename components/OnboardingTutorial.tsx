"use client";

import { Bot, ChevronRight, Dumbbell, ListChecks, MountainSnow, Snowflake } from "lucide-react";
import { useState } from "react";

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Gratri Coachへようこそ",
    description: "グラトリ初心者〜中級者の上達を支える、AI練習サポートアプリです。練習を記録しながら、自分に合った次の一歩を見つけましょう。",
    icon: MountainSnow,
    color: "from-cyan-400 to-blue-500",
    iconBackground: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "トリックを確認",
    description: "トリック辞典で難易度や技の系統、前提技を確認できます。技ツリーを使えば、次に覚えたい技への道筋も見つかります。",
    icon: Snowflake,
    color: "from-sky-400 to-indigo-500",
    iconBackground: "bg-sky-50 text-sky-600",
  },
  {
    title: "練習を記録",
    description: "ゲレンデでの滑走とシバカツ練習を分けて記録できます。成功回数や苦手ポイント、動画を残して振り返りに活用できます。",
    icon: ListChecks,
    color: "from-blue-400 to-violet-500",
    iconBackground: "bg-blue-50 text-blue-600",
  },
  {
    title: "オフトレを提案",
    description: "簡単な診断結果から、曜日ごとの週間オフトレプランを作成します。シバカツ、筋トレ、柔軟を無理のないペースで続けられます。",
    icon: Dumbbell,
    color: "from-violet-400 to-fuchsia-500",
    iconBackground: "bg-violet-50 text-violet-600",
  },
  {
    title: "AIコーチに相談",
    description: "練習記録や苦手ポイントをもとに、トリックのコツや次の練習メニューをAIコーチへ相談できます。",
    icon: Bot,
    color: "from-indigo-400 to-cyan-500",
    iconBackground: "bg-indigo-50 text-indigo-600",
  },
] as const;

export default function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slide = slides[currentIndex];
  const Icon = slide.icon;
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[110] grid place-items-end bg-navy/55 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className={`h-2 bg-gradient-to-r ${slide.color}`} />
        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black tracking-[.18em] text-glacier">GRATRI COACH</p>
            <button type="button" onClick={onComplete} className="rounded-full px-3 py-2 text-xs font-bold text-slate-400 transition hover:bg-slate-50">
              スキップ
            </button>
          </div>

          <div className="flex min-h-[330px] flex-col justify-center py-7 text-center sm:min-h-[350px]">
            <div className={`mx-auto grid h-24 w-24 place-items-center rounded-[2rem] ${slide.iconBackground}`}>
              <Icon size={44} strokeWidth={1.8} />
            </div>
            <p className="mt-7 text-xs font-black text-slate-400">{currentIndex + 1} / {slides.length}</p>
            <h2 id="onboarding-title" className="mt-2 text-2xl font-black tracking-tight text-navy">{slide.title}</h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-slate-500">{slide.description}</p>
          </div>

          <div className="mb-5 flex justify-center gap-2" aria-label={`全${slides.length}枚中${currentIndex + 1}枚目`}>
            {slides.map((item, index) => (
              <span key={item.title} className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-7 bg-glacier" : "w-2 bg-slate-200"}`} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (isLastSlide) onComplete();
              else setCurrentIndex((index) => index + 1);
            }}
            className="btn-primary w-full py-4"
          >
            {isLastSlide ? "はじめる" : "次へ"}
            {!isLastSlide && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
