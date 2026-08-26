/**
 * Seeds a mock semester (see MOCK_SEMESTER) and the `courses` table from
 * the scraped Technion catalog dump (courses.json), all under that
 * semester's id. Writes go through the service role key, since neither
 * table has an insert policy for regular users (see
 * supabase/schemas/0.semesters.sql and 1.courses.sql).
 *
 * Usage:
 *   SB_PRIVATE_KEY=... bun run scripts/seed-technion/seed.ts
 *
 * Env:
 *   SUPABASE_URL    defaults to the local stack (http://127.0.0.1:54321)
 *   SB_PRIVATE_KEY  service role / secret key (required)
 *   SEED_UNIVERSITY defaults to "technion"
 *   SEED_SEMESTER   defaults to "1"
 */
import { createClient } from "@supabase/supabase-js";

import convertTechnionCourse from "./convert-course";
import rawCourses from "./courses.json";
import type { RawCourse } from "./types";
import type { Database } from "../../DatabaseTypes";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SB_PRIVATE_KEY = process.env.SB_PRIVATE_KEY;
const UNIVERSITY = process.env.SEED_UNIVERSITY ?? "technion";
const SEMESTER_ID = process.env.SEED_SEMESTER ?? "1";
const BATCH_SIZE = 200;

if (!SB_PRIVATE_KEY || SB_PRIVATE_KEY === "placeholder") {
  throw new Error(
    "SB_PRIVATE_KEY is not set. Pass the service role key, e.g.\n" +
      "  SB_PRIVATE_KEY=$(supabase status -o json | jq -r .SERVICE_ROLE_KEY) bun run scripts/seed-technion/seed.ts",
  );
}

const supabase = createClient<Database>(SUPABASE_URL, SB_PRIVATE_KEY);

type CourseRow = Database["public"]["Tables"]["courses"]["Insert"];
type SemesterRow = Database["public"]["Tables"]["semesters"]["Insert"];

// Mock semester referenced by every seeded course's semester_id (a 13-week
// term starting winter 2026). courses.semester_id has a foreign key onto
// semesters.id, so this row must exist before courses are upserted.
const MOCK_SEMESTER: SemesterRow = {
  id: SEMESTER_ID,
  name: "חורף 2026",
  start_date: "2026-11-01",
  end_date: "2027-01-30",
  exam_period_a_start: "2027-02-13",
  exam_period_b_start: "2027-03-06",
};

function toCourseRow(raw: RawCourse): CourseRow {
  const course = convertTechnionCourse(raw);
  return {
    id: course.id,
    university: UNIVERSITY,
    semester_id: SEMESTER_ID,
    name: course.name,
    faculty: course.faculty ?? null,
    given_id: course.givenId,
    default_color: course.defaultColor,
    points: course.points,
    schedule: course.schedule,
  };
}

async function main() {
  console.log(`Seeding semester ${MOCK_SEMESTER.id} (${MOCK_SEMESTER.name})...`);
  const { error: semesterError } = await supabase
    .from("semesters")
    .upsert(MOCK_SEMESTER);
  if (semesterError) {
    throw new Error(`Failed upserting semester: ${semesterError.message}`);
  }

  const rows = (rawCourses as RawCourse[]).map(toCourseRow);

  console.log(
    `Seeding ${rows.length} ${UNIVERSITY} courses (semester ${SEMESTER_ID}) into ${SUPABASE_URL}...`,
  );

  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("courses").upsert(batch);
    if (error) {
      throw new Error(
        `Failed upserting batch starting at index ${i}: ${error.message}`,
      );
    }
    upserted += batch.length;
    console.log(`  upserted ${upserted}/${rows.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
