alter table public.profiles
  add column if not exists plan_type text not null default 'free';

update public.profiles
set plan_type = 'free'
where plan_type is null or plan_type not in ('free', 'premium', 'beta_tester', 'editor', 'admin');

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
    check (plan_type in ('free', 'premium', 'beta_tester', 'editor', 'admin'));
end $$;
