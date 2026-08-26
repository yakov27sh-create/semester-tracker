-- Stored procedures / RPC functions exposed via PostgREST.

-- Mirrors web/src/entities/user-course/object.ts:toggleTimeslots — given the
-- slot indices belonging to one schedule item, marks them all complete
-- unless they're already all complete, in which case it marks them all
-- incomplete. Done server-side (instead of read-modify-write from the
-- client) so concurrent toggles from multiple tabs/devices can't race and
-- clobber each other.
--
-- p_user_id is explicit (rather than always trusting auth.uid()) so the
-- same function serves two callers:
--   - the web app, calling for its own signed-in user
--   - the admin dashboard, calling on a user's behalf via the service role
-- security definer is required for the second case (the row belongs to
-- someone other than the caller, so RLS alone would block it); the
-- authorization check below stands in for RLS for this one function.
create or replace function public.toggle_course_progress(
  p_user_id uuid,
  p_course_id text,
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
  from public.user_courses
  where user_id = p_user_id
    and course_id = p_course_id
    and semester_id = p_semester_id
  for update;

  if not found then
    raise exception 'user_courses row not found for course % (semester %)',
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

  update public.user_courses
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

revoke all on function public.toggle_course_progress(uuid, text, text, text, integer, integer[]) from public;
grant execute on function public.toggle_course_progress(uuid, text, text, text, integer, integer[])
  to authenticated, service_role;

-- Appends one resource (file/link metadata) onto a user_courses row's
-- resources array. A single `||` concat in one UPDATE is already atomic —
-- unlike toggle_course_progress there's no read-then-recompute step, so no
-- `select ... for update` lock is needed here.
create or replace function public.add_user_course_resource(
  p_user_id uuid,
  p_course_id text,
  p_semester_id text,
  p_resource jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resources jsonb;
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'not authorized to modify resources for user %', p_user_id;
  end if;

  update public.user_courses
  set resources = coalesce(resources, '[]'::jsonb) || jsonb_build_array(p_resource)
  where user_id = p_user_id
    and course_id = p_course_id
    and semester_id = p_semester_id
  returning resources into v_resources;

  if not found then
    raise exception 'user_courses row not found for course % (semester %)',
      p_course_id, p_semester_id;
  end if;

  return v_resources;
end;
$$;

revoke all on function public.add_user_course_resource(uuid, text, text, jsonb) from public;
grant execute on function public.add_user_course_resource(uuid, text, text, jsonb)
  to authenticated, service_role;
