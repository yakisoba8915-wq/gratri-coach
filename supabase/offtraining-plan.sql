create table if not exists public.offtraining_preferences (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  equipment text not null,
  weekly_days integer not null check (weekly_days between 1 and 7),
  session_minutes integer not null check (session_minutes > 0),
  location text not null,
  gym_available text not null,
  focus_ability text not null,
  target_trick_type text not null,
  exercise_habit text not null,
  injury_concern text not null,
  intensity text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offtraining_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  weekly_days integer not null,
  session_minutes integer not null,
  plan_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists offtraining_preferences_user_id_key on public.offtraining_preferences(user_id);
create unique index if not exists offtraining_plans_user_id_key on public.offtraining_plans(user_id);
alter table public.offtraining_preferences enable row level security;
alter table public.offtraining_plans enable row level security;

drop policy if exists "Users manage own offtraining preferences" on public.offtraining_preferences;
create policy "Users manage own offtraining preferences" on public.offtraining_preferences for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "Users manage own offtraining plans" on public.offtraining_plans;
create policy "Users manage own offtraining plans" on public.offtraining_plans for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
