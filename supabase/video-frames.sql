create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'practice-video-frames',
  'practice-video-frames',
  false,
  10485760,
  array['image/jpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.practice_video_frames (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_video_id uuid not null references public.practice_videos(id) on delete cascade,
  practice_log_id text not null references public.practice_logs(id) on delete cascade,
  frame_url text not null default '',
  frame_path text not null,
  frame_index integer not null check (frame_index >= 1),
  captured_at_percent integer not null check (captured_at_percent between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists practice_video_frames_user_id_idx on public.practice_video_frames(user_id);
create index if not exists practice_video_frames_practice_video_id_idx on public.practice_video_frames(practice_video_id);
create index if not exists practice_video_frames_practice_log_id_idx on public.practice_video_frames(practice_log_id);

alter table public.practice_video_frames enable row level security;

drop policy if exists "Users select own practice video frames" on public.practice_video_frames;
create policy "Users select own practice video frames"
on public.practice_video_frames
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own practice video frames" on public.practice_video_frames;
create policy "Users insert own practice video frames"
on public.practice_video_frames
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own practice video frames" on public.practice_video_frames;
create policy "Users delete own practice video frames"
on public.practice_video_frames
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users read own practice video frame files" on storage.objects;
create policy "Users read own practice video frame files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'practice-video-frames'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users upload own practice video frame files" on storage.objects;
create policy "Users upload own practice video frame files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'practice-video-frames'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own practice video frame files" on storage.objects;
create policy "Users update own practice video frame files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'practice-video-frames'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'practice-video-frames'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own practice video frame files" on storage.objects;
create policy "Users delete own practice video frame files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'practice-video-frames'
  and (storage.foldername(name))[1] = auth.uid()::text
);
