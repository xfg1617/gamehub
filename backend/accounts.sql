-- GameHub accounts: each account's progress (XP, stats, streaks, match history...) saved online,
-- so logging in on another device brings it back. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run again.

create table if not exists public.saves (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null check (pg_column_size(data) < 400000),
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;
grant select, insert, update on public.saves to authenticated;

-- you can only read and write your own save
drop policy if exists "read own save" on public.saves;
create policy "read own save" on public.saves for select using (auth.uid() = user_id);
drop policy if exists "add own save" on public.saves;
create policy "add own save" on public.saves for insert with check (auth.uid() = user_id);
drop policy if exists "change own save" on public.saves;
create policy "change own save" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
