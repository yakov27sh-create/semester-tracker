type Brand<B, T extends string> = B & { __brand: T };

/** Number of minutes from midnight (00:00) up to a time within the same day. **/
type MinutesFromMidnight = Brand<number, "MinutesFromMidnight">;

/** 0-based slot index within a schedule item, measured in TIME_QUANTUM chunks, is
 * relative to slot indexes of other schedule items of the same type in the same course
 * */
type SlotIndex = Brand<number, "SlotIndex">;

/** Most basic time unit for which progress can be tracked, measured in minutes. **/
const TIME_QUANTUM_MIN = 30 as const;

type ScheduleItem_DB = {
  id: string;
  dayOfWeek: number;
  sectionId: string;
  /** Number of minutes from midnight (00:00) up to the start of the event **/
  startMinute: MinutesFromMidnight;
  /** Number of minutes from midnight (00:00) up to the end of the event **/
  endMinute: MinutesFromMidnight;
  timeSlots: SlotIndex[];
  instructor: string;
};

type ScheduleItem = {
  id: string;
  sessionType: SessionType;
  courseId: string;
  sectionId: string;
  /** Sunday = 0 **/
  dayOfWeek: number;
  /** Number of minutes from midnight (00:00) up to the start of the event **/
  startMinute: MinutesFromMidnight;
  /** Number of minutes from midnight (00:00) up to the end of the event **/
  endMinute: MinutesFromMidnight;
  timeSlots: Set<SlotIndex>;
  instructor: string;
};
type SessionType = string;

type Course_DB = {
  id: string;
  name: string;
  fauclty?: string; // TODO: make this not optional when implemented
  givenId: string;
  defaultColor: string;
  points: number;
  schedule: Record<SessionType, ScheduleItem_DB[]>;
};

type Course = {
  id: string;
  name: string;
  fauclty?: string; // TODO: make this not optional when implemented
  givenId: string;
  defaultColor: string;
  points: number;
  schedule: Record<SessionType, ScheduleItem[]>;
};

export type {
  Course,
  Course_DB,
  ScheduleItem,
  ScheduleItem_DB,
  SessionType,
  SlotIndex,
  MinutesFromMidnight,
};

export { TIME_QUANTUM_MIN };
