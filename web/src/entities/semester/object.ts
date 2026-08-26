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

export { convertSemesterDBtoCL };
