create extension if not exists pgcrypto;

create table if not exists public.tricks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  difficulty integer not null check (difficulty between 1 and 10),
  category text not null check (category in ('プレス系', 'オーリー系', 'ノーリー系', '乗り系', '180系', '360系', '540系', 'プレス練習', '弾き練習', '回転練習', 'バランス練習', '乗り練習', '連続動作', 'その他')),
  takeoff_type text not null default 'なし' check (takeoff_type in ('なし', 'オーリー', 'ノーリー', 'プレス', '乗り', 'その他')),
  spin_direction text not null default 'なし' check (spin_direction in ('なし', 'FS', 'BS')),
  description text not null default '',
  tips text not null default '',
  prerequisite text not null default '',
  trick_type text not null default 'snow' check (trick_type in ('snow', 'shibakatsu')),
  related_snow_trick text not null default '',
  cautions text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  is_official boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists tricks_name_type_lower_unique_idx on public.tricks(lower(trim(name)), trick_type);
create index if not exists tricks_trick_type_idx on public.tricks(trick_type);
create index if not exists tricks_created_at_idx on public.tricks(created_at desc);
create index if not exists tricks_created_by_idx on public.tricks(created_by);

alter table public.tricks enable row level security;

drop policy if exists "Anyone can select tricks" on public.tricks;
create policy "Anyone can select tricks"
on public.tricks
for select
to anon, authenticated
using (true);

-- insert / update / delete policies are intentionally omitted.
-- Mutations are performed only by the server API with the service role key.
