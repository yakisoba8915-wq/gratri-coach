alter table public.profiles
  add column if not exists plan_type text not null default 'free';

update public.profiles
set plan_type = 'free'
where plan_type is null or plan_type not in ('free', 'premium', 'admin', 'beta_tester');

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

  alter table public.profiles
    add constraint profiles_plan_type_check
    check (plan_type in ('free', 'premium', 'admin', 'beta_tester'));
end $$;

alter table public.tricks
  add column if not exists access_type text not null default 'premium';

update public.tricks
set access_type = 'premium'
where access_type is null or access_type not in ('free', 'premium');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tricks_access_type_check'
      and conrelid = 'public.tricks'::regclass
  ) then
    alter table public.tricks
      add constraint tricks_access_type_check
      check (access_type in ('free', 'premium'));
  end if;
end $$;

create index if not exists tricks_access_type_idx on public.tricks(access_type);
