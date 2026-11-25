-- =====================================================================================================================
-- GameHub: points and the points leaderboard (Nov 2026, Inna: "add a points system in all games, remove Elo")
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again. Nothing existing is deleted
-- (the old Elo ratings stay in the database, they are just not shown any more).
--
--   add_points(n)          after every game each player's own browser adds the points it earned (1-12 per game;
--                          at most one call every 15 seconds, so nobody can pump their score)
--   points_board(scope)    the leaderboard: scope 'week' (resets every Monday), 'all' (all time) or 'friends'
--                          (you and your friends, this week). Top 50 + your own row.
-- =====================================================================================================================

create table if not exists public.points (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  total      int  not null default 0,
  week_start date not null default (date_trunc('week', now()))::date,
  week       int  not null default 0,
  games      int  not null default 0,
  week_games int  not null default 0,
  wins       int  not null default 0,
  week_wins  int  not null default 0,
  last_add   timestamptz
);
alter table public.points enable row level security;
revoke all on public.points from anon, authenticated;   -- only through the two functions below

create or replace function public.add_points(n int, won boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.points; wk date := (date_trunc('week', now()))::date;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then return null; end if;
  n := greatest(0, least(coalesce(n, 0), 12));
  select * into r from public.points where user_id = auth.uid() for update;
  if found and r.last_add > now() - interval '15 seconds' then return jsonb_build_object('total', r.total, 'week', r.week); end if;
  insert into public.points (user_id, total, week_start, week, games, week_games, wins, week_wins, last_add)
    values (auth.uid(), n, wk, n, 1, 1, case when won then 1 else 0 end, case when won then 1 else 0 end, now())
  on conflict (user_id) do update set
    total      = public.points.total + n,
    week       = case when public.points.week_start < wk then n else public.points.week + n end,
    week_games = case when public.points.week_start < wk then 1 else public.points.week_games + 1 end,
    week_wins  = case when public.points.week_start < wk then (case when won then 1 else 0 end) else public.points.week_wins + (case when won then 1 else 0 end) end,
    games      = public.points.games + 1,
    wins       = public.points.wins + (case when won then 1 else 0 end),
    week_start = wk,
    last_add   = now()
  returning * into r;
  return jsonb_build_object('total', r.total, 'week', r.week);
end $$;

create or replace function public.points_board(scope text default 'week')
returns table (rank bigint, user_id uuid, name text, avatar text, points int, games int, wins int, me boolean)
language sql stable security definer set search_path = public as $$
  with wk as (select (date_trunc('week', now()))::date as d),
  base as (
    select p.user_id, pr.name, pr.avatar,
           case when scope = 'all' then p.total when p.week_start = (select d from wk) then p.week else 0 end as points,
           case when scope = 'all' then p.games when p.week_start = (select d from wk) then p.week_games else 0 end as games,
           case when scope = 'all' then p.wins  when p.week_start = (select d from wk) then p.week_wins  else 0 end as wins
    from public.points p join public.profiles pr on pr.id = p.user_id
    where scope <> 'friends' or p.user_id = auth.uid() or exists (
      select 1 from public.friend_requests f where f.status = 'accepted'
        and ((f.from_id = auth.uid() and f.to_id = p.user_id) or (f.to_id = auth.uid() and f.from_id = p.user_id)))
  ),
  ranked as (select rank() over (order by points desc, games asc) as rank, * from base where points > 0)
  select rank, user_id, name, avatar, points, games, wins, user_id = auth.uid() from ranked
  where rank <= 50 or user_id = auth.uid()
  order by rank limit 51;
$$;

revoke all on function public.add_points(int, boolean) from public, anon;
revoke all on function public.points_board(text) from public, anon;
grant execute on function public.add_points(int, boolean) to authenticated;
grant execute on function public.points_board(text) to authenticated;
