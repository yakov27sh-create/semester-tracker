import { differenceInCalendarDays } from "date-fns";

import type { Semester, Semester_DB } from "./types";

function convertSemesterDBtoCL(dbSemester: Semester_DB): Semester {
  return {
    id: dbSemester.id,
    name: dbSemester.name,
    startDate: new Date(dbSemester.startDate),
    endDate: new Date(dbSemester.endDate),
    examPeriodAStart: new Date(dbSemester.examPeriodAStart),
    examPeriodBStart: new Date(dbSemester.examPeriodBStart),
  };
}

/**
 * Week 1 starts on the semester's startDate. Keeps counting past the last
 * week if the semester has ended, and returns a negative number of weeks
 * remaining until start if it hasn't started yet.
 */
function getCurrentWeekNumber(semester: Semester, now = new Date()): number {
  const daysSinceStart = differenceInCalendarDays(now, semester.startDate);

  if (daysSinceStart < 0) {
    return -Math.ceil(-daysSinceStart / 7);
  }

  return Math.floor(daysSinceStart / 7) + 1;
}

/** The total number of weeks in the semester, week 1 being its startDate. */
function getTotalWeekCount(semester: Semester): number {
  return getCurrentWeekNumber(semester, semester.endDate);
}

export { convertSemesterDBtoCL, getCurrentWeekNumber, getTotalWeekCount };
