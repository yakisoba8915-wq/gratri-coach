create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'practice-videos',
  'practice-videos',
  false,
  104857600,
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.practice_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_log_id text not null references public.practice_logs(id) on delete cascade,
  trick_id text not null,
  file_url text not null default '',
  file_path text not null,
  file_name text not null,
  file_size bigint not null default 0,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists practice_videos_user_id_idx on public.practice_videos(user_id);
create index if not exists practice_videos_practice_log_id_idx on public.practice_videos(practice_log_id);

alter table public.practice_videos enable row level security;

drop policy if exists "Users select own practice videos" on public.practice_videos;
create policy "Users select own practice videos"
on public.practice_videos
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own practice videos" on public.practice_videos;
create policy "Users insert own practice videos"
on public.practice_videos
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own practice videos" on public.practice_videos;
create policy "Users update own practice videos"
on public.practice_videos
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own practice videos" on public.practice_videos;
create policy "Users delete own practice videos"
on public.practice_videos
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users read own practice video files" on storage.objects;
create policy "Users read own practice video files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'practice-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users upload own practice video files" on storage.objects;
create policy "Users upload own practice video files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'practice-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own practice video files" on storage.objects;
create policy "Users update own practice video files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'practice-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'practice-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own practice video files" on storage.objects;
create policy "Users delete own practice video files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'practice-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
