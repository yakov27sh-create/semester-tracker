/**
 * Shape of the JSON written by courses_to_json.py (see README.md): an array
 * of courses, each with its catalog details and its schedule entries.
 */

/** One meeting of one group, e.g. a lecture slot of group 11. */
interface ScheduleEntry {
  קבוצה: number;
  סוג: string; // "הרצאה" | "תרגול" | "מעבדה" | ..., or the activity name for sport courses
  יום: string; // e.g. "ראשון"
  שעה: string; // "14:30 - 16:30"
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
  "מקצועות קדם"?: string;
  "מקצועות ללא זיכוי נוסף"?: string;
  "מקצועות ללא זיכוי נוסף (מוכלים)"?: string;
  "מקצועות ללא זיכוי נוסף (מכילים)"?: string;
  "מקצועות צמודים"?: string;
  נקודות: string;
  אחראים: string;
  הערות: string;
  // Exam dates, present only when scheduled.
  "מועד א"?: string;
  "מועד ב"?: string;
  "בוחן מועד א"?: string;
  "בוחן מועד ב"?: string;
  "בוחן מועד ג"?: string;
}

interface RawCourse {
  general: CourseGeneral;
  schedule: ScheduleEntry[];
}

export type { ScheduleEntry, CourseGeneral, RawCourse };
