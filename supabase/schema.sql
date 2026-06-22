create table if not exists public.practice_logs (
  id text primary key,
  date date not null,
  resort_name text not null default '',
  trick_id text not null,
  success_count integer not null default 0 check (success_count >= 0),
  fail_count integer not null default 0 check (fail_count >= 0),
  memo text not null default '',
  self_analysis text not null default '',
  weak_point text not null default '',
  next_task text not null default '',
  snow_condition text not null default '不明',
  video_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id text primary key,
  season text not null,
  type text not null check (type in ('技をメイクする', '成功率を上げる')),
  trick_id text not null,
  target_rate integer check (target_rate between 0 and 100),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key default 'default',
  display_name text not null default 'グラトリビギナー',
  stance text not null default 'レギュラー' check (stance in ('レギュラー', 'グーフィー')),
  trick_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.practice_logs enable row level security;
alter table public.goals enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "MVP public access practice_logs" on public.practice_logs;
create policy "MVP public access practice_logs" on public.practice_logs for all to anon, authenticated using (true) with check (true);
drop policy if exists "MVP public access goals" on public.goals;
create policy "MVP public access goals" on public.goals for all to anon, authenticated using (true) with check (true);
drop policy if exists "MVP public access profiles" on public.profiles;
create policy "MVP public access profiles" on public.profiles for all to anon, authenticated using (true) with check (true);

insert into public.profiles (id) values ('default') on conflict (id) do nothing;
