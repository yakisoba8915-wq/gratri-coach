alter table public.tricks
add column if not exists trick_type text not null default 'snow';

alter table public.tricks
add column if not exists related_snow_trick text not null default '';

alter table public.tricks
add column if not exists cautions text not null default '';

update public.tricks
set trick_type = 'snow'
where trick_type is null or trick_type not in ('snow', 'shibakatsu');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tricks_trick_type_check'
      and conrelid = 'public.tricks'::regclass
  ) then
    alter table public.tricks
    add constraint tricks_trick_type_check
    check (trick_type in ('snow', 'shibakatsu'));
  end if;
end $$;

drop index if exists public.tricks_name_lower_unique_idx;

create unique index if not exists tricks_name_type_lower_unique_idx
on public.tricks(lower(trim(name)), trick_type);

create index if not exists tricks_trick_type_idx
on public.tricks(trick_type);

alter table public.tricks
drop constraint if exists tricks_category_check;

alter table public.tricks
add constraint tricks_category_check
check (
  category in (
    'プレス系', 'オーリー系', 'ノーリー系', '乗り系',
    '180系', '360系', '540系',
    'プレス練習', '弾き練習', '回転練習', 'バランス練習',
    '乗り練習', '連続動作', 'その他'
  )
);
