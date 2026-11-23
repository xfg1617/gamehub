-- =====================================================================================
-- PlayStack online service. Run this ONCE in Supabase:  SQL Editor -> New query -> paste all -> Run.
-- It is safe to run again (it only creates what is missing and replaces the functions).
--
-- What it sets up:
--   profiles  one row per player (unique name + avatar). Accounts are created automatically
--             ("anonymous sign-in"): no email, no password.
--   ratings   Elo per player per game. Only the functions below can change it, so nobody can fake it.
--   rooms     game tables: who is in it, the moves so far, and the result.
--   messages  chat (global + one room per game), with a swear filter, a speed limit and reports.
-- =====================================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 2 and 20),
  avatar text not null default '🦊',
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_name_unique on public.profiles (lower(name));

create table if not exists public.ratings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  game text not null,
  elo int not null default 1200,
  games int not null default 0, wins int not null default 0, losses int not null default 0, draws int not null default 0,
  primary key (user_id, game)
);

create table if not exists public.rooms (
  code text primary key,
  game text not null,
  settings jsonb not null default '{}',
  is_public boolean not null default false,          -- public = quick match = ranked; private rooms are friendly games
  host uuid not null references public.profiles (id) on delete cascade,
  guest uuid references public.profiles (id) on delete cascade,
  first uuid,                                        -- who moves first (chosen at random when the guest arrives)
  status text not null default 'waiting',            -- waiting | playing | done
  moves jsonb not null default '[]',
  host_report text, guest_report text,
  host_seen timestamptz not null default now(), guest_seen timestamptz,
  result jsonb,
  created_at timestamptz not null default now()
);
create index if not exists rooms_waiting on public.rooms (game, status, is_public, created_at);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  room text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists messages_room on public.messages (room, id desc);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  message_id bigint not null references public.messages (id) on delete cascade,
  reporter uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (message_id, reporter)
);

-- ---------- who may read and write what ----------
-- newer Supabase projects don't open tables to the website automatically, so say exactly what is allowed
-- (the row rules below still decide WHICH rows each player may see or change)
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.ratings, public.rooms, public.messages to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert on public.messages, public.reports to authenticated;
alter table public.profiles enable row level security;
alter table public.ratings  enable row level security;
alter table public.rooms    enable row level security;
alter table public.messages enable row level security;
alter table public.reports  enable row level security;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "make your own profile" on public.profiles;
create policy "make your own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "edit your own profile" on public.profiles;
create policy "edit your own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "ratings are public" on public.ratings;
create policy "ratings are public" on public.ratings for select using (true);      -- no write policy on purpose

drop policy if exists "rooms are public" on public.rooms;
create policy "rooms are public" on public.rooms for select using (true);          -- changed only by the functions below

-- a message reported by 3 different people is hidden from everyone
create or replace function public.report_count(mid bigint) returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.reports where message_id = mid;
$$;
drop policy if exists "read chat" on public.messages;
create policy "read chat" on public.messages for select using (public.report_count(id) < 3);
drop policy if exists "send as yourself" on public.messages;
create policy "send as yourself" on public.messages for insert with check (auth.uid() = user_id);

drop policy if exists "report as yourself" on public.reports;
create policy "report as yourself" on public.reports for insert with check (auth.uid() = reporter);

-- ---------- chat: speed limit + swear filter ----------
create or replace function public.chat_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare bad text;
begin
  if (select count(*) from public.messages where user_id = new.user_id and created_at > now() - interval '10 seconds') >= 5 then
    raise exception 'slow down';
  end if;
  foreach bad in array array['fuck','shit','bitch','cunt','nigg','fag','retard','whore','slut','dick','pussy','kys'] loop
    new.text := regexp_replace(new.text, bad || '\w*', repeat('*', length(bad) + 2), 'gi');
  end loop;
  return new;
end $$;
drop trigger if exists chat_guard on public.messages;
create trigger chat_guard before insert on public.messages for each row execute function public.chat_guard();

-- ---------- rooms ----------
create or replace function public.new_code() returns text language plpgsql as $$
declare c text; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  loop
    c := '';
    for i in 1..4 loop c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
    exit when not exists (select 1 from public.rooms where code = c and status <> 'done' and created_at > now() - interval '1 day');
  end loop;
  return c;
end $$;

create or replace function public.create_room(p_game text, p_settings jsonb, p_public boolean, p_code text default null)
returns public.rooms language plpgsql security definer set search_path = public as $$
declare r public.rooms; c text := upper(coalesce(p_code, ''));
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if c !~ '^[A-Z0-9]{4,6}$' or exists (select 1 from public.rooms where code = c and status <> 'done' and created_at > now() - interval '1 day') then
    c := public.new_code();
  end if;
  delete from public.rooms where code = c;
  insert into public.rooms (code, game, settings, is_public, host) values (c, p_game, coalesce(p_settings, '{}'), p_public, auth.uid()) returning * into r;
  return r;
end $$;

create or replace function public.join_room(p_code text) returns public.rooms language plpgsql security definer set search_path = public as $$
declare r public.rooms;
begin
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found then raise exception 'no such room'; end if;
  if r.host = auth.uid() or r.guest = auth.uid() then return r; end if;
  if r.guest is not null then raise exception 'room is full'; end if;
  if r.status <> 'waiting' then raise exception 'game is over'; end if;
  update public.rooms set guest = auth.uid(), status = 'playing', guest_seen = now(),
    first = case when random() < 0.5 then host else auth.uid() end
  where code = r.code returning * into r;
  return r;
end $$;

create or replace function public.quick_match(p_game text, p_settings jsonb) returns public.rooms language plpgsql security definer set search_path = public as $$
declare r public.rooms;
begin
  select * into r from public.rooms
   where game = p_game and is_public and status = 'waiting' and guest is null and host <> auth.uid() and host_seen > now() - interval '30 seconds'
   order by created_at limit 1 for update skip locked;
  if found then
    update public.rooms set guest = auth.uid(), status = 'playing', guest_seen = now(),
      first = case when random() < 0.5 then host else auth.uid() end
    where code = r.code returning * into r;
    return r;
  end if;
  update public.rooms set status = 'done' where host = auth.uid() and status = 'waiting';
  return public.create_room(p_game, p_settings, true, null);
end $$;

create or replace function public.room_ping(p_code text) returns void language sql security definer set search_path = public as $$
  update public.rooms set host_seen = case when host = auth.uid() then now() else host_seen end,
                          guest_seen = case when guest = auth.uid() then now() else guest_seen end
  where code = p_code and (host = auth.uid() or guest = auth.uid());
$$;

create or replace function public.leave_room(p_code text) returns void language sql security definer set search_path = public as $$
  update public.rooms set status = 'done' where code = p_code and host = auth.uid() and status = 'waiting';
$$;

-- a move: only the two players, only in turn (special moves like 'resign' have their own type)
create or replace function public.add_move(p_code text, p_move jsonb, p_index int) returns int language plpgsql security definer set search_path = public as $$
declare r public.rooms; me uuid := auth.uid(); n int; cnt int; expect uuid;
begin
  select * into r from public.rooms where code = p_code for update;
  if not found or (me <> r.host and me is distinct from r.guest) then raise exception 'not your room'; end if;
  if r.status <> 'playing' then raise exception 'game is not running'; end if;
  n := jsonb_array_length(r.moves);
  if p_index <> n then raise exception 'out of sync'; end if;
  if coalesce(p_move->>'t', 'move') = 'move' then
    select count(*) into cnt from jsonb_array_elements(r.moves) e where coalesce(e->>'t', 'move') = 'move';
    expect := case when cnt % 2 = 0 then r.first else (case when r.first = r.host then r.guest else r.host end) end;
    if me <> expect then raise exception 'not your turn'; end if;
  end if;
  update public.rooms set moves = moves || jsonb_build_array(p_move || jsonb_build_object('by', me, 'n', n)) where code = p_code;
  return n + 1;
end $$;

-- a result: both players report; when they agree, Elo changes (public = ranked games only).
-- If one player has gone (no heartbeat for 60 s), the other's report counts. Admitting a loss always counts.
create or replace function public.report_result(p_code text, p_result text) returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.rooms; me uuid := auth.uid(); hr text; gr text; ra int; rb int; d int := 0;
begin
  if p_result not in ('win', 'loss', 'draw') then raise exception 'bad result'; end if;
  select * into r from public.rooms where code = p_code for update;
  if not found or r.guest is null or (me <> r.host and me <> r.guest) then raise exception 'not your game'; end if;
  if r.status = 'done' then return coalesce(r.result, '{}'::jsonb) || '{"final": true}'::jsonb; end if;
  if me = r.host then update public.rooms set host_report = p_result where code = p_code returning * into r;
  else update public.rooms set guest_report = p_result where code = p_code returning * into r; end if;
  hr := r.host_report; gr := r.guest_report;
  if hr is not null and gr is not null then
    if not ((hr = 'win' and gr = 'loss') or (hr = 'loss' and gr = 'win') or (hr = 'draw' and gr = 'draw')) then
      update public.rooms set status = 'done', result = '{"disputed": true}' where code = p_code;
      return '{"final": true, "disputed": true}'::jsonb;
    end if;
  elsif hr is not null and (hr = 'loss' or coalesce(r.guest_seen, r.created_at) < now() - interval '60 seconds') then
    gr := case hr when 'win' then 'loss' when 'loss' then 'win' else 'draw' end;
  elsif gr is not null and (gr = 'loss' or r.host_seen < now() - interval '60 seconds') then
    hr := case gr when 'win' then 'loss' when 'loss' then 'win' else 'draw' end;
  else
    return '{"final": false}'::jsonb;
  end if;
  insert into public.ratings (user_id, game) values (r.host, r.game), (r.guest, r.game) on conflict do nothing;
  select elo into ra from public.ratings where user_id = r.host and game = r.game for update;
  select elo into rb from public.ratings where user_id = r.guest and game = r.game for update;
  if r.is_public then
    d := round(32 * ((case hr when 'win' then 1 when 'draw' then 0.5 else 0 end) - 1 / (1 + power(10, (rb - ra) / 400.0))));
    update public.ratings set elo = elo + d, games = games + 1, wins = wins + (hr = 'win')::int, losses = losses + (hr = 'loss')::int, draws = draws + (hr = 'draw')::int
      where user_id = r.host and game = r.game;
    update public.ratings set elo = elo - d, games = games + 1, wins = wins + (gr = 'win')::int, losses = losses + (gr = 'loss')::int, draws = draws + (gr = 'draw')::int
      where user_id = r.guest and game = r.game;
  end if;
  update public.rooms set status = 'done',
    result = jsonb_build_object('host', hr, 'delta_host', d, 'host_elo', ra + d, 'guest_elo', rb - d, 'ranked', r.is_public)
  where code = p_code returning * into r;
  return r.result || '{"final": true}'::jsonb;
end $$;

-- public tables waiting for an opponent (for the "open rooms" list on the main menu)
create or replace function public.open_rooms() returns table (code text, game text, name text, avatar text, elo int)
language sql security definer set search_path = public as $$
  select r.code, r.game, p.name, p.avatar, coalesce(t.elo, 1200)
  from public.rooms r join public.profiles p on p.id = r.host
  left join public.ratings t on t.user_id = r.host and t.game = r.game
  where r.is_public and r.status = 'waiting' and r.guest is null and r.host <> auth.uid() and r.host_seen > now() - interval '30 seconds'
  order by r.created_at limit 20;
$$;

grant execute on function public.create_room(text, jsonb, boolean, text), public.join_room(text), public.quick_match(text, jsonb),
  public.room_ping(text), public.leave_room(text), public.add_move(text, jsonb, int), public.report_result(text, text), public.open_rooms() to authenticated;
revoke execute on function public.create_room(text, jsonb, boolean, text), public.join_room(text), public.quick_match(text, jsonb),
  public.room_ping(text), public.leave_room(text), public.add_move(text, jsonb, int), public.report_result(text, text), public.open_rooms() from anon, public;

-- ---------- live updates for chat and game tables ----------
do $$ begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.rooms; exception when duplicate_object then null; end;
end $$;

-- housekeeping you can run now and then: forget finished rooms older than a week
-- delete from public.rooms where status = 'done' and created_at < now() - interval '7 days';
