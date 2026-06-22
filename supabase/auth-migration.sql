alter table public.practice_logs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.goals add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.practice_logs alter column user_id set default auth.uid();
alter table public.goals alter column user_id set default auth.uid();
alter table public.profiles alter column user_id set default auth.uid();

create index if not exists practice_logs_user_id_idx on public.practice_logs(user_id);
create index if not exists goals_user_id_idx on public.goals(user_id);
create unique index if not exists profiles_user_id_key on public.profiles(user_id);

drop policy if exists "MVP public access practice_logs" on public.practice_logs;
drop policy if exists "MVP public access goals" on public.goals;
drop policy if exists "MVP public access profiles" on public.profiles;

drop policy if exists "Users manage own practice logs" on public.practice_logs;
create policy "Users manage own practice logs" on public.practice_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own goals" on public.goals;
create policy "Users manage own goals" on public.goals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
