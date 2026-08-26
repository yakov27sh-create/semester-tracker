import { queryOptions } from "@tanstack/react-query";

import { useSemesterContext } from "../semester/SemesterContext";
import { fetchAllCourses } from "./db";

const allCoursesQueryKey = (semesterId?: string) => ["AllCourses", semesterId];

function useAllCoursesQueryOptions() {
  const { selectedSemesterId } = useSemesterContext();
  const key = allCoursesQueryKey(selectedSemesterId);
  return queryOptions({
    queryKey: key,
    queryFn: () => fetchAllCourses(selectedSemesterId!),
    enabled: !!selectedSemesterId,
    staleTime: Infinity,
  });
}

export { useAllCoursesQueryOptions };
