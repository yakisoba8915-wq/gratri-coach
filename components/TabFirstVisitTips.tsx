"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import TabFirstVisitTip from "./TabFirstVisitTip";

const tips = {
  "/": {
    tabKey: "home",
    title: "ホーム画面",
    description: "今日の練習状況、次回課題、オフトレ予定をまとめて確認できます。",
  },
  "/tricks": {
    tabKey: "tricks",
    title: "トリック辞典",
    description: "難易度や系統ごとに技を確認できます。まずは4方向プレスから練習するのがおすすめです。",
  },
  "/practice": {
    tabKey: "practice",
    title: "練習記録",
    description: "ゲレンデ練習とシバカツ練習を分けて記録できます。成功回数・失敗回数・苦手ポイントを残すとAIアドバイスの精度が上がります。",
  },
  "/training": {
    tabKey: "offtraining",
    title: "オフトレ",
    description: "診断結果をもとに、シバカツの日と筋トレ＋柔軟の日を分けた週間プランを確認できます。",
  },
  "/ai-chat": {
    tabKey: "ai_chat",
    title: "AIコーチ",
    description: "トリックのコツ、練習順、苦手克服、オフトレ内容について相談できます。ログインすると練習記録に合わせた回答ができます。",
  },
  "/profile": {
    tabKey: "profile",
    title: "プロフィール",
    description: "ユーザー名、スタンス、プロフィール画像、プラン情報を確認・編集できます。",
  },
} as const;

const GUEST_MODE_KEY = "gratri_guest_mode";

export default function TabFirstVisitTips() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [guestMode, setGuestMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGuestMode(localStorage.getItem(GUEST_MODE_KEY) === "true");
    setReady(true);
  }, []);

  if (pathname === "/" && ready && !user && !guestMode) return null;
  const tip = tips[pathname as keyof typeof tips];
  if (!tip) return null;
  return <TabFirstVisitTip {...tip} />;
}
