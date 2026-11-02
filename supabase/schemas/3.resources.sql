-- Course resources (uploaded files / links), one row per resource. Used to
-- live as a jsonb array on enrollments.resources; split out into its own
-- table so each resource has a real id (instead of being identified by an
-- ad-hoc storagePath/url match) and a proper foreign key onto the course a
-- user is taking it in.
create table if not exists public.user_course_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null,
  semester_id text not null,
  session_type text not null,
  week_number integer not null,
  time_slots integer[] not null,
  title text not null,
  -- Uploaded files carry storage_path (the signed URL is resolved on read,
  -- never persisted — see useResourceSignedUrlsQO); external links carry
  -- url instead. Exactly one of the two is set.
  url text,
  storage_path text,
  created_at timestamptz not null default now(),
  -- Ties each resource to a specific course enrollment, and cascades when
  -- that enrollment is dropped — same lifetime resources had when they
  -- lived inline on enrollments.
  foreign key (user_id, course_id, semester_id)
    references public.enrollments (user_id, course_id, semester_id)
    on delete cascade,
  constraint user_course_resources_url_xor_storage_path
    check ((url is null) <> (storage_path is null))
);

-- Supports the per-user-per-semester list fetch (see
-- fetchUserCourseResources) — the same shape enrollments' own query uses.
create index if not exists user_course_resources_user_semester_idx
  on public.user_course_resources (user_id, semester_id);

alter table public.user_course_resources enable row level security;

-- Table-level grants: Postgres checks these before RLS is ever evaluated,
-- so without them every role is locked out regardless of policy.
grant select, insert, update, delete on public.user_course_resources to authenticated;
grant select, insert, update, delete on public.user_course_resources to service_role;

create policy "user_course_resources_select_own"
  on public.user_course_resources
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_course_resources_insert_own"
  on public.user_course_resources
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_course_resources_update_own"
  on public.user_course_resources
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_course_resources_delete_own"
  on public.user_course_resources
  for delete
  to authenticated
  using (auth.uid() = user_id);
