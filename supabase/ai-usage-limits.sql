create extension if not exists pgcrypto;

alter table public.profiles
add column if not exists plan_type text not null default 'free';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_plan_type_check;
  end if;

  update public.profiles
  set plan_type = 'free'
  where plan_type is null or plan_type not in ('free', 'premium', 'admin', 'beta_tester', 'editor');

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_plan_type_check
    check (plan_type in ('free', 'premium', 'admin', 'beta_tester', 'editor'));
  end if;
end $$;

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_type text not null check (feature_type in ('ai_chat', 'ai_advice', 'ai_video_analysis')),
  used_at timestamptz not null default now()
);

create index if not exists ai_usage_logs_user_id_idx on public.ai_usage_logs(user_id);
create index if not exists ai_usage_logs_feature_type_idx on public.ai_usage_logs(feature_type);
create index if not exists ai_usage_logs_used_at_idx on public.ai_usage_logs(used_at desc);

alter table public.ai_usage_logs enable row level security;

drop policy if exists "Users select own ai usage logs" on public.ai_usage_logs;
create policy "Users select own ai usage logs"
on public.ai_usage_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own ai usage logs" on public.ai_usage_logs;
create policy "Users insert own ai usage logs"
on public.ai_usage_logs
for insert
to authenticated
with check (auth.uid() = user_id);
