create extension if not exists pgcrypto;

create table if not exists public.ai_advice_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_log_id text not null references public.practice_logs(id) on delete cascade,
  practice_video_id uuid not null references public.practice_videos(id) on delete cascade,
  analysis_result_id uuid not null references public.practice_video_analysis_results(id) on delete cascade,
  action_type text not null check (action_type in ('next_task', 'offtraining_plan', 'recommended_trick')),
  applied_to text not null check (applied_to in ('practice_logs', 'offtraining_plans', 'home_recommendations')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_advice_actions_user_id_idx on public.ai_advice_actions(user_id);
create index if not exists ai_advice_actions_practice_log_id_idx on public.ai_advice_actions(practice_log_id);
create index if not exists ai_advice_actions_practice_video_id_idx on public.ai_advice_actions(practice_video_id);
create index if not exists ai_advice_actions_analysis_result_id_idx on public.ai_advice_actions(analysis_result_id);
create index if not exists ai_advice_actions_created_at_idx on public.ai_advice_actions(created_at desc);

alter table public.ai_advice_actions enable row level security;

drop policy if exists "Users select own ai advice actions" on public.ai_advice_actions;
create policy "Users select own ai advice actions"
on public.ai_advice_actions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own ai advice actions" on public.ai_advice_actions;
create policy "Users insert own ai advice actions"
on public.ai_advice_actions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own ai advice actions" on public.ai_advice_actions;
create policy "Users update own ai advice actions"
on public.ai_advice_actions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own ai advice actions" on public.ai_advice_actions;
create policy "Users delete own ai advice actions"
on public.ai_advice_actions
for delete
to authenticated
using (auth.uid() = user_id);
