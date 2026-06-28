"use client";

import Link from "next/link";
import AdminUserManagement from "@/components/AdminUserManagement";
import AuthButton from "@/components/AuthButton";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { canAccessAdminPage } from "@/lib/accessControl";
import { dataRepository } from "@/lib/storage";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [profile] = useSupabaseData(dataRepository.getProfile);

  if (loading || (user && !profile)) {
    return (
      <main>
        <PageHeader title="管理者ページ" eyebrow="ADMIN" back="/profile" />
        <div className="card py-12 text-center text-sm font-bold text-slate-400">権限を確認中...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <PageHeader title="管理者ページ" eyebrow="ADMIN" back="/profile" />
        <div className="card py-12 text-center">
          <p className="text-sm font-bold text-slate-500">管理者ページを利用するにはログインが必要です。</p>
          <div className="mt-5">
            <AuthButton />
          </div>
        </div>
      </main>
    );
  }

  if (!canAccessAdminPage(profile?.planType)) {
    return (
      <main>
        <PageHeader title="管理者ページ" eyebrow="ADMIN" back="/profile" />
        <div className="card py-12 text-center">
          <p className="text-sm font-bold text-rose-500">管理者権限が必要です</p>
          <Link href="/profile" className="mt-4 inline-flex rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500">
            プロフィールへ戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeader title="管理者ページ" eyebrow="ADMIN" back="/profile" />
      <p className="mb-5 text-sm font-bold leading-6 text-slate-500">
        ユーザーのplan_typeを変更できます。API側でもadmin権限を検証しています。
      </p>
      <AdminUserManagement />
    </main>
  );
}
