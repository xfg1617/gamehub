-- Link previews for room invites (gamehub.us.com/r/CODE).
-- When someone pastes a room link into a chat app, that app asks the website what to show. A tiny program on
-- Netlify (netlify/edge-functions/room-preview.js) asks Supabase this one question: "which game is room CODE,
-- and who opened it?" The answer only contains the game, the host's player name (already visible in the room)
-- and whether the host has an account (so guests show "Play Chess together" instead of a "Player1234" name).
--
-- How: Supabase -> SQL Editor -> New query -> paste all of this -> Run. Safe to run more than once.

create or replace function public.room_preview(p_code text)
returns json
language sql
stable
security definer
set search_path = public, auth
as $$
  select json_build_object(
    'game', r.game,
    'host_name', p.name,
    'host_account', coalesce(u.email is not null and not coalesce(u.is_anonymous, false), false)
  )
  from public.rooms r
  left join public.profiles p on p.id = r.host
  left join auth.users u on u.id = r.host
  where r.code = upper(p_code) and r.status <> 'done'
  limit 1;
$$;

revoke all on function public.room_preview(text) from public;
grant execute on function public.room_preview(text) to anon, authenticated;
