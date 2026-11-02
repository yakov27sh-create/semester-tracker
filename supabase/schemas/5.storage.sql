-- Private bucket for user-uploaded course resources (see
-- web/src/features/resources). Objects are keyed
-- "{userId}/{courseId}/{uuid}-{filename}"; RLS below restricts access to
-- the owning user by checking that the first path segment matches
-- auth.uid(). No manual grants here — unlike public.* tables, Supabase's
-- bundled storage schema ships with its own base grants already.
insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

create policy "resources_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resources_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resources_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);
