"use client";

import { CheckCircle2, MessageSquarePlus, Send, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getMyFeedback, submitFeedback } from "@/lib/feedback";
import type {
  FeedbackPriority,
  FeedbackStatus,
  FeedbackTargetScreen,
  FeedbackType,
  UserFeedback,
} from "@/lib/types";

const feedbackTypes: FeedbackType[] = ["不具合報告", "改善要望", "機能提案", "その他"];
const targetScreens: FeedbackTargetScreen[] = ["ホーム", "トリック", "練習", "オフトレ", "AI対話", "プロフィール", "その他"];
const priorities: FeedbackPriority[] = ["低", "中", "高"];

const statusLabels: Record<FeedbackStatus, string> = {
  open: "受付済み",
  reviewing: "確認中",
  resolved: "対応済み",
  rejected: "見送り",
};

const priorityStyles: Record<FeedbackPriority, string> = {
  低: "bg-slate-100 text-slate-500",
  中: "bg-amber-50 text-amber-600",
  高: "bg-rose-50 text-rose-600",
};

export default function FeedbackSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("改善要望");
  const [targetScreen, setTargetScreen] = useState<FeedbackTargetScreen>("ホーム");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<FeedbackPriority>("中");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFeedback = useCallback(async () => {
    if (!isLoggedIn) {
      setFeedback([]);
      return;
    }
    setLoading(true);
    setFeedback(await getMyFeedback());
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  function closeModal(): void {
    if (submitting) return;
    setOpen(false);
    setError("");
  }

  async function sendFeedback(): Promise<void> {
    if (!message.trim()) {
      setError("内容を入力してください。");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const saved = await submitFeedback({ feedbackType, targetScreen, message, priority });
      setFeedback((current) => [saved, ...current]);
      setMessage("");
      setFeedbackType("改善要望");
      setTargetScreen("ホーム");
      setPriority("中");
      setOpen(false);
      setSuccess("フィードバックを送信しました。改善の参考にします。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "フィードバックの送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="card mb-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ice text-glacier">
            <MessageSquarePlus size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-black">フィードバック</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">不具合や改善案をGratri Coachチームへ送れます。</p>
          </div>
        </div>

        {success && (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-bold leading-5 text-emerald-700">
            <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
            {success}
          </p>
        )}

        <button
          type="button"
          disabled={!isLoggedIn}
          onClick={() => {
            setSuccess("");
            setError("");
            setOpen(true);
          }}
          className="btn-primary mt-4 w-full disabled:bg-slate-200 disabled:text-slate-400"
        >
          <MessageSquarePlus size={17} />
          フィードバックを送る
        </button>
        {!isLoggedIn && <p className="mt-3 text-center text-xs font-bold text-slate-400">ログインするとフィードバックを送信できます</p>}
      </section>

      {isLoggedIn && (
        <section className="card mb-4">
          <h2 className="font-black">送信済みフィードバック</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-400">読み込み中...</p>
          ) : feedback.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-400">送信履歴はまだありません。</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {feedback.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-ice px-2.5 py-1 text-glacier">{item.feedbackType}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-slate-500">{item.targetScreen}</span>
                    <span className={`rounded-full px-2.5 py-1 ${priorityStyles[item.priority]}`}>重要度 {item.priority}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>{statusLabels[item.status]}</span>
                    <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString("ja-JP")}</time>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-end bg-navy/45 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="feedback-modal-title" className="text-xl font-black">フィードバックを送る</h2>
                <p className="mt-2 text-xs leading-5 text-slate-500">いただいた内容を今後の改善に活用します。</p>
              </div>
              <button type="button" onClick={closeModal} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500" aria-label="閉じる">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="text-sm font-bold">
                種類
                <select className="field mt-2" value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as FeedbackType)}>
                  {feedbackTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold">
                対象画面
                <select className="field mt-2" value={targetScreen} onChange={(event) => setTargetScreen(event.target.value as FeedbackTargetScreen)}>
                  {targetScreens.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold">
                内容 <span className="text-rose-500">*</span>
                <textarea
                  autoFocus
                  rows={6}
                  className="field mt-2 resize-none"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="不具合の状況や、ほしい機能などを入力してください"
                />
              </label>
              <label className="text-sm font-bold">
                重要度
                <select className="field mt-2" value={priority} onChange={(event) => setPriority(event.target.value as FeedbackPriority)}>
                  {priorities.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>

            {error && <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-600">{error}</p>}
            <button type="button" disabled={submitting || !message.trim()} onClick={sendFeedback} className="btn-primary mt-6 w-full py-4 disabled:bg-slate-200 disabled:text-slate-400">
              <Send size={17} />
              {submitting ? "送信中..." : "送信する"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
