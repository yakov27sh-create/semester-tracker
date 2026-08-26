import type {
  Course,
  Course_DB,
  ScheduleItem,
  ScheduleItem_DB,
  SessionType,
} from "./types";

/**
 * Converts a single ScheduleItem from the database model to the client model.
 * @param {ScheduleItem_DB} dbItem - The database schedule item.
 * @param {string} courseId - The ID of the parent course.
 * @param {SessionType} sessionType - The session type (e.g., "lecture", "lab").
 * @returns {ScheduleItem_CL} The converted client-side schedule item.
 */
function convertScheduleItemDBtoCL(
  dbItem: ScheduleItem_DB,
  courseId: string,
  sessionType: SessionType,
): ScheduleItem {
  return {
    ...dbItem,
    courseId,
    sessionType,
    timeSlots: new Set(dbItem.timeSlots),
  };
}

/**
 * Converts a full course object from the database model to the client model.
 * @param {Course_DB} dbCourse - The database course object.
 * @returns {Course_CL} The converted client-side course object.
 */
function convertCourseDBtoCL(dbCourse: Course_DB): Course {
  const clientSchedule: Course["schedule"] = {};
  for (const sessionType in dbCourse.schedule) {
    clientSchedule[sessionType] = dbCourse.schedule[sessionType].map((i) =>
      convertScheduleItemDBtoCL(i, dbCourse.id, sessionType),
    );
  }
  return {
    id: dbCourse.id,
    name: dbCourse.name,
    givenId: dbCourse.givenId,
    defaultColor: dbCourse.defaultColor,
    points: dbCourse.points,
    schedule: clientSchedule,
  };
}

export { convertCourseDBtoCL, convertScheduleItemDBtoCL };
