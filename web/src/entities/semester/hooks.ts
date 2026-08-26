import { queryOptions } from "@tanstack/react-query";

import { fetchSemesters } from "./db";
import { getCurrentWeekNumber, getTotalWeekCount } from "./object";
import { useSemesterContext } from "./SemesterContext";

const semestersQueryKey = () => ["semesters"];

function useSemestersQueryOptions() {
  const key = semestersQueryKey();
  return queryOptions({
    queryKey: key,
    queryFn: () => fetchSemesters(),
    staleTime: Infinity,
  });
}

/**
 * The current week number of the selected semester, 1-indexed from its
 * startDate. Negative if the semester hasn't started yet; keeps counting
 * past the last week if the semester has already ended.
 */
function useCurrentWeekNumber() {
  const { selectedSemester } = useSemesterContext();
  if (!selectedSemester) return undefined;
  return getCurrentWeekNumber(selectedSemester);
}

/** The total number of weeks in the selected semester. */
function useTotalWeekCount() {
  const { selectedSemester } = useSemesterContext();
  if (!selectedSemester) return undefined;
  return getTotalWeekCount(selectedSemester);
}

export {
  useSemestersQueryOptions,
  semestersQueryKey,
  useCurrentWeekNumber,
  useTotalWeekCount,
};
