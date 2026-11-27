-- =====================================================================================================================
-- GameHub: the owner's private stats page (Nov 2026, Inna). Run once in Supabase: SQL Editor -> New query -> paste ->
-- Run. Safe to run again. It only ADDS a small table and two functions; nothing existing is changed or deleted.
--
-- How it stays private: the numbers are worked out here, on the server, and owner_stats() refuses to answer anyone
-- who is not in site_owners. Nobody can read or change site_owners from the website (only from this SQL Editor).
-- The page only shows counts (no emails, no names, nothing about any single player).
--
-- AFTER running this file, make yourself the owner (one time). In a NEW query, type your own login email between the
-- quotes and run it (keep your email out of any file):
--     insert into public.site_owners (user_id)
--       select id from auth.users where email = 'your-email-here' on conflict do nothing;
-- =====================================================================================================================

create table if not exists public.site_owners (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.site_owners enable row level security;
revoke all on public.site_owners from anon, authenticated;     -- no website access at all

-- "am I the owner?" (the site uses it to show the Site stats button to you only)
create or replace function public.is_site_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.site_owners where user_id = auth.uid());
$$;

-- all the numbers for the stats page, in one answer (only for the owner). tz = the time zone of the device the page is
-- opened on (e.g. 'America/Indiana/Indianapolis', 'Asia/Ho_Chi_Minh'), so "today" and each day follow the owner's clock
drop function if exists public.owner_stats();
create or replace function public.owner_stats(tz text default 'UTC') returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare r jsonb; today date;
begin
  if not exists (select 1 from public.site_owners where user_id = auth.uid()) then
    raise exception 'This page is private.';
  end if;
  if tz is null or not exists (select 1 from pg_timezone_names where name = tz) then tz := 'UTC'; end if;
  today := (now() at time zone tz)::date;
  with u as (
    select au.id, au.created_at, coalesce(au.is_anonymous, false) as anon, au.last_sign_in_at,
           coalesce((s.data->>'played')::int, 0) as played, s.updated_at as stats_at, s.data
    from auth.users au
    left join public.public_stats s on s.user_id = au.id
    left join public.profiles p on p.id = au.id
    where coalesce(p.name, '') not ilike 'test pilot%'            -- Claude's test players don't count
  ),
  days as (select generate_series(today - 13, today, interval '1 day')::date as d)
  select jsonb_build_object(
    'total',        (select count(*) from u),
    'accounts',     (select count(*) from u where not anon),
    'played',       (select count(*) from u where played > 0),
    'returned',     (select count(*) from u where stats_at::date > created_at::date or last_sign_in_at > created_at + interval '1 hour'),
    'new_today',    (select count(*) from u where (created_at at time zone tz)::date = today),
    'active_today', (select count(*) from u where (stats_at at time zone tz)::date = today or (last_sign_in_at at time zone tz)::date = today),
    'games_total',  (select coalesce(sum(played), 0) from u),
    'days', (select jsonb_agg(jsonb_build_object(
        'd', d,
        'new',      (select count(*) from u where (created_at at time zone tz)::date = d),
        'played',   (select count(*) from u where (created_at at time zone tz)::date = d and played > 0),
        'accounts', (select count(*) from u where (created_at at time zone tz)::date = d and not anon),
        'rooms',    (select count(*) from public.rooms where (created_at at time zone tz)::date = d),
        'chats',    (select count(*) from public.messages where (created_at at time zone tz)::date = d)
      ) order by d) from days),
    'games', (select coalesce(jsonb_agg(jsonb_build_object('g', g, 'n', n, 'p', p) order by n desc), '[]'::jsonb) from (
        select e.key as g, sum((e.value->>0)::int) as n, count(*) as p
        from u, jsonb_each(coalesce(u.data->'games', '{}'::jsonb)) as e
        where jsonb_typeof(e.value) = 'array' and (e.value->>0)::int > 0
        group by e.key) x)
  ) into r;
  return r;
end $$;

revoke all on function public.is_site_owner() from public, anon;
revoke all on function public.owner_stats(text) from public, anon;
grant execute on function public.is_site_owner() to authenticated;
grant execute on function public.owner_stats(text) to authenticated;
