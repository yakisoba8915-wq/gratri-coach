create extension if not exists pgcrypto;

alter table public.tricks
  add column if not exists sort_order integer;

drop index if exists public.tricks_name_lower_unique_idx;

create unique index if not exists tricks_name_type_lower_unique_idx
on public.tricks(lower(trim(name)), trick_type);

alter table public.tricks
  drop constraint if exists tricks_category_check;

alter table public.tricks
  add constraint tricks_category_check
  check (
    category in (
      'プレス基礎', '弾き基礎', '180系', '乗り系', '360系', '弾き系発展', 'プレス発展', '高難度',
      'プレス系', 'オーリー系', 'ノーリー系', '540系', 'その他',
      'プレス練習', '弾き練習', '回転練習', 'バランス練習', '乗り練習', '連続動作'
    )
  );

alter table public.tricks
  drop constraint if exists tricks_takeoff_type_check;

alter table public.tricks
  add constraint tricks_takeoff_type_check
  check (takeoff_type in ('なし', 'オーリー', 'ノーリー', 'プレス', '乗り', 'その他'));

alter table public.tricks
  drop constraint if exists tricks_spin_direction_check;

alter table public.tricks
  add constraint tricks_spin_direction_check
  check (spin_direction in ('なし', 'FS', 'BS'));

with seed(sort_order, name, difficulty, category, prerequisite) as (
  values
    (1, 'バックノーズプレス', 1, 'プレス基礎', ''),
    (2, 'バックテールプレス', 1, 'プレス基礎', ''),
    (3, 'フロントノーズプレス', 1, 'プレス基礎', ''),
    (4, 'フロントテールプレス', 1, 'プレス基礎', ''),
    (5, 'オーリー', 2, '弾き基礎', ''),
    (6, 'ノーリー', 2, '弾き基礎', ''),
    (7, 'オーリーBS180', 3, '180系', 'オーリー'),
    (8, 'オーリーFS180', 3, '180系', 'オーリー'),
    (9, 'ノーリーBS180', 4, '180系', 'ノーリー'),
    (10, 'ノーリーFS180', 4, '180系', 'ノーリー'),
    (11, 'オーウェン', 5, '乗り系', 'バックノーズプレス、オーリーBS180'),
    (12, 'ソネ', 5, '乗り系', 'フロントテールプレス、ノーリーFS180'),
    (13, 'オーリーBS360', 6, '360系', 'オーリーBS180'),
    (14, 'オーリーFS360', 6, '360系', 'オーリーFS180'),
    (15, 'ノーリーBS360', 7, '360系', 'ノーリーBS180'),
    (16, 'ノーリーFS360', 7, '360系', 'ノーリーFS180'),
    (17, 'アンディ', 7, '弾き系発展', 'オーリーBS180'),
    (18, 'バックノーズ180', 5, 'プレス発展', 'バックノーズプレス、オーリーBS180'),
    (19, 'フロントテール180', 5, 'プレス発展', 'フロントテールプレス、オーリーFS180'),
    (20, 'FSノーリー540', 9, '高難度', 'ノーリーFS360')
),
updated as (
  update public.tricks t
  set
    difficulty = s.difficulty,
    category = s.category,
    prerequisite = s.prerequisite,
    trick_type = 'snow',
    access_type = 'free',
    stance = 'both',
    is_official = true,
    created_by = null,
    sort_order = s.sort_order
  from seed s
  where lower(trim(t.name)) = lower(trim(s.name))
    and t.trick_type = 'snow'
  returning t.id
)
insert into public.tricks (
  name,
  difficulty,
  category,
  takeoff_type,
  spin_direction,
  description,
  tips,
  prerequisite,
  trick_type,
  stance,
  access_type,
  related_snow_trick,
  cautions,
  created_by,
  is_official,
  sort_order
)
select
  s.name,
  s.difficulty,
  s.category,
  'なし',
  'なし',
  '',
  '',
  s.prerequisite,
  'snow',
  'both',
  'free',
  '',
  '',
  null,
  true,
  s.sort_order
from seed s
where not exists (
  select 1
  from public.tricks t
  where lower(trim(t.name)) = lower(trim(s.name))
    and t.trick_type = 'snow'
);
