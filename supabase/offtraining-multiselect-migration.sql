do $$
declare
  column_name text;
begin
  foreach column_name in array array['equipment','location','focus_ability','target_trick_type','injury_concern']
  loop
    if exists (
      select 1 from information_schema.columns as c
      where table_schema='public' and table_name='offtraining_preferences'
        and c.column_name=column_name and data_type='text'
    ) then
      execute format(
        'alter table public.offtraining_preferences alter column %I type text[] using case when %I is null or %I = '''' then ''{}''::text[] else array[%I] end',
        column_name,column_name,column_name,column_name
      );
    end if;
  end loop;
end $$;
