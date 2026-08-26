import type {
  CoursesSchedule,
  ScheduleItem,
  SlotIndex,
} from "../../jsonb.types";

/** Raw shapes as they appear in courses.json (scraped Technion catalog data). */
interface ScheduleEntry {
  קבוצה: number;
  סוג: string; // "הרצאה" | "תרגול" etc.
  יום: string; // e.g. "ראשון"
  שעה: string; // "11:30 - 13:30"
  בניין: string;
  חדר: number;
  "מרצה/מתרגל": string;
  "מס.": number;
}

interface CourseGeneral {
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

interface RawCourse {
  general: CourseGeneral;
  schedule: ScheduleEntry[];
}

/**
 * Converted course, shaped to match the `public.courses` columns 1:1 (minus
 * `university` / `semester_id`, which the seed script attaches since they
 * aren't part of the Technion catalog payload). `schedule` matches the
 * `CoursesSchedule` jsonb contract in supabase/jsonb.types.ts exactly.
 */
type TechnionCourse = {
  id: string;
  name: string;
  faculty?: string;
  givenId: string;
  defaultColor: string;
  points: number;
  schedule: CoursesSchedule;
};

/** Most basic time unit for which progress can be tracked, measured in minutes. **/
const TIME_QUANTUM_MIN = 30 as const;

export type { ScheduleEntry, CourseGeneral, RawCourse, TechnionCourse };
export type { ScheduleItem, SlotIndex, CoursesSchedule };
export { TIME_QUANTUM_MIN };
