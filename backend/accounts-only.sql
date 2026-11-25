-- =====================================================================================================================
-- GameHub: chat and friends are for players with an account (Nov 2026, Inna)
-- Guests (anonymous players) can still READ chat, play every game and use emotes, but the server refuses them when they
-- try to send a chat message, a friend request, accept a request, or send a private message.
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.
-- It only ADDS extra checks ("restrictive" rules) on top of the existing ones; nothing is deleted.
-- =====================================================================================================================

-- true when the signed-in player has a real account (email or Google), false for guests
create or replace function public.has_account() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users u where u.id = auth.uid() and not coalesce(u.is_anonymous, false));
$$;
grant execute on function public.has_account() to anon, authenticated;

-- chat messages (game rooms, tables, global chat)
drop policy if exists "accounts only: send chat" on public.messages;
create policy "accounts only: send chat" on public.messages as restrictive for insert with check (public.has_account());

-- friend requests: sending and accepting
drop policy if exists "accounts only: ask" on public.friend_requests;
create policy "accounts only: ask" on public.friend_requests as restrictive for insert with check (public.has_account());
drop policy if exists "accounts only: accept" on public.friend_requests;
create policy "accounts only: accept" on public.friend_requests as restrictive for update using (public.has_account()) with check (public.has_account());

-- private messages between friends
drop policy if exists "accounts only: message" on public.dms;
create policy "accounts only: message" on public.dms as restrictive for insert with check (public.has_account());
