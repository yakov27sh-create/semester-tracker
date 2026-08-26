import {
  setIntersection,
  setRelativeComplement,
  setUnion,
} from "@/shared/utils/set";

import type { Course, SlotIndex, SessionType } from "../course/types";

import type {
  UserCourse,
  UserCourse_DB,
  CourseProgress,
  CourseProgressDB,
  WeekNumber,
  WeeklySessionTypeProgress,
} from "./types";

function createUserCourse_DB(
  userId: string,
  courseId: string,
  semesterId: string,
): UserCourse_DB {
  return {
    userId,
    courseId,
    semesterId,
    courseProgress: {},
    courseSelectedSections: {},
    resources: [],
  };
}

function createUserCourse(
  userCourseDB: UserCourse_DB,
  course: Course,
): UserCourse {
  const userCourse: UserCourse = {
    ...userCourseDB,
    courseProgress: convertCourseProgressDBtoCourseProgress(
      userCourseDB.courseProgress,
    ),
    courseMeta: course,
  };
  return userCourse;
}

function convertCourseProgressDBtoCourseProgress(
  courseProgressDB: CourseProgressDB,
): CourseProgress {
  const courseProgress: Partial<CourseProgress> = {};
  for (const sessionTypeStr in courseProgressDB) {
    const sessionType = sessionTypeStr as SessionType;
    const weeklyProgressDB = courseProgressDB[sessionType];
    const weeklyProgress: WeeklySessionTypeProgress = {};
    for (const weekNumStr in weeklyProgressDB) {
      const weekNum = Number(weekNumStr) as WeekNumber;
      const slotIndexArray = weeklyProgressDB[weekNum];
      const slotIndexSet = new Set<SlotIndex>(slotIndexArray);
      weeklyProgress[weekNum] = slotIndexSet;
    }
    courseProgress[sessionType] = weeklyProgress;
  }
  return courseProgress as CourseProgress;
}

function toggleSelectedSection(
  userCourse: UserCourse,
  sessionType: string,
  sectionId: string,
) {
  const copy = structuredClone(userCourse);
  const currentSectionId = copy.courseSelectedSections[sessionType];
  const newId = currentSectionId === sectionId ? null : sectionId;
  copy.courseSelectedSections[sessionType] = newId;
  return copy;
}

function toggleTimeslots(
  userCourse: UserCourse,
  sessionType: string,
  weekNumber: number,
  timeslots: Set<SlotIndex>,
) {
  const copy = structuredClone(userCourse);
  const currentSlots =
    copy.courseProgress[sessionType]?.[weekNumber] ?? new Set();
  if (!copy.courseProgress[sessionType]) copy.courseProgress[sessionType] = [];
  const toggled =
    setIntersection(timeslots, currentSlots).size === timeslots.size
      ? // Toggle time slots off if they are all acompleted
        setRelativeComplement(currentSlots, timeslots)
      : // Complete uncompleted slots otherwise
        setUnion(timeslots, currentSlots);

  copy.courseProgress[sessionType][weekNumber] = toggled;
  return copy;
}

export {
  createUserCourse_DB,
  createUserCourse,
  toggleSelectedSection,
  toggleTimeslots,
};
