create extension if not exists pgcrypto;

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('不具合報告', '改善要望', '機能提案', 'その他')),
  target_screen text not null check (target_screen in ('ホーム', 'トリック', '練習', 'オフトレ', 'AI対話', 'プロフィール', 'その他')),
  message text not null check (char_length(trim(message)) > 0),
  priority text not null check (priority in ('低', '中', '高')),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_user_id_idx on public.user_feedback(user_id);
create index if not exists user_feedback_created_at_idx on public.user_feedback(created_at desc);
create index if not exists user_feedback_status_idx on public.user_feedback(status);

alter table public.user_feedback enable row level security;

drop policy if exists "Users select own feedback" on public.user_feedback;
create policy "Users select own feedback"
on public.user_feedback
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own feedback" on public.user_feedback;
create policy "Users insert own feedback"
on public.user_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

-- update / delete policies are intentionally omitted.
-- Users can only submit and view their own feedback.
