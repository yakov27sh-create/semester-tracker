import {
  userCoursesQueryKey,
  useUserCoursesQueryOptions,
} from "@/entities/user-course/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { UserCourseCache } from "@/entities/user-course/types";
import { useUserContext } from "@/entities/user/UserContext";
import { useSemesterContext } from "@/entities/semester/SemesterContext";

import { basePastelColors, unknownColor } from "./colors";
import { setCourseColorDB } from "./db";
import { updateCourseColor } from "./object";

function useCourseColor(courseId: string) {
  const userCourseQO = useUserCoursesQueryOptions();
  const { data: courseColor } = useQuery({
    ...userCourseQO,
    refetchOnMount: false,
    select: (data) => {
      const course = data[courseId];
      const defaultColor = course.courseMeta.defaultColor;

      const knownColor =
        course.customColor && basePastelColors.has(course.customColor)
          ? course.customColor
          : defaultColor;

      const color = basePastelColors.has(knownColor)
        ? knownColor
        : unknownColor;
      return color;
    },
  });
  return courseColor ?? "transparent";
}

function useSetCourseColor() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();
  return useMutation({
    onMutate: ({ color, courseId }, data) => {
      const key = userCoursesQueryKey(profile!.userId, selectedSemesterId);
      qc.cancelQueries({ queryKey: key });

      const cache = data.client.getQueryData(key) as UserCourseCache;
      const course = cache[courseId];

      const updated = updateCourseColor(course, color);

      qc.setQueryData(key, { ...cache, [course.courseId]: updated });
    },
    mutationFn: ({ courseId, color }: { courseId: string; color: string }) => {
      if (!selectedSemesterId) throw new Error("No semester selected");
      return setCourseColorDB(profile!.userId, courseId, selectedSemesterId, color);
    },
  });
}

export { useCourseColor, useSetCourseColor };
