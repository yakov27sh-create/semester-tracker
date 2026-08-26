import {
  Course_DB,
  ScheduleItem_DB,
  SlotIndex,
  TIME_QUANTUM_MIN,
} from "./types";
import { basePastelColors } from "./colors";
import { hebrewDayToIndex, timeToMinute, minuteToTime } from "./timeUtils";

export interface ScheduleEntry {
  קבוצה: number;
  סוג: string; // "הרצאה" | "תרגול" etc.
  יום: string; // e.g. "ראשון"
  שעה: string; // "11:30 - 13:30"
  בניין: string;
  חדר: number;
  "מרצה/מתרגל": string;
  "מס.": number;
}

export interface CourseGeneral {
  "מספר מקצוע": string;
  "שם מקצוע": string;
  סילבוס: string;
  פקולטה: string;
  "מסגרת לימודים": string;
  "מקצועות קדם": string;
  "מקצועות ללא זיכוי נוסף": string;
  נקודות: string;
  אחראים: string;
  הערות: string;
  "מועד א": string;
  "מועד ב": string;
}

export interface Course {
  general: CourseGeneral;
  schedule: ScheduleEntry[];
}

const ENABLE_LOGS = false;

// Logging helpers that no-op when disabled
const devGroup = ENABLE_LOGS
  ? (label: string) => console.groupCollapsed(`[convert] ${label}`)
  : (_: string) => {};
const devEnd = ENABLE_LOGS ? () => console.groupEnd() : () => {};
const log = ENABLE_LOGS
  ? (...a: any[]) => console.log("[convert]", ...a)
  : () => {};
const warn = ENABLE_LOGS
  ? (...a: any[]) => console.warn("[convert]", ...a)
  : () => {};
const err = ENABLE_LOGS
  ? (...a: any[]) => console.error("[convert]", ...a)
  : () => {};

function normalizeType(t: string) {
  // Trim + collapse spaces; Technion pages sometimes contain stray whitespace
  return (t ?? "").replace(/\s+/g, " ").trim();
}

/* ----------------------------------------------------------
   MAIN CONVERSION FUNCTION
   ---------------------------------------------------------- */
function convertTechnionCourse(rawCourse: Course): Course_DB {
  devGroup(`convert course ${rawCourse?.general?.["מספר מקצוע"]}`);

  // ── DEDUPE: same instructor + same day + same start time ─────────────────────
  const seen = new Set<string>();
  const before = rawCourse.schedule.length;

  const makeKey = (e: ScheduleEntry) => {
    const type = e["סוג"];
    const groupNum = e["קבוצה"];
    const instructorName = e["מרצה/מתרגל"];
    const dayIdx = e["יום"];
    const start = e["שעה"];
    return `${dayIdx}|${start}|${type}|${instructorName}`;
  };

  rawCourse.schedule = rawCourse.schedule.filter((e) => {
    try {
      const key = makeKey(e);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    } catch (err) {
      warn("Dedup: error computing key, keeping entry", { err, e });
      return true;
    }
  });

  log(
    `deduped schedule: ${before} → ${rawCourse.schedule.length} ` +
      `(removed ${before - rawCourse.schedule.length})`,
  );
  // ─────────────────────────────────────────────────────────────────────────────

  const courseId = rawCourse.general["מספר מקצוע"];
  const defalutColor =
    basePastelColors[Math.floor(Math.random() * basePastelColors.length)]!;

  log("courseId:", courseId);
  log("name:", rawCourse.general["שם מקצוע"]);
  log("points(raw):", rawCourse.general["נקודות"]);

  // Sanity log: incoming schedule lines
  log("raw schedule entries:", rawCourse.schedule.length);
  if (ENABLE_LOGS)
    console.table(
      rawCourse.schedule.slice(0, 10).map((e, i) => ({
        i,
        סוג: normalizeType(e["סוג"]),
        יום: e["יום"],
        שעה: e["שעה"],
        קבוצה: e["קבוצה"],
        מס: e["מס."],
        מרצה_מתרגל: e["מרצה/מתרגל"],
      })),
    );

  const schedule = createSchedule(rawCourse, courseId);

  const typeCounts = Object.fromEntries(
    Object.entries(schedule).map(([t, arr]) => [t, arr.length]),
  );
  log("parsed type counts:", typeCounts);

  const parsedCourse: Course_DB = {
    id: courseId,
    name: rawCourse.general["שם מקצוע"],
    fauclty: rawCourse.general["פקולטה"],
    givenId: rawCourse.general["מספר מקצוע"],
    points: Number(rawCourse.general["נקודות"]),
    defaultColor: defalutColor,
    schedule,
  };
  devEnd();
  return parsedCourse;
}
export default convertTechnionCourse;

/* ----------------------------------------------------------
   SCHEDULE CREATION + UTILITIES
   ---------------------------------------------------------- */
function createSchedule(rawCourse: Course, courseId: string) {
  devGroup("createSchedule");
  const schedule: Course_DB["schedule"] = {};
  const scheduleEntries = rawCourse.schedule;

  // Group by normalized session type
  const byType = Object.groupBy(scheduleEntries, (i) =>
    normalizeType(i["סוג"]),
  );
  log("types found:", Object.keys(byType));

  for (const t of Object.keys(byType)) {
    const type = t; // already normalized
    schedule[type] = [];
    const entriesInType = byType[type]!;
    log(`type='${type}' entries:`, entriesInType.length);

    // Group by section: `${i["מס."]}-${i["קבוצה"]}`
    const bySection = Object.groupBy(entriesInType, (i) => `${i["קבוצה"]}`);
    log(`type='${type}' sections:`, Object.keys(bySection).length);

    for (const sectionId of Object.keys(bySection)) {
      const items = bySection[sectionId] ?? [];
      devGroup(`type='${type}' section='${sectionId}'`);
      log("incoming lines:", items.length);

      const parsedSection =
        items.map((i, idx) => {
          const dayOfWeek = hebrewDayToIndex(i["יום"]);
          const [startStr, endStr] = i["שעה"].split(" - ");
          const start = timeToMinute(startStr!);
          const end = timeToMinute(endStr!);
          const id = `${courseId}::${type}::${sectionId}::${dayOfWeek}::${start}-${end}::${idx}`;
          return convertRawEntryToScheduleItem(i, sectionId, id);
        }) ?? [];

      log("parsedSection before slot indexes:", parsedSection.length);
      assignSlotIndexes(parsedSection);
      log(
        "parsedSection after slot indexes:",
        parsedSection.length,
        "last.timeSlots:",
        parsedSection.at(-1)?.timeSlots,
      );

      schedule[type].push(...parsedSection);
      log("schedule[type] size so far:", schedule[type].length);
      devEnd();
    }
  }

  if (ENABLE_LOGS)
    console.table(
      Object.entries(schedule)
        .flatMap(([type, items]) =>
          items.slice(0, 20).map((it, i) => ({
            type,
            i,
            id: it.id,
            sectionId: it.sectionId,
            day: it.dayOfWeek,
            startMinute: it.startMinute,
            startTime: minuteToTime(it.startMinute),
            endMinute: it.endMinute,
            endTime: minuteToTime(it.endMinute),
            slotCount: Math.floor(
              (it.endMinute - it.startMinute) / TIME_QUANTUM_MIN,
            ),
          })),
        )
        .slice(0, 20),
    );

  devEnd();
  return schedule;
}

function assignSlotIndexes(section: Course_DB["schedule"][string]) {
  section.sort((a, b) =>
    a.dayOfWeek === b.dayOfWeek
      ? a.startMinute - b.startMinute
      : a.dayOfWeek - b.dayOfWeek,
  );

  let cur = 0;
  section.forEach((scheduleItem, idx) => {
    const length = Math.floor(
      (scheduleItem.endMinute - scheduleItem.startMinute) / TIME_QUANTUM_MIN,
    );
    const arr: SlotIndex[] = [];
    for (let i = cur; i < cur + length; i++) arr.push(i as SlotIndex);
    scheduleItem.timeSlots = arr;
    cur += length;

    log(
      `[assignSlots] #${idx}: day=${scheduleItem.dayOfWeek} | ` +
        `start=${scheduleItem.startMinute} (${minuteToTime(
          scheduleItem.startMinute,
        )}) → ` +
        `end=${scheduleItem.endMinute} (${minuteToTime(
          scheduleItem.endMinute,
        )}) | ` +
        `len=${length} slots | cur→${cur}`,
    );
  });
}

function convertRawEntryToScheduleItem(
  rawEntry: ScheduleEntry,
  sectionId: string,
  id: string,
): ScheduleItem_DB {
  const dayOfWeek = hebrewDayToIndex(rawEntry["יום"]);
  const [startStr, endStr] = rawEntry["שעה"].split(" - ");
  const startMinute = timeToMinute(startStr!);
  const endMinute = timeToMinute(endStr!);
  const groupNum = rawEntry["קבוצה"];

  log(
    `[convertEntry] ${rawEntry["סוג"]} section=${sectionId} | ${rawEntry["יום"]} | ` +
      `${startStr}-${endStr} → start=${startMinute} (${minuteToTime(
        startMinute,
      )}) | end=${endMinute} (${minuteToTime(endMinute)})`,
  );

  return {
    id,
    dayOfWeek,
    sectionId,
    startMinute,
    endMinute,
    timeSlots: [],
    instructor: rawEntry["מרצה/מתרגל"],
    groupNum: groupNum,
  };
}
