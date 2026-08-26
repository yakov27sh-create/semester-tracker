-- Semester catalog (start/end dates, exam periods). Seeded by admin scripts
-- using the service role key, same as public.courses — never written to
-- directly by clients. public.courses.semester_id references this table.
create table if not exists public.semesters (
  id text primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  exam_period_a_start date not null,
  exam_period_b_start date not null
);

alter table public.semesters enable row level security;

-- Table-level grants: Postgres checks these before RLS is ever evaluated,
-- so without them every role is locked out regardless of policy.
grant select on public.semesters to authenticated;
grant select, insert, update, delete on public.semesters to service_role;

-- Any authenticated user can browse the semester catalog.
create policy "semesters_select_authenticated"
  on public.semesters
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies here on purpose: catalog writes go
-- through the service role (admin seeding scripts), which bypasses RLS.
