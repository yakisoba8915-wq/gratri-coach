"use client";

import { Bot, Loader2, RotateCcw, Send, Sparkles, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getRecentAiAdviceActions } from "@/lib/aiAdviceActions";
import { buildTrickStatsForAi } from "@/lib/aiAdvisor";
import { getAiCoachMessages, resetAiCoachMessages, saveAiCoachMessage } from "@/lib/aiCoachMemory";
import type { AiCoachMessage, Goal, OffTrainingPlan, PracticeLog, Profile, Trick } from "@/lib/types";
import { getRecentVideoAnalysisResults } from "@/lib/videoAnalysisStorage";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface AIChatProps {
  isLoggedIn: boolean;
  profile?: Profile;
  practiceLogs: PracticeLog[];
  goals: Goal[];
  offTrainingPlan: OffTrainingPlan | null;
  tricks: Trick[];
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "こんにちは。トリックのコツ、練習メニュー、シバカツ、オフトレについて相談できます。",
};

const quickButtons = [
  { label: "トリックのコツ", prompt: "トリックのコツを教えて。今のレベルで意識することを短く知りたいです。" },
  { label: "今日の練習メニュー", prompt: "今日の練習メニューを組んでください。基礎、メイン技、振り返りの順でお願いします。" },
  { label: "オフトレ相談", prompt: "オフトレで何を優先すべきか相談したいです。" },
  { label: "シバカツ相談", prompt: "シバカツ練習で何を意識すればいいか教えてください。" },
  { label: "苦手克服", prompt: "苦手な技を克服するための練習方法を教えてください。" },
  { label: "技の順番", prompt: "次に練習する技の順番を教えてください。" },
];

function toChatMessage(message: AiCoachMessage): ChatMessage | null {
  if (message.sourceType !== "chat") return null;
  if (message.role !== "user" && message.role !== "assistant") return null;
  return { id: message.id, role: message.role, content: message.message };
}

export default function AIChat({ isLoggedIn, profile, practiceLogs, goals, offTrainingPlan, tricks }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [memoryMessages, setMemoryMessages] = useState<AiCoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const trickStats = useMemo(() => buildTrickStatsForAi({ tricks, logs: practiceLogs }), [tricks, practiceLogs]);

  async function loadHistory(): Promise<void> {
    if (!isLoggedIn) {
      setMessages([welcomeMessage]);
      setMemoryMessages([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const history = await getAiCoachMessages(60);
      setMemoryMessages(history);
      const chatHistory = history.map(toChatMessage).filter((message): message is ChatMessage => Boolean(message));
      setMessages(chatHistory.length ? chatHistory : [welcomeMessage]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function resetHistory(): Promise<void> {
    if (!window.confirm("AIコーチとの会話履歴を削除します。よろしいですか？")) return;
    setError("");
    try {
      await resetAiCoachMessages();
      setMemoryMessages([]);
      setMessages([welcomeMessage]);
    } catch {
      setError("履歴のリセットに失敗しました。少し時間を置いてもう一度試してください。");
    }
  }

  async function sendMessage(text = input, selectedCategory = category): Promise<void> {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setCategory("");
    setLoading(true);
    setError("");

    let savedUserMemory: AiCoachMessage | null = null;
    if (isLoggedIn) {
      savedUserMemory = await saveAiCoachMessage({ role: "user", message: content, sourceType: "chat" });
      if (savedUserMemory) {
        const memory = savedUserMemory;
        setMemoryMessages((current) => [...current, memory]);
      }
    }

    try {
      const [recentVideoAnalyses, recentAdviceActions] = isLoggedIn
        ? await Promise.all([getRecentVideoAnalysisResults(8), getRecentAiAdviceActions(8)])
        : [[], []];

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          category: selectedCategory,
          messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
          context: isLoggedIn
            ? {
                profile: profile ?? null,
                practiceLogs,
                goals,
                offtrainingPlan: offTrainingPlan,
                trickStats,
                aiCoachMessages: memoryMessages.slice(-20),
                videoAnalysisResults: recentVideoAnalyses,
                aiAdviceActions: recentAdviceActions,
              }
            : {},
        }),
      });
      const data = (await response.json()) as { reply?: string; source?: "openai" | "rule" };
      const reply = data.reply || "回答を生成できませんでした。もう一度質問してください。";
      const assistantMessage: ChatMessage = { id: `assistant-${Date.now()}`, role: "assistant", content: reply };
      setMessages((current) => [...current, assistantMessage]);

      if (isLoggedIn) {
        const savedAssistantMemory = await saveAiCoachMessage({ role: "assistant", message: reply, sourceType: "chat" });
        if (savedAssistantMemory) {
          const memory = savedAssistantMemory;
          setMemoryMessages((current) => [...current, memory]);
        }
      }
    } catch {
      const fallback = "AI APIが未設定、または通信に失敗したため、基本アドバイスを表示しています。基礎技と前提技を確認し、無理のない範囲で練習しましょう。";
      setError("通信に失敗しました。少し時間を置いてもう一度試してください。");
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", content: fallback }]);
      if (isLoggedIn) await saveAiCoachMessage({ role: "assistant", message: fallback, sourceType: "chat" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, [isLoggedIn]);

  return (
    <div className="space-y-4">
      {!isLoggedIn && <div className="card text-sm font-bold leading-6 text-slate-500">ログインすると、練習記録や目標に合わせた個別アドバイスとAIコーチ履歴保存ができます。</div>}

      <section className="card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-black">
            <Sparkles size={16} className="text-glacier" />
            質問カテゴリ
          </div>
          {isLoggedIn && (
            <button type="button" onClick={() => void resetHistory()} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
              <RotateCcw size={13} />
              履歴をリセット
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={() => {
                setCategory(button.label);
                setInput(button.prompt);
              }}
              className={`rounded-full px-3 py-2 text-xs font-bold ${category === button.label ? "bg-glacier text-white" : "bg-ice text-glacier"}`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card flex min-h-[52vh] flex-col !p-3">
        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {historyLoading && <p className="text-xs font-bold text-slate-400">過去のAIコーチ履歴を読み込み中...</p>}
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ice">
                  <Bot size={16} className="text-glacier" />
                </div>
              )}
              <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm font-bold leading-7 ${message.role === "user" ? "rounded-br-sm bg-navy text-white" : "rounded-bl-sm bg-slate-100 text-slate-700"}`}>
                {message.content}
              </div>
              {message.role === "user" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100">
                  <UserRound size={16} className="text-slate-400" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              AIコーチが考えています...
            </div>
          )}
        </div>

        {error && <p className="mb-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-500">{error}</p>}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
          className="flex items-end gap-2 border-t border-slate-100 pt-3"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={1}
            className="field min-h-12 flex-1 resize-none"
            placeholder="トリックや練習メニューについて質問する"
          />
          <button disabled={!input.trim() || loading} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-glacier text-white disabled:bg-slate-200 disabled:text-slate-400" aria-label="送信">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </section>
    </div>
  );
}
