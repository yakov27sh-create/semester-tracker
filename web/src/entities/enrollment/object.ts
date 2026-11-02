import {
  setIntersection,
  setRelativeComplement,
  setUnion,
} from "@/shared/utils/set";

import type { Course, SlotIndex, SessionType } from "../course/types";

import type {
  Enrollment,
  Enrollment_DB,
  CourseProgress,
  CourseProgressDB,
  WeekNumber,
  WeeklySessionTypeProgress,
} from "./types";

function createEnrollment_DB(
  userId: string,
  courseId: string,
  semesterId: string,
): Enrollment_DB {
  return {
    userId,
    courseId,
    semesterId,
    courseProgress: {},
    courseSelectedSections: {},
  };
}

function createEnrollment(
  enrollmentDB: Enrollment_DB,
  course: Course,
): Enrollment {
  const enrollment: Enrollment = {
    ...enrollmentDB,
    courseProgress: convertCourseProgressDBtoCourseProgress(
      enrollmentDB.courseProgress,
    ),
    courseMeta: course,
  };
  return enrollment;
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
  enrollment: Enrollment,
  sessionType: string,
  sectionId: string,
) {
  const copy = structuredClone(enrollment);
  const currentSectionId = copy.courseSelectedSections[sessionType];
  const newId = currentSectionId === sectionId ? null : sectionId;
  copy.courseSelectedSections[sessionType] = newId;
  return copy;
}

function toggleTimeslots(
  enrollment: Enrollment,
  sessionType: string,
  weekNumber: number,
  timeslots: Set<SlotIndex>,
) {
  const copy = structuredClone(enrollment);
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
  createEnrollment_DB,
  createEnrollment,
  toggleSelectedSection,
  toggleTimeslots,
};
