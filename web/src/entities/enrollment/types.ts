import type { Course, SessionType, SlotIndex } from "../course/types";

type Enrollment_DB = {
  userId: string;
  courseId: string;
  semesterId: string;
  courseProgress: CourseProgressDB;
  courseSelectedSections: Record<SessionType, string | null>;
  customColor?: string;
};

type Enrollment = {
  userId: string;
  courseId: string;
  semesterId: string;
  courseMeta: Course;
  courseProgress: CourseProgress;
  courseSelectedSections: Record<SessionType, string | null>;
  customColor?: string;
};

type EnrollmentCache = Record<Course["id"], Enrollment>;

type WeekNumber = number;

type WeeklySessionTypeProgress = Record<WeekNumber, Set<SlotIndex>>;
type WeeklySessionTypeProgressDB = Record<WeekNumber, SlotIndex[]>;

type CourseProgress = Record<SessionType, WeeklySessionTypeProgress>;
type CourseProgressDB = Record<SessionType, WeeklySessionTypeProgressDB>;

export type {
  Enrollment,
  Enrollment_DB,
  EnrollmentCache,
  CourseProgress,
  CourseProgressDB,
  WeeklySessionTypeProgress,
  WeeklySessionTypeProgressDB,
  WeekNumber,
};
