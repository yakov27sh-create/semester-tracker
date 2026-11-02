-- Stored procedures / RPC functions exposed via PostgREST.

-- given the slot indices belonging to one schedule item, marks them all complete
-- unless they're already all complete, in which case it marks them all
-- incomplete.

-- p_user_id is explicit (rather than always trusting auth.uid()) so the
-- same function serves two callers:
--   - the web app, calling for its own signed-in user
--   - the admin dashboard, calling on a user's behalf via the service role
-- security definer is required for the second case (the row belongs to
-- someone other than the caller, so RLS alone would block it); the
-- authorization check below stands in for RLS for this one function.
create or replace function public.toggle_course_progress(
  p_user_id uuid,
  p_course_id uuid,
  p_semester_id text,
  p_session_type text,
  p_week_number integer,
  p_timeslots integer[]
)
returns integer[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_progress jsonb;
  v_current integer[];
  v_new integer[];
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'not authorized to modify progress for user %', p_user_id;
  end if;

  select course_progress
  into v_progress
  from public.enrollments
  where user_id = p_user_id
    and course_id = p_course_id
    and semester_id = p_semester_id
  for update;

  if not found then
    raise exception 'enrollments row not found for course % (semester %)',
      p_course_id, p_semester_id;
  end if;

  select coalesce(array_agg((elem)::integer), array[]::integer[])
  into v_current
  from jsonb_array_elements_text(
    coalesce(v_progress #> array[p_session_type, p_week_number::text], '[]'::jsonb)
  ) as elem;

  if p_timeslots is null or array_length(p_timeslots, 1) is null then
    return v_current;
  end if;

  if v_current @> p_timeslots then
    -- All requested slots are already complete: mark them incomplete.
    select coalesce(array_agg(v order by v), array[]::integer[])
    into v_new
    from (
      select unnest(v_current) except select unnest(p_timeslots)
    ) as t(v);
  else
    -- Otherwise, mark every requested slot complete.
    select coalesce(array_agg(v order by v), array[]::integer[])
    into v_new
    from (
      select unnest(v_current) union select unnest(p_timeslots)
    ) as t(v);
  end if;

  update public.enrollments
  set course_progress = jsonb_set(
    jsonb_set(
      coalesce(course_progress, '{}'::jsonb),
      array[p_session_type],
      coalesce(course_progress -> p_session_type, '{}'::jsonb),
      true
    ),
    array[p_session_type, p_week_number::text],
    to_jsonb(v_new),
    true
  )
  where user_id = p_user_id
    and course_id = p_course_id
    and semester_id = p_semester_id;

  return v_new;
end;
$$;

revoke all on function public.toggle_course_progress(uuid, uuid, text, text, integer, integer[]) from public;
grant execute on function public.toggle_course_progress(uuid, uuid, text, text, integer, integer[])
  to authenticated, service_role;

-- Inserts one resource (file/link metadata) row for a course. Trivial now
-- that resources are their own table (see supabase/schemas/3.resources.sql)
-- — RLS would already enforce ownership on a plain insert, but this stays a
-- security definer RPC (explicit p_user_id) for consistency with the rest
-- of this file, so a future admin dashboard can call it via service_role.
create or replace function public.add_user_course_resource(
  p_user_id uuid,
  p_course_id uuid,
  p_semester_id text,
  p_session_type text,
  p_week_number integer,
  p_timeslots integer[],
  p_title text,
  p_url text,
  p_storage_path text
)
returns public.user_course_resources
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resource public.user_course_resources;
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'not authorized to modify resources for user %', p_user_id;
  end if;

  insert into public.user_course_resources (
    user_id, course_id, semester_id, session_type, week_number, time_slots, title, url, storage_path
  )
  values (
    p_user_id, p_course_id, p_semester_id, p_session_type, p_week_number, p_timeslots, p_title, p_url, p_storage_path
  )
  returning * into v_resource;

  return v_resource;
end;
$$;

revoke all on function public.add_user_course_resource(uuid, uuid, text, text, integer, integer[], text, text, text) from public;
grant execute on function public.add_user_course_resource(uuid, uuid, text, text, integer, integer[], text, text, text)
  to authenticated, service_role;

-- Updates one resource row by id. sessionType/week/timeSlots never change
-- once a resource is created (they're always edited from the same schedule
-- session it belongs to), so only title/url/storage_path are settable.
create or replace function public.update_user_course_resource(
  p_user_id uuid,
  p_resource_id uuid,
  p_title text,
  p_url text,
  p_storage_path text
)
returns public.user_course_resources
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resource public.user_course_resources;
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'not authorized to modify resources for user %', p_user_id;
  end if;

  update public.user_course_resources
  set title = p_title,
      url = p_url,
      storage_path = p_storage_path
  where id = p_resource_id
    and user_id = p_user_id
  returning * into v_resource;

  if not found then
    raise exception 'resource % not found for user %', p_resource_id, p_user_id;
  end if;

  return v_resource;
end;
$$;

revoke all on function public.update_user_course_resource(uuid, uuid, text, text, text) from public;
grant execute on function public.update_user_course_resource(uuid, uuid, text, text, text)
  to authenticated, service_role;

-- Deletes one resource row by id. Storage cleanup for file resources
-- happens client-side before/after this call (see useDeleteResourceMO) —
-- this only removes the metadata row.
create or replace function public.delete_user_course_resource(
  p_user_id uuid,
  p_resource_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'not authorized to modify resources for user %', p_user_id;
  end if;

  delete from public.user_course_resources
  where id = p_resource_id
    and user_id = p_user_id;

  if not found then
    raise exception 'resource % not found for user %', p_resource_id, p_user_id;
  end if;
end;
$$;

revoke all on function public.delete_user_course_resource(uuid, uuid) from public;
grant execute on function public.delete_user_course_resource(uuid, uuid)
  to authenticated, service_role;
