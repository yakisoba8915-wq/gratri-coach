alter table public.tricks
  add column if not exists stance text not null default 'both';

update public.tricks
set stance = 'both'
where stance is null or stance not in ('regular', 'goofy', 'both');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tricks_stance_check'
      and conrelid = 'public.tricks'::regclass
  ) then
    alter table public.tricks
      add constraint tricks_stance_check check (stance in ('regular', 'goofy', 'both'));
  end if;
end $$;
