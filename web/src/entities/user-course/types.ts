import type { Course, SessionType, SlotIndex } from "../course/types";

type UserCourse_DB = {
  userId: string;
  courseId: string;
  semesterId: string;
  courseProgress: CourseProgressDB;
  courseSelectedSections: Record<SessionType, string | null>;
  customColor?: string;
  resources: ResourceMeta[];
};

type UserCourse = {
  userId: string;
  courseId: string;
  semesterId: string;
  courseMeta: Course;
  courseProgress: CourseProgress;
  courseSelectedSections: Record<SessionType, string | null>;
  customColor?: string;
  resources: ResourceMeta[];
};

type ResourceMeta = {
  title: string;
  /** Signed URL, resolved on read — not persisted (see useResourceSignedUrlsQO). */
  url?: string;
  sessionType: string;
  /** The week of the schedule card this resource was added from. */
  week: WeekNumber;
  /**
   * The time slots of the schedule item this resource was added from. Slot
   * indices are only comparable within the same sessionType (see
   * ScheduleItem.timeSlots), so matching a resource to a card also requires
   * sessionType equality — see ScheduleCard's resource filter.
   */
  timeSlots: SlotIndex[];
  /** Present for uploaded files; absent for external-link resources. */
  storagePath?: string;
};

type UserCourseCache = Record<Course["id"], UserCourse>;

type WeekNumber = number;

type WeeklySessionTypeProgress = Record<WeekNumber, Set<SlotIndex>>;
type WeeklySessionTypeProgressDB = Record<WeekNumber, SlotIndex[]>;

type CourseProgress = Record<SessionType, WeeklySessionTypeProgress>;
type CourseProgressDB = Record<SessionType, WeeklySessionTypeProgressDB>;

export type {
  UserCourse,
  UserCourse_DB,
  UserCourseCache,
  CourseProgress,
  CourseProgressDB,
  WeeklySessionTypeProgress,
  WeeklySessionTypeProgressDB,
  WeekNumber,
  ResourceMeta,
};
