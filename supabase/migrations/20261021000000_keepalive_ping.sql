-- Supabase pauses free projects that see no database requests for a week, and a paused project
-- takes the contact form down with it. The keepalive workflow calls this a few times a day.
create function public.ping() returns integer
language sql stable
set search_path = ''
as $$ select 1 $$;

revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon;
