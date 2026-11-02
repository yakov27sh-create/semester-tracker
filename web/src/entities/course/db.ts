import { supabase } from "@/shared/supabase";

import type { Course, Course_DB } from "./types";
import { convertCourseDBtoCL } from "./object";

const UNIVERSITY = "technion";

function rowToCourseDB(row: {
  id: string;
  name: string;
  faculty: string | null;
  course_number: string;
  default_color: string;
  points: number;
  schedule: unknown;
}): Course_DB {
  return {
    id: row.id,
    name: row.name,
    fauclty: row.faculty ?? undefined,
    courseNumber: row.course_number,
    defaultColor: row.default_color,
    points: row.points,
    schedule: row.schedule as Course_DB["schedule"],
  };
}

async function fetchCourses(
  courseIds: string[],
  semesterId: string,
): Promise<Course[]> {
  if (courseIds.length === 0) return [];
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, faculty, course_number, default_color, points, schedule")
    .eq("university", UNIVERSITY)
    .eq("semester_id", semesterId)
    .in("id", courseIds);
  if (error) {
    console.error(error);
    throw error;
  }
  return data.map((row) => convertCourseDBtoCL(rowToCourseDB(row)));
}

async function fetchAllCourses(semesterId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, faculty, course_number, default_color, points, schedule")
    .eq("university", UNIVERSITY)
    .eq("semester_id", semesterId);
  if (error) {
    console.error(error);
    throw error;
  }
  return data.map((row) => convertCourseDBtoCL(rowToCourseDB(row)));
}

export { fetchCourses, fetchAllCourses };
