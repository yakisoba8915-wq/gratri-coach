"use client";

import { Clipboard, Plus, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getAiRequestHeaders } from "@/lib/aiUsageLimits";

interface BetaInviteCode {
  id: string;
  code: string;
  description: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CodesResponse {
  codes?: BetaInviteCode[];
  code?: BetaInviteCode;
  error?: string;
}

export default function BetaInviteCodeAdmin() {
  const [codes, setCodes] = useState<BetaInviteCode[]>([]);
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCodes(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/beta-invite-codes", {
        headers: await getAiRequestHeaders(),
      });
      const data = (await response.json().catch(() => ({}))) as CodesResponse;
      if (!response.ok) throw new Error(data.error || "β招待コード一覧の取得に失敗しました。");
      setCodes(data.codes ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "β招待コード一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function createCode(): Promise<void> {
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/beta-invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAiRequestHeaders()) },
        body: JSON.stringify({
          description,
          max_uses: Number(maxUses) || 1,
          expires_at: expiresAt || null,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as CodesResponse;
      if (!response.ok || !data.code) throw new Error(data.error || "β招待コードの作成に失敗しました。");
      setCodes((current) => [data.code as BetaInviteCode, ...current]);
      setDescription("");
      setMaxUses("1");
      setExpiresAt("");
      setMessage(`招待コード ${data.code.code} を作成しました。`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "β招待コードの作成に失敗しました。");
    } finally {
      setCreating(false);
    }
  }

  async function deactivateCode(codeId: string): Promise<void> {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/beta-invite-codes/${encodeURIComponent(codeId)}`, {
        method: "DELETE",
        headers: await getAiRequestHeaders(),
      });
      const data = (await response.json().catch(() => ({}))) as CodesResponse;
      if (!response.ok) throw new Error(data.error || "β招待コードの無効化に失敗しました。");
      setCodes((current) => current.map((code) => (code.id === codeId ? { ...code, isActive: false } : code)));
      setMessage("β招待コードを無効化しました。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "β招待コードの無効化に失敗しました。");
    }
  }

  async function copyCode(code: string): Promise<void> {
    await navigator.clipboard.writeText(code);
    setMessage("招待コードをコピーしました。");
  }

  useEffect(() => {
    void loadCodes();
  }, []);

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">β招待コード</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">βテスター用の招待コードを作成・無効化できます。</p>
        </div>
        <button type="button" onClick={() => void loadCodes()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
          <RefreshCw size={14} />
          再読込
        </button>
      </div>

      <div className="grid gap-3 rounded-3xl bg-slate-50 p-4">
        <input className="field" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="説明（例：初期βテスター配布）" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-black text-slate-500">
            最大利用回数
            <input className="field mt-2" type="number" min={1} value={maxUses} onChange={(event) => setMaxUses(event.target.value)} />
          </label>
          <label className="text-xs font-black text-slate-500">
            有効期限
            <input className="field mt-2" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </label>
        </div>
        <button type="button" disabled={creating} onClick={() => void createCode()} className="btn-primary justify-center disabled:bg-slate-200 disabled:text-slate-400">
          <Plus size={16} />
          {creating ? "作成中..." : "招待コードを作成"}
        </button>
      </div>

      {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</p>}
      {loading && <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">招待コードを読み込み中...</p>}

      <div className="grid gap-3">
        {codes.map((code) => (
          <article key={code.id} className={`rounded-3xl border p-4 ${code.isActive ? "border-slate-100 bg-white" : "border-slate-100 bg-slate-50 opacity-70"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all text-lg font-black text-navy">{code.code}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{code.description || "説明なし"}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${code.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                {code.isActive ? "有効" : "無効"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
              <span className="rounded-full bg-slate-50 px-2 py-1">利用: {code.usedCount} / {code.maxUses}</span>
              <span className="rounded-full bg-slate-50 px-2 py-1">期限: {code.expiresAt ? new Date(code.expiresAt).toLocaleString("ja-JP") : "なし"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copyCode(code.code)} className="inline-flex items-center gap-1 rounded-xl bg-ice px-3 py-2 text-xs font-black text-glacier">
                <Clipboard size={14} />
                コピー
              </button>
              {code.isActive && (
                <button type="button" onClick={() => void deactivateCode(code.id)} className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600">
                  <XCircle size={14} />
                  無効化
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
