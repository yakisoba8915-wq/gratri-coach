create extension if not exists pgcrypto;

create table if not exists public.practice_video_analysis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_video_id uuid not null references public.practice_videos(id) on delete cascade,
  practice_log_id text not null references public.practice_logs(id) on delete cascade,
  trick_id text not null,
  summary text not null default '',
  likely_issues jsonb not null default '[]'::jsonb,
  improvement_points jsonb not null default '[]'::jsonb,
  next_practice jsonb not null default '[]'::jsonb,
  shibakatsu_advice jsonb not null default '[]'::jsonb,
  confidence text not null default 'low' check (confidence in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create index if not exists practice_video_analysis_results_user_id_idx on public.practice_video_analysis_results(user_id);
create index if not exists practice_video_analysis_results_practice_video_id_idx on public.practice_video_analysis_results(practice_video_id);
create index if not exists practice_video_analysis_results_practice_log_id_idx on public.practice_video_analysis_results(practice_log_id);
create index if not exists practice_video_analysis_results_trick_id_idx on public.practice_video_analysis_results(trick_id);
create index if not exists practice_video_analysis_results_created_at_idx on public.practice_video_analysis_results(created_at desc);

alter table public.practice_video_analysis_results enable row level security;

drop policy if exists "Users select own practice video analysis results" on public.practice_video_analysis_results;
create policy "Users select own practice video analysis results"
on public.practice_video_analysis_results
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own practice video analysis results" on public.practice_video_analysis_results;
create policy "Users insert own practice video analysis results"
on public.practice_video_analysis_results
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own practice video analysis results" on public.practice_video_analysis_results;
create policy "Users update own practice video analysis results"
on public.practice_video_analysis_results
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own practice video analysis results" on public.practice_video_analysis_results;
create policy "Users delete own practice video analysis results"
on public.practice_video_analysis_results
for delete
to authenticated
using (auth.uid() = user_id);
