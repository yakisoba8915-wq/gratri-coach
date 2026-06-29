"use client";

import { Gift, Loader2 } from "lucide-react";
import { useState } from "react";
import { getAiRequestHeaders } from "@/lib/aiUsageLimits";

interface BetaInviteRedeemFormProps {
  isLoggedIn: boolean;
  onRedeemed: () => Promise<void>;
}

interface RedeemResponse {
  message?: string;
  error?: string;
}

export default function BetaInviteRedeemForm({ isLoggedIn, onRedeemed }: BetaInviteRedeemFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function redeem(): Promise<void> {
    if (!isLoggedIn) {
      setError("ログインすると招待コードを使用できます。");
      return;
    }
    if (!code.trim()) {
      setError("招待コードを入力してください。");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/beta-invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAiRequestHeaders()) },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json().catch(() => ({}))) as RedeemResponse;
      if (!response.ok) throw new Error(data.error || "招待コードが無効です。");
      setMessage(data.message || "βテスター特典が有効になりました");
      setCode("");
      await onRedeemed();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("gratri-storage"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "招待コードが無効です。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card mb-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ice text-glacier">
          <Gift size={20} />
        </div>
        <div>
          <h2 className="font-black">βテスター招待コード</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-400">招待コードを入力すると、βテスター特典でPremium機能を体験できます。</p>
        </div>
      </div>
      {!isLoggedIn ? (
        <p className="rounded-2xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">ログインすると招待コードを使用できます。</p>
      ) : (
        <div className="grid gap-2">
          <input
            className="field uppercase"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="BETA-XXXX-XXXX"
            autoCapitalize="characters"
          />
          <button type="button" disabled={loading || !code.trim()} onClick={() => void redeem()} className="btn-primary justify-center disabled:bg-slate-200 disabled:text-slate-400">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
            適用する
          </button>
        </div>
      )}
      {message && <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-bold text-emerald-700">{message}</p>}
      {error && <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-600">{error}</p>}
    </section>
  );
}
