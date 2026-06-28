"use client";

import { RefreshCw, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getAiRequestHeaders } from "@/lib/aiUsageLimits";
import { planLabel } from "@/lib/accessControl";
import type { PlanType } from "@/lib/types";

const editablePlanTypes: PlanType[] = ["free", "premium", "beta_tester", "editor", "admin"];

interface AdminUser {
  userId: string;
  displayName: string;
  email: string | null;
  stance: string;
  planType: PlanType;
  createdAt: string | null;
}

interface AdminUsersResponse {
  users?: AdminUser[];
  error?: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PlanType>>({});
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers(): Promise<void> {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        headers: await getAiRequestHeaders(),
      });
      const data = (await response.json().catch(() => ({}))) as AdminUsersResponse;
      if (!response.ok) throw new Error(data.error || "ユーザー一覧の取得に失敗しました。");
      const nextUsers = data.users ?? [];
      setUsers(nextUsers);
      setDrafts(Object.fromEntries(nextUsers.map((user) => [user.userId, user.planType])));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ユーザー一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function updatePlan(user: AdminUser): Promise<void> {
    const planType = drafts[user.userId] ?? user.planType;
    setSavingUserId(user.userId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.userId)}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await getAiRequestHeaders()) },
        body: JSON.stringify({ planType }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "更新に失敗しました。");
      setUsers((current) => current.map((item) => item.userId === user.userId ? { ...item, planType } : item));
      setMessage("更新しました");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("gratri-storage"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "更新に失敗しました。");
    } finally {
      setSavingUserId("");
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">ユーザー一覧</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">plan_type を変更できます</p>
        </div>
        <button type="button" onClick={() => void loadUsers()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
          <RefreshCw size={14} />
          再読み込み
        </button>
      </div>

      {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</p>}
      {loading && <div className="card py-12 text-center text-sm font-bold text-slate-400">ユーザー一覧を読み込み中...</div>}

      {!loading && users.length === 0 && <div className="card py-12 text-center text-sm font-bold text-slate-400">ユーザーが見つかりません</div>}

      <div className="grid gap-3">
        {users.map((user) => {
          const draft = drafts[user.userId] ?? user.planType;
          const changed = draft !== user.planType;
          return (
            <article key={user.userId} className="card">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ice text-glacier">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{user.displayName || "名前未設定"}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{planLabel(user.planType)}</span>
                  </div>
                  <p className="mt-1 break-all text-[11px] font-bold text-slate-400">ID: {user.userId}</p>
                  {user.email && <p className="mt-1 break-all text-[11px] font-bold text-slate-400">Email: {user.email}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-500">
                    {user.stance && <span className="rounded-full bg-slate-50 px-2 py-1">stance: {user.stance}</span>}
                    {user.createdAt && <span className="rounded-full bg-slate-50 px-2 py-1">created: {new Date(user.createdAt).toLocaleDateString("ja-JP")}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  className="field"
                  value={draft}
                  onChange={(event) => setDrafts((current) => ({ ...current, [user.userId]: event.target.value as PlanType }))}
                >
                  {editablePlanTypes.map((planType) => (
                    <option key={planType} value={planType}>
                      {planLabel(planType)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!changed || savingUserId === user.userId}
                  onClick={() => void updatePlan(user)}
                  className="btn-primary justify-center disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <Save size={16} />
                  {savingUserId === user.userId ? "保存中..." : "保存"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
