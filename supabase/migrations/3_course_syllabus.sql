-- courses.syllabus: free-text course description from the university catalog
-- (see supabase/schemas/1.courses.sql).
--
-- `if not exists`: on a fresh `supabase db reset` 0_init.sql already creates
-- the column, and this becomes a no-op.
alter table public.courses add column if not exists syllabus text;
