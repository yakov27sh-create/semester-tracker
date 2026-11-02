import { useQuery } from "@tanstack/react-query";

import { useEnrollmentsQueryOptions } from "@/entities/enrollment/hooks";

import type { ScheduleItemWSelectionStatus } from "./types";

function useScheduleItemsWithSelectionStatus() {
  const enrollmentsQO = useEnrollmentsQueryOptions();
  return useQuery({
    ...enrollmentsQO,
    refetchOnMount: false,
    select: (data) => {
      const scheduleItemsWSS: ScheduleItemWSelectionStatus[] = [];
      for (const courseId in data) {
        const enrollment = data[courseId];
        const scheduleItemsByType = enrollment.courseMeta.schedule;
        for (const sessionType in scheduleItemsByType) {
          const selectedSectionId =
            enrollment.courseSelectedSections[sessionType];
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
