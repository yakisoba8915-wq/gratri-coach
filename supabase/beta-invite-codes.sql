create extension if not exists pgcrypto;

create table if not exists public.beta_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  max_uses integer not null default 1 check (max_uses >= 1),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.beta_invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.beta_invite_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (code_id, user_id)
);

alter table public.beta_invite_codes enable row level security;
alter table public.beta_invite_redemptions enable row level security;

drop policy if exists "No direct beta invite code reads" on public.beta_invite_codes;
create policy "No direct beta invite code reads"
on public.beta_invite_codes
for select
to authenticated
using (false);

drop policy if exists "No direct beta invite code inserts" on public.beta_invite_codes;
create policy "No direct beta invite code inserts"
on public.beta_invite_codes
for insert
to authenticated
with check (false);

drop policy if exists "No direct beta invite code updates" on public.beta_invite_codes;
create policy "No direct beta invite code updates"
on public.beta_invite_codes
for update
to authenticated
using (false)
with check (false);

drop policy if exists "No direct beta invite code deletes" on public.beta_invite_codes;
create policy "No direct beta invite code deletes"
on public.beta_invite_codes
for delete
to authenticated
using (false);

drop policy if exists "No direct beta invite redemption reads" on public.beta_invite_redemptions;
create policy "No direct beta invite redemption reads"
on public.beta_invite_redemptions
for select
to authenticated
using (false);

drop policy if exists "No direct beta invite redemption inserts" on public.beta_invite_redemptions;
create policy "No direct beta invite redemption inserts"
on public.beta_invite_redemptions
for insert
to authenticated
with check (false);

drop policy if exists "No direct beta invite redemption updates" on public.beta_invite_redemptions;
create policy "No direct beta invite redemption updates"
on public.beta_invite_redemptions
for update
to authenticated
using (false)
with check (false);

drop policy if exists "No direct beta invite redemption deletes" on public.beta_invite_redemptions;
create policy "No direct beta invite redemption deletes"
on public.beta_invite_redemptions
for delete
to authenticated
using (false);

create index if not exists beta_invite_codes_code_idx on public.beta_invite_codes (code);
create index if not exists beta_invite_redemptions_user_id_idx on public.beta_invite_redemptions (user_id);
