import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import AppOnboarding from "@/components/AppOnboarding";
import TabFirstVisitTips from "@/components/TabFirstVisitTips";
import "./globals.css";

export const metadata: Metadata = { title:"Gratri Coach", description:"グラトリ練習支援アプリ" };
export const viewport: Viewport = { width:"device-width", initialScale:1, themeColor:"#eaf7fb" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body className="font-sans"><AppOnboarding/><TabFirstVisitTips/><div className="mx-auto min-h-screen max-w-2xl px-4 pb-28 pt-5">{children}</div><BottomNav /></body></html>;
}
