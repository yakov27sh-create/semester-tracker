-- Per-user course state: progress, selected sections, custom color.
create table if not exists public.user_courses (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  semester_id text not null,
  course_progress jsonb not null default '{}'::jsonb,
  course_selected_sections jsonb not null default '{}'::jsonb,
  custom_color text,
  resources jsonb not null default '[]'::jsonb,
  primary key (user_id, course_id, semester_id)
);

alter table public.user_courses enable row level security;

-- Table-level grants: Postgres checks these before RLS is ever evaluated,
-- so without them every role is locked out regardless of policy.
grant select, insert, update, delete on public.user_courses to authenticated;
grant select, insert, update, delete on public.user_courses to service_role;

create policy "user_courses_select_own"
  on public.user_courses
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_courses_insert_own"
  on public.user_courses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_courses_update_own"
  on public.user_courses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_courses_delete_own"
  on public.user_courses
  for delete
  to authenticated
  using (auth.uid() = user_id);
