-- GameHub: public game stats for player cards and profile pages (Nov 2026)
-- Run once in Supabase (SQL Editor -> New query -> paste -> Run). Safe to run again.
--   publish_stats(p)   each player's own browser sends a small summary of its stats (level, games, wins per game,
--                      badges, last results). Only numbers and game names: never an email.
--   player_stats(id)   read a player's summary (shown on their player card and profile page)
create table if not exists public.public_stats (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 20000),
  updated_at timestamptz not null default now()
);
alter table public.public_stats enable row level security;
revoke all on public.public_stats from anon, authenticated;

create or replace function public.publish_stats(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if jsonb_typeof(p) <> 'object' or pg_column_size(p) > 20000 then raise exception 'bad stats'; end if;
  insert into public.public_stats (user_id, data, updated_at) values (auth.uid(), p, now())
  on conflict (user_id) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.player_stats(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select data from public.public_stats where user_id = p_id;
$$;

revoke all on function public.publish_stats(jsonb) from public, anon;
revoke all on function public.player_stats(uuid) from public, anon;
grant execute on function public.publish_stats(jsonb) to authenticated;
grant execute on function public.player_stats(uuid) to authenticated;
