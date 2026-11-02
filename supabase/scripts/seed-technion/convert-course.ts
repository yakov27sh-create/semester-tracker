import { basePastelColors } from "./colors";
import { hebrewDayToIndex, timeToMinute } from "./timeUtils";
import type { RawCourse, ScheduleEntry } from "./courses-fetcher/types";
import type {
  CoursesSchedule,
  ScheduleItem,
  SlotIndex,
} from "../../jsonb.types";

/**
 * Converted course, shaped to match the `public.courses` columns 1:1 (minus
 * `university` / `semester_id`, which the seed script attaches since they
 * aren't part of the Technion catalog payload). `schedule` matches the
 * `CoursesSchedule` jsonb contract in supabase/jsonb.types.ts exactly.
 */
type TechnionCourse = {
  name: string;
  faculty?: string;
  syllabus?: string;
  courseNumber: string;
  defaultColor: string;
  points: number;
  schedule: CoursesSchedule;
};

/** Most basic time unit for which progress can be tracked, measured in minutes. **/
const TIME_QUANTUM_MIN = 30 as const;

function normalizeType(t: string) {
  // Trim + collapse spaces; Technion pages sometimes contain stray whitespace
  return (t ?? "").replace(/\s+/g, " ").trim();
}

function convertTechnionCourse(rawCourse: RawCourse): TechnionCourse {
  // Dedupe: same instructor + same day + same start time
  const seen = new Set<string>();
  const makeKey = (e: ScheduleEntry) =>
    `${e["יום"]}|${e["שעה"]}|${e["סוג"]}|${e["מרצה/מתרגל"]}`;

  rawCourse.schedule = rawCourse.schedule.filter((e) => {
    const key = makeKey(e);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const courseNumber = rawCourse.general["מספר מקצוע"];
  const defaultColor =
    basePastelColors[Math.floor(Math.random() * basePastelColors.length)]!;

  const schedule = createSchedule(rawCourse, courseNumber);

  return {
    name: rawCourse.general["שם מקצוע"],
    faculty: rawCourse.general["פקולטה"],
    // A few catalog entries have no syllabus; store those as null, not "".
    syllabus: rawCourse.general["סילבוס"].trim() || undefined,
    courseNumber,
    points: Number(rawCourse.general["נקודות"]),
    defaultColor,
    schedule,
  };
}
export default convertTechnionCourse;

function createSchedule(rawCourse: RawCourse, courseNumber: string) {
  const schedule: TechnionCourse["schedule"] = {};
  const scheduleEntries = rawCourse.schedule;

  const byType = Object.groupBy(scheduleEntries, (i) =>
    normalizeType(i["סוג"]),
  );

  for (const [type, entriesInType] of Object.entries(byType)) {
    schedule[type] = [];

    const bySection = Object.groupBy(
      entriesInType ?? [],
      (i) => `${i["קבוצה"]}`,
    );

    for (const [sectionId, items] of Object.entries(bySection)) {
      const parsedSection = (items ?? []).map((i, idx) => {
        const dayOfWeek = hebrewDayToIndex(i["יום"]);
        const [startStr, endStr] = i["שעה"].split(" - ");
        const start = timeToMinute(startStr!);
        const end = timeToMinute(endStr!);
        const id = `${courseNumber}::${type}::${sectionId}::${dayOfWeek}::${start}-${end}::${idx}`;
        return convertRawEntryToScheduleItem(i, sectionId, id);
      });

      assignSlotIndexes(parsedSection);
      schedule[type].push(...parsedSection);
    }
  }

  return schedule;
}

function assignSlotIndexes(section: ScheduleItem[]) {
  section.sort((a, b) =>
    a.dayOfWeek === b.dayOfWeek
      ? a.startMinute - b.startMinute
      : a.dayOfWeek - b.dayOfWeek,
  );

  let cur = 0;
  for (const scheduleItem of section) {
    const length = Math.floor(
      (scheduleItem.endMinute - scheduleItem.startMinute) / TIME_QUANTUM_MIN,
    );
    const slots: SlotIndex[] = [];
    for (let i = cur; i < cur + length; i++) slots.push(i as SlotIndex);
    scheduleItem.timeSlots = slots;
    cur += length;
  }
}

function convertRawEntryToScheduleItem(
  rawEntry: ScheduleEntry,
  sectionId: string,
  id: string,
): ScheduleItem {
  const dayOfWeek = hebrewDayToIndex(rawEntry["יום"]);
  const [startStr, endStr] = rawEntry["שעה"].split(" - ");
  const startMinute = timeToMinute(startStr!);
  const endMinute = timeToMinute(endStr!);

  return {
    id,
    dayOfWeek,
    sectionId,
    startMinute,
    endMinute,
    timeSlots: [],
    instructor: rawEntry["מרצה/מתרגל"],
  };
}
