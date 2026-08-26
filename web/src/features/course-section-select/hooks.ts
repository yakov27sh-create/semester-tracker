import { useQuery } from "@tanstack/react-query";

import { useUserCoursesQueryOptions } from "@/entities/user-course/hooks";

import type { ScheduleItemWSelectionStatus } from "./types";

function useScheduleItemsWithSelectionStatus() {
  const userCoursesQO = useUserCoursesQueryOptions();
  return useQuery({
    ...userCoursesQO,
    refetchOnMount: false,
    select: (data) => {
      const scheduleItemsWSS: ScheduleItemWSelectionStatus[] = [];
      for (const courseId in data) {
        const userCourse = data[courseId];
        const scheduleItemsByType = userCourse.courseMeta.schedule;
        for (const sessionType in scheduleItemsByType) {
          const selectedSectionId =
            userCourse.courseSelectedSections[sessionType];
          const allOfType = scheduleItemsByType[sessionType];
          if (!selectedSectionId) {
            allOfType.forEach((i) => {
              scheduleItemsWSS.push({ ...i, isSelected: false });
            });
          } else {
            allOfType
              .filter((i) => i.sectionId === selectedSectionId)
              .forEach((i) => {
                scheduleItemsWSS.push({ ...i, isSelected: true });
              });
          }
        }
      }

      return scheduleItemsWSS;
    },
  });
}

export { useScheduleItemsWithSelectionStatus };
