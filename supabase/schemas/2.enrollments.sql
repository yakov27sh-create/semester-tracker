-- Per-user course state: progress, selected sections, custom color.
-- Rows are never deleted by clients: "removing" a course sets is_enrolled to
-- false, and re-adding it flips it back, so progress/sections/color survive.
create table if not exists public.enrollments (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  semester_id text not null,
  course_progress jsonb not null default '{}'::jsonb,
  course_selected_sections jsonb not null default '{}'::jsonb,
  custom_color text,
  is_enrolled boolean not null default true,
  primary key (user_id, course_id, semester_id)
);

alter table public.enrollments enable row level security;

-- Table-level grants: Postgres checks these before RLS is ever evaluated,
-- so without them every role is locked out regardless of policy.
grant select, insert, update on public.enrollments to authenticated;
grant select, insert, update, delete on public.enrollments to service_role;

create policy "enrollments_select_own"
  on public.enrollments
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "enrollments_insert_own"
  on public.enrollments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "enrollments_update_own"
  on public.enrollments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

