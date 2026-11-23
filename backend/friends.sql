-- Friends, friend chat, player look-up, and privacy (Nov 2026).
-- How: Supabase -> SQL Editor -> New query -> paste all of this -> Run. Safe to run more than once.
--
-- What it adds:
--   friend_requests   one row per friendship ("pending" until the other player accepts, then "accepted")
--   dms               private messages between two friends (only those two can ever read them)
--   search_players()  look a player up by name (shows name + avatar only, never an email)
--   player_card()     a player's public card: name, avatar, member since, rankings, and whether you are friends
-- Privacy: emails are never stored with profiles, messages or friends. Email addresses and phone numbers typed
-- into any chat are hidden, and player names can't be email addresses.

-- ---------- friends ----------
create table if not exists public.friend_requests (
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id   uuid not null references public.profiles (id) on delete cascade,
  status  text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);
alter table public.friend_requests enable row level security;
grant select, insert, update, delete on public.friend_requests to authenticated;
drop policy if exists "see my friendships" on public.friend_requests;
create policy "see my friendships" on public.friend_requests for select using (auth.uid() in (from_id, to_id));
drop policy if exists "ask as yourself" on public.friend_requests;
create policy "ask as yourself" on public.friend_requests for insert with check (auth.uid() = from_id and status = 'pending');
drop policy if exists "accept requests to me" on public.friend_requests;
create policy "accept requests to me" on public.friend_requests for update using (auth.uid() = to_id) with check (auth.uid() = to_id and status = 'accepted');
drop policy if exists "remove my friendships" on public.friend_requests;
create policy "remove my friendships" on public.friend_requests for delete using (auth.uid() in (from_id, to_id));

create or replace function public.are_friends(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friend_requests where status = 'accepted' and ((from_id = a and to_id = b) or (from_id = b and to_id = a)));
$$;

-- ---------- private messages between friends ----------
create table if not exists public.dms (
  id bigserial primary key,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id   uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists dms_pair on public.dms (least(from_id, to_id), greatest(from_id, to_id), id);
alter table public.dms enable row level security;
grant select, insert on public.dms to authenticated;
grant usage, select on sequence public.dms_id_seq to authenticated;
drop policy if exists "read my messages" on public.dms;
create policy "read my messages" on public.dms for select using (auth.uid() in (from_id, to_id));
drop policy if exists "message my friends" on public.dms;
create policy "message my friends" on public.dms for insert with check (auth.uid() = from_id and public.are_friends(from_id, to_id));

-- ---------- chat guard: speed limit, swear filter, and hide emails / phone numbers (all chats) ----------
create or replace function public.hide_private(t text) returns text language sql immutable as $$
  select regexp_replace(regexp_replace(t, '[^\s@<>]+@[^\s@<>]+\.[A-Za-z]{2,}', '[email hidden]', 'g'),
                        '\+?\d[\d\s().-]{8,}\d', '[number hidden]', 'g');
$$;
create or replace function public.chat_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare bad text;
begin
  if (select count(*) from public.messages where user_id = new.user_id and created_at > now() - interval '10 seconds') >= 5 then
    raise exception 'slow down';
  end if;
  foreach bad in array array['fuck','shit','bitch','cunt','nigg','fag','retard','whore','slut','dick','pussy','kys'] loop
    new.text := regexp_replace(new.text, bad || '\w*', repeat('*', length(bad) + 2), 'gi');
  end loop;
  new.text := public.hide_private(new.text);
  return new;
end $$;
create or replace function public.dm_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare bad text;
begin
  if (select count(*) from public.dms where from_id = new.from_id and created_at > now() - interval '10 seconds') >= 6 then
    raise exception 'slow down';
  end if;
  foreach bad in array array['fuck','shit','bitch','cunt','nigg','fag','retard','whore','slut','dick','pussy','kys'] loop
    new.text := regexp_replace(new.text, bad || '\w*', repeat('*', length(bad) + 2), 'gi');
  end loop;
  new.text := public.hide_private(new.text);
  return new;
end $$;
drop trigger if exists dm_guard on public.dms;
create trigger dm_guard before insert on public.dms for each row execute function public.dm_guard();

-- player names are public, so they can't be email addresses (existing names are left alone)
do $$ begin
  alter table public.profiles add constraint profiles_name_not_email check (name !~ '@') not valid;
exception when duplicate_object then null; end $$;

-- ---------- look up players ----------
create or replace function public.search_players(q text)
returns table (id uuid, name text, avatar text) language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.avatar from public.profiles p
  where char_length(trim(q)) >= 2 and p.name ilike '%' || replace(replace(trim(q), '%', ''), '_', '\_') || '%'
  order by (lower(p.name) = lower(trim(q))) desc, (p.name ilike trim(q) || '%') desc, char_length(p.name)
  limit 20;
$$;
create or replace function public.player_card(p_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', p.id, 'name', p.name, 'avatar', p.avatar, 'since', to_char(p.created_at, 'Mon YYYY'),
    'ratings', coalesce((select json_agg(json_build_object('game', r.game, 'elo', r.elo, 'games', r.games, 'wins', r.wins) order by r.elo desc)
                         from public.ratings r where r.user_id = p.id and r.games > 0), '[]'::json),
    'friend', case
      when p.id = auth.uid() then 'me'
      when exists (select 1 from public.friend_requests f where f.status = 'accepted' and ((f.from_id = auth.uid() and f.to_id = p.id) or (f.from_id = p.id and f.to_id = auth.uid()))) then 'friends'
      when exists (select 1 from public.friend_requests f where f.from_id = auth.uid() and f.to_id = p.id) then 'sent'
      when exists (select 1 from public.friend_requests f where f.from_id = p.id and f.to_id = auth.uid()) then 'asked'
      else 'none' end)
  from public.profiles p where p.id = p_id;
$$;
revoke all on function public.search_players(text) from public;
revoke all on function public.player_card(uuid) from public;
grant execute on function public.search_players(text) to authenticated;
grant execute on function public.player_card(uuid) to authenticated;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- live updates: new friend requests and messages arrive instantly
do $$ begin
  begin alter publication supabase_realtime add table public.friend_requests; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.dms; exception when duplicate_object then null; end;
exception when undefined_object then null; end $$;
