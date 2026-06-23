alter table public.practice_logs
add column if not exists training_type text not null default 'snow';

update public.practice_logs
set training_type = 'snow'
where training_type is null or training_type not in ('snow', 'shibakatsu');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'practice_logs_training_type_check'
      and conrelid = 'public.practice_logs'::regclass
  ) then
    alter table public.practice_logs
    add constraint practice_logs_training_type_check
    check (training_type in ('snow', 'shibakatsu'));
  end if;
end $$;

alter table public.practice_logs
add column if not exists shibakatsu_menu text,
add column if not exists duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
add column if not exists reps integer check (reps is null or reps >= 0),
add column if not exists sets integer check (sets is null or sets >= 0);

create index if not exists practice_logs_training_type_idx on public.practice_logs(training_type);

-- RLSは既存の user_id ベースのポリシーを維持します。
