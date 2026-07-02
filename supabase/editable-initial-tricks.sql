alter table public.tricks
  add column if not exists source_trick_id text;

create unique index if not exists tricks_source_trick_id_unique_idx
on public.tricks(source_trick_id)
where source_trick_id is not null;

create index if not exists tricks_source_trick_id_idx
on public.tricks(source_trick_id);

-- 初期20トリックを編集する場合は、元のコード定義IDを source_trick_id に保存する。
-- 例: source_trick_id = 'ollie'
-- アプリ側では source_trick_id があるDB行を初期トリックの上書きとして扱う。
