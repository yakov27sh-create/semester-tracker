import { supabase } from "@/shared/supabase";

import type { Semester, Semester_DB } from "./types";
import { convertSemesterDBtoCL } from "./object";

function rowToSemesterDB(row: {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  exam_period_a_start: string;
  exam_period_b_start: string;
}): Semester_DB {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    examPeriodAStart: row.exam_period_a_start,
    examPeriodBStart: row.exam_period_b_start,
  };
}

async function fetchSemesters(): Promise<Semester[]> {
  const { data, error } = await supabase
    .from("semesters")
    .select(
      "id, name, start_date, end_date, exam_period_a_start, exam_period_b_start",
    )
    .order("start_date", { ascending: false });
  if (error) {
    console.error(error);
    throw error;
  }
  return data.map((row) => convertSemesterDBtoCL(rowToSemesterDB(row)));
}

export { fetchSemesters };
