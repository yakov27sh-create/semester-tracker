import { mutationOptions, queryOptions, useQueryClient } from "@tanstack/react-query";

import { useUserContext } from "@/entities/user/UserContext";
import { useSemesterContext } from "@/entities/semester/SemesterContext";
import {
  userCoursesQueryKey,
  useUserCoursesQueryOptions,
} from "@/entities/user-course/hooks";
import type {
  ResourceMeta,
  UserCourseCache,
} from "@/entities/user-course/types";
import { supabase } from "@/shared/supabase";

const RESOURCES_BUCKET = "resources";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function useGetResourceForCourseQO(courseId: string) {
  const userCoursesQO = useUserCoursesQueryOptions();
  return queryOptions({
    ...userCoursesQO,
    select: (data) => data[courseId]?.resources ?? [],
  });
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
      resourceMeta: Omit<ResourceMeta, "url" | "storagePath">;
    }): Promise<ResourceMeta[]> => {
      if (!profile) throw new Error("User not logged in");
      if (!selectedSemesterId) throw new Error("No semester selected");

      // Files get uploaded to Storage and referenced by storagePath (the
      // signed URL is resolved on read, not stored — see
      // useResourceSignedUrlsQO). A plain string is an external link:
      // no upload, stored as-is.
      const newResource: Omit<ResourceMeta, "url"> | ResourceMeta =
        resource instanceof File
          ? await (async () => {
              const storagePath = `${profile.userId}/${courseId}/${crypto.randomUUID()}-${resource.name}`;
              const { error: uploadError } = await supabase.storage
                .from(RESOURCES_BUCKET)
                .upload(storagePath, resource);
              if (uploadError) throw uploadError;
              return { ...resourceMeta, storagePath };
            })()
          : { ...resourceMeta, url: resource };

      const { data, error } = await supabase.rpc("add_user_course_resource", {
        p_user_id: profile.userId,
        p_course_id: courseId,
        p_semester_id: selectedSemesterId,
        p_resource: newResource,
      });
      if (error) throw error;
      return (data ?? []) as ResourceMeta[];
    },
    onSuccess: (resources, { courseId }) => {
      if (!profile) return;
      qc.setQueryData(
        userCoursesQueryKey(profile.userId, selectedSemesterId),
        (data: UserCourseCache) => {
          const course = data[courseId];
          if (!course) return data;
          return { ...data, [courseId]: { ...course, resources } };
        },
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

export { useAddResourceMO, useGetResourceForCourseQO, useResourceSignedUrlsQO };
