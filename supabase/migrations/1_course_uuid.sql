-- courses.id: text (the university's course number) -> generated uuid.
-- The course number moves to courses.course_number, unique per
-- (university, semester_id). Every course_id reference is remapped from the
-- old number to the new uuid, so existing enrollments/resources survive.
--
-- Guarded on courses.given_id still existing: on a fresh `supabase db reset`
-- 0_init.sql already creates the uuid schema, and this becomes a no-op.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'given_id'
  ) then
    return;
  end if;

  -- Drop the FKs pointing at the columns being retyped.
  alter table public.user_course_resources
    drop constraint user_course_resources_user_id_course_id_semester_id_fkey;
  alter table public.user_courses
    drop constraint user_courses_course_id_fkey;

  -- courses: rename given_id, swap id for a generated uuid.
  alter table public.courses rename column given_id to course_number;
  alter table public.courses add column new_id uuid not null default gen_random_uuid();

  -- Remap references. user_courses.semester_id is matched too, since the
  -- old text id was shared across semesters.
  alter table public.user_courses add column new_course_id uuid;
  update public.user_courses uc
  set new_course_id = c.new_id
  from public.courses c
  where c.id = uc.course_id and c.semester_id = uc.semester_id;

  alter table public.user_course_resources add column new_course_id uuid;
  update public.user_course_resources r
  set new_course_id = uc.new_course_id
  from public.user_courses uc
  where uc.user_id = r.user_id
    and uc.course_id = r.course_id
    and uc.semester_id = r.semester_id;

  if exists (select 1 from public.user_courses where new_course_id is null)
     or exists (select 1 from public.user_course_resources where new_course_id is null) then
    raise exception 'course uuid migration: some course_id references could not be remapped';
  end if;

  -- Swap the columns in.
  alter table public.user_course_resources drop column course_id;
  alter table public.user_course_resources rename column new_course_id to course_id;
  alter table public.user_course_resources alter column course_id set not null;

  alter table public.user_courses drop column course_id; -- drops user_courses_pkey
  alter table public.user_courses rename column new_course_id to course_id;
  alter table public.user_courses alter column course_id set not null;

  alter table public.courses drop column id; -- drops courses_pkey
  alter table public.courses rename column new_id to id;
  alter table public.courses add primary key (id);
  alter table public.courses
    add constraint courses_university_semester_id_course_number_key
    unique (university, semester_id, course_number);

  -- Restore keys/FKs under their original names.
  alter table public.user_courses add primary key (user_id, course_id, semester_id);
  alter table public.user_courses
    add constraint user_courses_course_id_fkey
    foreign key (course_id) references public.courses (id) on delete cascade;
  alter table public.user_course_resources
    add constraint user_course_resources_user_id_course_id_semester_id_fkey
    foreign key (user_id, course_id, semester_id)
    references public.user_courses (user_id, course_id, semester_id)
    on delete cascade;
end;
$$;

-- RPCs taking p_course_id: drop the text-typed overloads and recreate them
-- with uuid (same bodies as supabase/schemas/4.rpc.sql).
drop function if exists public.toggle_course_progress(uuid, text, text, text, integer, integer[]);
drop function if exists public.add_user_course_resource(uuid, text, text, text, integer, integer[], text, text, text);

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
