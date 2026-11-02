/**
 * Expected TypeScript shapes for every `jsonb` column in the schema.
 * Postgres does not validate jsonb structure, so these types are the
 * contract callers should cast/validate against — keep in sync with
 * supabase/schemas/*.sql whenever a jsonb column changes.
 */

type Brand<B, T extends string> = B & { __brand: T };

/** Minutes from midnight (00:00) up to a time within the same day. */
type MinutesFromMidnight = Brand<number, "MinutesFromMidnight">;

/**
 * 0-based slot index within a schedule item, measured in 30-minute chunks.
 * Relative to slot indexes of other schedule items of the same session type
 * in the same course.
 */
type SlotIndex = Brand<number, "SlotIndex">;

type SessionType = string;

/** ISO week number within the semester. */
type WeekNumber = number;

type ScheduleItem = {
  id: string;
  /** Sunday = 0 */
  dayOfWeek: number;
  sectionId: string;
  startMinute: MinutesFromMidnight;
  endMinute: MinutesFromMidnight;
  timeSlots: SlotIndex[];
  instructor: string;
};

/**
 * courses.schedule
 * All schedule items for a course, grouped by session type (e.g. lecture,
 * tutorial, lab), across every section offered for that session type.
 */
type CoursesSchedule = Record<SessionType, ScheduleItem[]>;

/**
 * enrollments.course_progress
 * Slot indices the user has marked complete, grouped by session type and
 * then by week number.
 */
type EnrollmentsProgress = Record<
  SessionType,
  Record<WeekNumber, SlotIndex[]>
>;

/**
 * enrollments.course_selected_sections
 * The section id the user has picked for each session type. `null` means
 * the user explicitly toggled off a selection; a missing key means no
 * selection has been made yet.
 */
type EnrollmentsSelectedSections = Record<SessionType, string | null>;

export type {
  MinutesFromMidnight,
  SlotIndex,
  SessionType,
  WeekNumber,
  ScheduleItem,
  CoursesSchedule,
  EnrollmentsProgress,
  EnrollmentsSelectedSections,
};
