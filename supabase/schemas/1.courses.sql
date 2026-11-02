-- Course catalog. Seeded by admin scripts using the service role key, never
-- written to directly by clients.
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  university text not null,
  semester_id text not null references public.semesters (id),
  name text not null,
  faculty text,
  -- The university's own course number (e.g. Technion's "מספר מקצוע").
  -- Not unique on its own: the same course is a separate row per semester.
  course_number text not null,
  default_color text not null,
  points numeric not null,
  schedule jsonb not null default '{}'::jsonb,
  -- Natural key the seed script upserts on, so re-seeding keeps each
  -- course's generated id stable.
  unique (university, semester_id, course_number)
);

alter table public.courses enable row level security;

-- Table-level grants: Postgres checks these before RLS is ever evaluated,
-- so without them every role is locked out regardless of policy.
grant select on public.courses to authenticated;
grant select, insert, update, delete on public.courses to service_role;

-- Any authenticated user can browse the catalog.
create policy "courses_select_authenticated"
  on public.courses
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies here on purpose: catalog writes go
-- through the service role (admin seeding scripts), which bypasses RLS.
