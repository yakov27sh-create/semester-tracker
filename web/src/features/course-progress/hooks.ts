import { queryOptions } from "@tanstack/react-query";

import { setIntersection } from "@/shared/utils/set";

import { useUserCoursesQueryOptions } from "@/entities/user-course/hooks";
import type { SessionType, SlotIndex } from "@/entities/course/types";
import {
  useCurrentWeekNumber,
  useTotalWeekCount,
} from "@/entities/semester/hooks";

function useWeeklySessionTypeProgressQO(
  courseId: string,
  sessionType: SessionType,
  weekNumber: number,
  slotIndices: Set<SlotIndex>,
) {
  const userCoursesQO = useUserCoursesQueryOptions();
  return queryOptions({
    ...userCoursesQO,
    refetchOnMount: false,
    select: (data) => {
      const currentIndices =
        data[courseId]?.courseProgress?.[sessionType]?.[weekNumber];

      if (!currentIndices) return 0;
      const totalIndicesNum = slotIndices.size;
      const completedIndicesNum = setIntersection(
        slotIndices,
        currentIndices,
      ).size;

      if (totalIndicesNum === 0 || completedIndicesNum === 0) return 0;

      const completedPercent = (completedIndicesNum / totalIndicesNum) * 100;
      return completedPercent;
    },
  });
}

function useCourseProgressQO(courseId: string) {
  const userCoursesQO = useUserCoursesQueryOptions();
  const totalWeeks = useTotalWeekCount() ?? 0;
  // currentWeekNum can be negative (semester hasn't started) or greater than
  // totalWeeks (semester ended); clamp so slot counts and week slices below
  // stay within valid, non-negative bounds.
  const currentWeekNum = Math.min(
    Math.max(useCurrentWeekNumber() ?? 0, 0),
    totalWeeks,
  );

  return queryOptions({
    ...userCoursesQO,
    select: (data) => {
      const selectedSectionIds = data[courseId].courseSelectedSections;
      const courseProgress = data[courseId].courseProgress;
      const courseSchedule = data[courseId].courseMeta.schedule;

      const progressInfo = {
        onTrack: 0,
        behind: 0,
        ahead: 0,
        left: 0,
      };

      for (const sessionType in courseSchedule) {
        const selectedSectionId = selectedSectionIds[sessionType];
        const filterKey =
          selectedSectionId ?? courseSchedule[sessionType][0].sectionId;

        // number of time slots this session type has in a week
        const weeklySlotsNum = courseSchedule[sessionType]
          .filter((i) => i.sectionId === filterKey)
          .reduce((acc, cur) => acc + cur.timeSlots.size, 0);

        // number of time slots this session type has in a semester. completing all of thm
        // means 100 percent completion for this session type
        const totalSlotsNum = weeklySlotsNum * totalWeeks;
        // number of time slots whos belonging to sessions that have ended
        const timeSlotsPassedSinceSemesterStart =
          weeklySlotsNum * currentWeekNum;

        // collction of time slots the user has completed, grouped by week
        const progressSortedByWeek = Object.entries(
          courseProgress[sessionType] ?? {},
        ).sort((a, b) => Number(a[0]) - Number(b[0]));

        // subgroup consisting of week groups that have ended
        const presentProgress = progressSortedByWeek.slice(0, currentWeekNum);

        // subgroup consisting of future week groups
        const futureProgress = progressSortedByWeek.slice(
          currentWeekNum,
          totalWeeks,
        );

        // Amount of time slots in week groups that have ended
        const onTrack = presentProgress.reduce(
          (acc, cur) => acc + cur[1].size,
          0,
        );

        // Amount of time slots in future week groups
        const ahead = futureProgress.reduce((acc, cur) => acc + cur[1].size, 0);

        // Amount of time slots
        const behind = timeSlotsPassedSinceSemesterStart - onTrack;

        // All the rest
        const left = totalSlotsNum - (onTrack + ahead + behind);

        progressInfo.onTrack += onTrack;
        progressInfo.behind += behind;
        progressInfo.ahead += ahead;
        progressInfo.left += left;
      }
      return progressInfo;
    },
  });
}

export type WeekProgressSummaries = (
  | "completed"
  | "behind"
  | "ahead"
  | "default"
)[];

function useWeekProgressSummariesQO() {
  const userCoursesQO = useUserCoursesQueryOptions();
  const currentWeekNum = useCurrentWeekNumber() ?? 0;
  const totalWeeks = useTotalWeekCount() ?? 0;

  return queryOptions({
    ...userCoursesQO,
    select: (data) => {
      const arrLen = totalWeeks + 1;
      // currentWeekNum can be negative (semester hasn't started) or greater
      // than totalWeeks (semester ended); clamp to valid array bounds.
      const completedEnd = Math.min(Math.max(currentWeekNum, 0), arrLen);
      const defaultStart = Math.min(Math.max(currentWeekNum + 1, 0), arrLen);

      const summary: WeekProgressSummaries = Array(arrLen).fill(
        "completed",
        0,
        completedEnd,
      );
      summary.fill("default", defaultStart, arrLen);

      for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
        for (const courseId in data) {
          if (
            summary[weekNum] != "completed" &&
            summary[weekNum] != "default"
          ) {
            continue;
          }
          const selectedSectionIds = data[courseId].courseSelectedSections;
          const courseProgress = data[courseId].courseProgress;
          const courseSchedule = data[courseId].courseMeta.schedule;

          for (const sessionType in courseSchedule) {
            const selectedSectionId = selectedSectionIds[sessionType];
            const filterKey =
              selectedSectionId ?? courseSchedule[sessionType][0].sectionId;

            // number of time slots this session type has in a week
            const totalSlotsForSessionWeek = courseSchedule[sessionType]
              .filter((i) => i.sectionId === filterKey)
              .reduce((acc, cur) => acc + cur.timeSlots.size, 0);

            const completedTimeSlotsInWeek =
              courseProgress?.[sessionType]?.[weekNum]?.size ?? 0;

            const completionPercent =
              (completedTimeSlotsInWeek / totalSlotsForSessionWeek) * 100;

            if (weekNum < currentWeekNum) {
              if (completionPercent != 100) summary[weekNum] = "behind";
            } else if (weekNum == currentWeekNum) {
              if (completionPercent != 0) summary[weekNum] = "ahead";
            } else {
              if (completionPercent != 0) summary[weekNum] = "ahead";
            }
          }
        }
      }
      return summary;
    },
  });
}

export {
  useWeeklySessionTypeProgressQO,
  useCourseProgressQO,
  useWeekProgressSummariesQO,
};
