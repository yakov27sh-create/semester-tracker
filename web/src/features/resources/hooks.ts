import { mutationOptions, queryOptions, useQueryClient } from "@tanstack/react-query";

import { useUserContext } from "@/entities/user/UserContext";
import { useSemesterContext } from "@/entities/semester/SemesterContext";
import { rowToResourceMeta } from "@/entities/resource/db";
import { resourcesQueryKey } from "@/entities/resource/hooks";
import type { ResourceDraft, ResourceMeta } from "@/entities/resource/types";
import { supabase } from "@/shared/supabase";

const RESOURCES_BUCKET = "resources";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

// A bare domain like "google.com" has no protocol, so an <a href> resolves
// it as a relative path instead of an external link — default to https.
function withProtocol(url: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
}

function useAddResourceMO() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();

  return mutationOptions({
    mutationFn: async ({
      courseId,
      resource,
      resourceMeta,
    }: {
      courseId: string;
      resource: File | string;
      resourceMeta: ResourceDraft;
    }): Promise<ResourceMeta> => {
      if (!profile) throw new Error("User not logged in");
      if (!selectedSemesterId) throw new Error("No semester selected");

      // Files get uploaded to Storage and referenced by storagePath (the
      // signed URL is resolved on read, not stored — see
      // useResourceSignedUrlsQO). A plain string is an external link:
      // no upload, stored as-is.
      const { url, storagePath } =
        resource instanceof File
          ? await (async () => {
              const storagePath = `${profile.userId}/${courseId}/${crypto.randomUUID()}-${resource.name}`;
              const { error: uploadError } = await supabase.storage
                .from(RESOURCES_BUCKET)
                .upload(storagePath, resource);
              if (uploadError) throw uploadError;
              return { url: null, storagePath };
            })()
          : { url: withProtocol(resource), storagePath: null };

      const { data, error } = await supabase.rpc("add_user_course_resource", {
        p_user_id: profile.userId,
        p_course_id: courseId,
        p_semester_id: selectedSemesterId,
        p_session_type: resourceMeta.sessionType,
        p_week_number: resourceMeta.week,
        p_timeslots: resourceMeta.timeSlots,
        p_title: resourceMeta.title,
        // Exactly one of these is null. The SQL function accepts null, but
        // `supabase gen types` can't mark function args nullable, so the
        // generated Args type them as plain string.
        p_url: url as string,
        p_storage_path: storagePath as string,
      });
      if (error) throw error;
      return rowToResourceMeta(data);
    },
    onSuccess: (newResource) => {
      if (!profile) return;
      qc.setQueryData(
        resourcesQueryKey(profile.userId, selectedSemesterId),
        (data: ResourceMeta[] | undefined) => data && [...data, newResource],
      );
    },
  });
}

function useEditResourceMO() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();

  return mutationOptions({
    mutationFn: async ({
      oldResource,
      resource,
      resourceMeta,
    }: {
      oldResource: ResourceMeta;
      /** File = re-upload; string = external link; null = keep the existing file/link as-is. */
      resource: File | string | null;
      resourceMeta: ResourceDraft;
    }): Promise<ResourceMeta> => {
      if (!profile) throw new Error("User not logged in");
      if (!selectedSemesterId) throw new Error("No semester selected");

      let url: string | null;
      let storagePath: string | null;
      if (resource instanceof File) {
        storagePath = `${profile.userId}/${oldResource.courseId}/${crypto.randomUUID()}-${resource.name}`;
        const { error: uploadError } = await supabase.storage
          .from(RESOURCES_BUCKET)
          .upload(storagePath, resource);
        if (uploadError) throw uploadError;
        url = null;
      } else if (typeof resource === "string") {
        url = withProtocol(resource);
        storagePath = null;
      } else if (oldResource.storagePath) {
        // Keep the existing file as-is.
        storagePath = oldResource.storagePath;
        url = null;
      } else {
        // Keep the existing link as-is.
        url = oldResource.url ?? null;
        storagePath = null;
      }

      const { data, error } = await supabase.rpc("update_user_course_resource", {
        p_user_id: profile.userId,
        p_resource_id: oldResource.id,
        p_title: resourceMeta.title,
        // Nullable in SQL; see the note in useAddResourceMO.
        p_url: url as string,
        p_storage_path: storagePath as string,
      });
      if (error) throw error;

      // A newly uploaded/linked replacement orphans the old stored file.
      if (oldResource.storagePath && oldResource.storagePath !== storagePath) {
        await supabase.storage.from(RESOURCES_BUCKET).remove([oldResource.storagePath]);
      }

      return rowToResourceMeta(data);
    },
    onSuccess: (updatedResource) => {
      if (!profile) return;
      qc.setQueryData(
        resourcesQueryKey(profile.userId, selectedSemesterId),
        (data: ResourceMeta[] | undefined) =>
          data?.map((r) => (r.id === updatedResource.id ? updatedResource : r)),
      );
    },
  });
}

function useDeleteResourceMO() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();

  return mutationOptions({
    mutationFn: async ({
      resource,
    }: {
      resource: ResourceMeta;
    }): Promise<void> => {
      if (!profile) throw new Error("User not logged in");
      if (!selectedSemesterId) throw new Error("No semester selected");

      if (resource.storagePath) {
        const { error: removeError } = await supabase.storage
          .from(RESOURCES_BUCKET)
          .remove([resource.storagePath]);
        if (removeError) throw removeError;
      }

      const { error } = await supabase.rpc("delete_user_course_resource", {
        p_user_id: profile.userId,
        p_resource_id: resource.id,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { resource }) => {
      if (!profile) return;
      qc.setQueryData(
        resourcesQueryKey(profile.userId, selectedSemesterId),
        (data: ResourceMeta[] | undefined) =>
          data?.filter((r) => r.id !== resource.id),
      );
    },
  });
}

/** Batch-resolves signed URLs for uploaded resources; signed URLs expire, so they're resolved on read rather than persisted. */
function useResourceSignedUrlsQO(storagePaths: string[]) {
  return queryOptions({
    queryKey: ["resourceSignedUrls", storagePaths],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.storage
        .from(RESOURCES_BUCKET)
        .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      const urlsByPath: Record<string, string> = {};
      for (const entry of data) {
        if (entry.path && entry.signedUrl) urlsByPath[entry.path] = entry.signedUrl;
      }
      return urlsByPath;
    },
    enabled: storagePaths.length > 0,
  });
}

/** Batch-resolves MIME types for uploaded resources from Storage's own object metadata */
function useResourceMimeTypesQO(storagePaths: string[]) {
  return queryOptions({
    queryKey: ["resourceMimeTypes", storagePaths],
    queryFn: async (): Promise<Record<string, string>> => {
      const entries = await Promise.all(
        storagePaths.map(async (path) => {
          const { data } = await supabase.storage.from(RESOURCES_BUCKET).info(path);
          return [path, data?.contentType] as const;
        }),
      );
      return Object.fromEntries(
        entries.filter((entry): entry is [string, string] => !!entry[1]),
      );
    },
    enabled: storagePaths.length > 0,
  });
}

export {
  useAddResourceMO,
  useEditResourceMO,
  useDeleteResourceMO,
  useResourceSignedUrlsQO,
  useResourceMimeTypesQO,
};
