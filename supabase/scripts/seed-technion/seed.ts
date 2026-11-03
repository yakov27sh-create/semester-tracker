/**
 * Fetches the Technion catalog with courses-fetcher/courses_to_json.py, then
 * seeds a mock semester (see MOCK_SEMESTER) and the `courses` table from the
 * fetched dump, all under that semester's id. Writes go through the service
 * role key, since neither table has an insert policy for regular users (see
 * supabase/schemas/0.semesters.sql and 1.courses.sql).
 *
 * Takes the same arguments as courses_to_json.py, which are passed through to
 * it as-is (see courses-fetcher/README.md). The fetcher needs its venv:
 *   python3 -m venv scripts/seed-technion/courses-fetcher/.venv
 *   scripts/seed-technion/courses-fetcher/.venv/bin/pip install requests tqdm
 *
 * Usage (from supabase/, so Bun loads supabase/.env):
 *   bun run scripts/seed-technion/seed.ts <YYYY-SSS> <output_file> [fetcher options] [--skip-fetch]
 *
 * --skip-fetch seeds the existing <output_file> without running the fetcher.
 *
 * Env (read from supabase/.env):
 *   SUPABASE_URL        project URL (required)
 *   SUPABASE_SECRET_KEY secret / service role key (required)
 *   SEED_UNIVERSITY     defaults to "technion"
 *   SEED_SEMESTER       defaults to "3"
 */
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";
import { $ } from "bun";

import convertTechnionCourse from "./convert-course";
import type { RawCourse } from "./courses-fetcher/types";
import type { Database } from "../../DatabaseTypes";

const FETCHER_DIR = `${import.meta.dir}/courses-fetcher`;
const FETCHER_PYTHON = `${FETCHER_DIR}/.venv/bin/python`;
const FETCHER_SCRIPT = `${FETCHER_DIR}/courses_to_json.py`;

// Our own flag, stripped before forwarding: seed the existing output file
// instead of running the fetcher.
const SKIP_FETCH_FLAG = "--skip-fetch";
const SKIP_FETCH = process.argv.includes(SKIP_FETCH_FLAG);
const fetcherArgv = process.argv.slice(2).filter((a) => a !== SKIP_FETCH_FLAG);

// Mirrors courses_to_json.py's argparse definition, only to validate the
// arguments and find the output file; the raw argv is what gets forwarded.
const { positionals } = parseArgs({
  args: fetcherArgv,
  allowPositionals: true,
  options: {
    "min-js-output-file": { type: "string" },
    "last-semesters-output-file": { type: "string" },
    "run-postprocessing": { type: "boolean" },
  },
});
const [YEAR_AND_SEMESTER, OUTPUT_FILE] = positionals;
if (positionals.length !== 2 || !YEAR_AND_SEMESTER || !OUTPUT_FILE) {
  throw new Error(
    "Usage: bun run scripts/seed-technion/seed.ts <YYYY-SSS> <output_file>" +
      " [--min-js-output-file FILE] [--last-semesters-output-file FILE] [--run-postprocessing]" +
      ` [${SKIP_FETCH_FLAG}]`,
  );
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const UNIVERSITY = process.env.SEED_UNIVERSITY ?? "technion";
const SEMESTER_ID = process.env.SEED_SEMESTER ?? "3";
const BATCH_SIZE = 200;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SECRET_KEY must be set. Bun loads them from .env" +
      " in the current directory, so run this from supabase/.",
  );
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY);

type CourseRow = Database["public"]["Tables"]["courses"]["Insert"];
type SemesterRow = Database["public"]["Tables"]["semesters"]["Insert"];

// Mock semester referenced by every seeded course's semester_id (a 13-week
// term starting winter 2026). courses.semester_id has a foreign key onto
// semesters.id, so this row must exist before courses are upserted.
const MOCK_SEMESTER: SemesterRow = {
  id: SEMESTER_ID,
  name: "חורף 2027",
  start_date: "2026-10-28",
  end_date: "2027-01-30",
  exam_period_a_start: "2027-02-13",
  exam_period_b_start: "2027-03-06",
};

function toCourseRow(raw: RawCourse): CourseRow {
  const course = convertTechnionCourse(raw);
  return {
    university: UNIVERSITY,
    semester_id: SEMESTER_ID,
    name: course.name,
    faculty: course.faculty ?? null,
    syllabus: course.syllabus ?? null,
    course_number: course.courseNumber,
    default_color: course.defaultColor,
    points: course.points,
    schedule: course.schedule,
  };
}

async function fetchCourses(): Promise<RawCourse[]> {
  if (SKIP_FETCH) {
    if (!(await Bun.file(OUTPUT_FILE!).exists())) {
      throw new Error(`${SKIP_FETCH_FLAG} given but ${OUTPUT_FILE} does not exist.`);
    }
    console.log(`Skipping fetch, using existing ${OUTPUT_FILE}...`);
    return Bun.file(OUTPUT_FILE!).json();
  }
  if (!(await Bun.file(FETCHER_PYTHON).exists())) {
    throw new Error(
      `Fetcher venv not found at ${FETCHER_PYTHON}; see the setup steps at the top of seed.ts.`,
    );
  }
  console.log(`Fetching ${YEAR_AND_SEMESTER} courses into ${OUTPUT_FILE}...`);
  await $`${FETCHER_PYTHON} ${FETCHER_SCRIPT} ${fetcherArgv}`;
  return Bun.file(OUTPUT_FILE!).json();
}

async function main() {
  const rawCourses = await fetchCourses();

  console.log(`Seeding semester ${MOCK_SEMESTER.id} (${MOCK_SEMESTER.name})...`);
  const { error: semesterError } = await supabase
    .from("semesters")
    .upsert(MOCK_SEMESTER);
  if (semesterError) {
    throw new Error(`Failed upserting semester: ${semesterError.message}`);
  }

  const rows = rawCourses.map(toCourseRow);

  console.log(
    `Seeding ${rows.length} ${UNIVERSITY} courses (semester ${SEMESTER_ID}) into ${SUPABASE_URL}...`,
  );

  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    // courses.id is generated, so upsert on the natural key instead — this
    // keeps existing rows (and the enrollments pointing at them) stable
    // across re-seeds.
    const { error } = await supabase
      .from("courses")
      .upsert(batch, { onConflict: "university,semester_id,course_number" });
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
