-- Removes the practice players Claude made while testing GameHub online ("Test Pilot A", "Test Pilot B", ...)
-- and everything they created: their leaderboard rankings, rooms, chat messages and saved progress.
-- Safe to run on the live site: it only touches players whose name starts with "Test Pilot" or whose
-- email is a test.pilot...@example.com address. Real players are not affected.
--
-- How: Supabase -> SQL Editor -> New query -> paste all of this -> Run.
-- The first part shows who will be removed; the second part removes them.

-- 1. Who will be removed (have a look)
select p.name, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.name like 'Test Pilot%' or u.email like 'test.pilot.%@example.com';

-- 2. Remove them (their rankings, rooms, messages and saves go with them)
delete from auth.users
where id in (select id from public.profiles where name like 'Test Pilot%')
   or email like 'test.pilot.%@example.com';
