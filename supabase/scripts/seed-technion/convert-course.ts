import { basePastelColors } from "./colors";
import { hebrewDayToIndex, timeToMinute } from "./timeUtils";
import { TIME_QUANTUM_MIN } from "./types";
import type {
  RawCourse,
  ScheduleEntry,
  ScheduleItem,
  SlotIndex,
  TechnionCourse,
} from "./types";

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

  const courseId = rawCourse.general["מספר מקצוע"];
  const defaultColor =
    basePastelColors[Math.floor(Math.random() * basePastelColors.length)]!;

  const schedule = createSchedule(rawCourse, courseId);

  return {
    id: courseId,
    name: rawCourse.general["שם מקצוע"],
    faculty: rawCourse.general["פקולטה"],
    givenId: rawCourse.general["מספר מקצוע"],
    points: Number(rawCourse.general["נקודות"]),
    defaultColor,
    schedule,
  };
}
export default convertTechnionCourse;

function createSchedule(rawCourse: RawCourse, courseId: string) {
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
        const id = `${courseId}::${type}::${sectionId}::${dayOfWeek}::${start}-${end}::${idx}`;
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
