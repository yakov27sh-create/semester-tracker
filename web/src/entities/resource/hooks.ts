import { queryOptions } from "@tanstack/react-query";

import { useUserContext } from "../user/UserContext";
import { useSemesterContext } from "../semester/SemesterContext";

import { fetchResources } from "./db";

const resourcesQueryKey = (uid?: string, semesterId?: string) => [
  "resources",
  uid,
  semesterId,
];

/** All of the user's resources for the selected semester, across courses. */
function useResourcesQueryOptions() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  return queryOptions({
    queryKey: resourcesQueryKey(profile?.userId, selectedSemesterId),
    queryFn: () => fetchResources(profile!.userId, selectedSemesterId!),
    enabled: !!profile && !!selectedSemesterId,
    // Same as useEnrollmentsQueryOptions: resource mutations keep this cache
    // correct via setQueryData, so background refetches would be wasted.
    staleTime: Infinity,
  });
}

function useCourseResourcesQO(courseId: string) {
  return queryOptions({
    ...useResourcesQueryOptions(),
    select: (data) => data.filter((r) => r.courseId === courseId),
  });
}

export { resourcesQueryKey, useResourcesQueryOptions, useCourseResourcesQO };
