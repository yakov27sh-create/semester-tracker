-- user_courses -> enrollments. Renames the table along with its primary key,
-- foreign keys and RLS policies, so names match supabase/schemas/2.enrollments.sql.
-- The resources FK follows the table automatically (it's tracked by oid).
--
-- Guarded on user_courses still existing: on a fresh `supabase db reset`
-- 0_init.sql already creates enrollments, and the rename becomes a no-op.
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_courses'
  ) then
    return;
  end if;

  alter table public.user_courses rename to enrollments;

  alter table public.enrollments rename constraint user_courses_pkey to enrollments_pkey;
  alter table public.enrollments rename constraint user_courses_user_id_fkey to enrollments_user_id_fkey;
  alter table public.enrollments rename constraint user_courses_course_id_fkey to enrollments_course_id_fkey;

  alter policy "user_courses_select_own" on public.enrollments rename to "enrollments_select_own";
  alter policy "user_courses_insert_own" on public.enrollments rename to "enrollments_insert_own";
  alter policy "user_courses_update_own" on public.enrollments rename to "enrollments_update_own";
end;
$$;

-- toggle_course_progress references the table by name inside its body, so it
-- is recreated against enrollments (same body as supabase/schemas/4.rpc.sql).
-- This runs unconditionally: 1_course_uuid.sql recreates it against
-- user_courses even on a fresh reset.
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
