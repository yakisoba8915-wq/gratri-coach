create extension if not exists pgcrypto;

create table if not exists public.ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  message text not null,
  source_type text not null check (source_type in ('chat', 'advice', 'video_analysis', 'training_plan')),
  related_practice_log_id text references public.practice_logs(id) on delete set null,
  related_video_id uuid references public.practice_videos(id) on delete set null,
  related_analysis_result_id uuid references public.practice_video_analysis_results(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_coach_messages_user_id_idx on public.ai_coach_messages(user_id);
create index if not exists ai_coach_messages_source_type_idx on public.ai_coach_messages(source_type);
create index if not exists ai_coach_messages_created_at_idx on public.ai_coach_messages(created_at desc);
create index if not exists ai_coach_messages_related_practice_log_id_idx on public.ai_coach_messages(related_practice_log_id);
create index if not exists ai_coach_messages_related_video_id_idx on public.ai_coach_messages(related_video_id);
create index if not exists ai_coach_messages_related_analysis_result_id_idx on public.ai_coach_messages(related_analysis_result_id);

alter table public.ai_coach_messages enable row level security;

drop policy if exists "Users select own ai coach messages" on public.ai_coach_messages;
create policy "Users select own ai coach messages"
on public.ai_coach_messages
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own ai coach messages" on public.ai_coach_messages;
create policy "Users insert own ai coach messages"
on public.ai_coach_messages
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own ai coach messages" on public.ai_coach_messages;
create policy "Users update own ai coach messages"
on public.ai_coach_messages
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own ai coach messages" on public.ai_coach_messages;
create policy "Users delete own ai coach messages"
on public.ai_coach_messages
for delete
to authenticated
using (auth.uid() = user_id);
