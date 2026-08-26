import { queryOptions } from "@tanstack/react-query";

import { fetchSemesters } from "./db";

const semestersQueryKey = () => ["semesters"];

function useSemestersQueryOptions() {
  const key = semestersQueryKey();
  return queryOptions({
    queryKey: key,
    queryFn: () => fetchSemesters(),
    staleTime: Infinity,
  });
}

export { useSemestersQueryOptions, semestersQueryKey };
