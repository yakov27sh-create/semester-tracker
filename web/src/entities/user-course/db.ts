import { supabase } from "@/shared/supabase";

import type { SlotIndex } from "../course/types";

import type { ResourceMeta, UserCourse_DB } from "./types";

function rowToUserCourseDB(row: {
  user_id: string;
  course_id: string;
  semester_id: string;
  course_progress: unknown;
  course_selected_sections: unknown;
  custom_color: string | null;
  resources: unknown;
}): UserCourse_DB {
  return {
    userId: row.user_id,
    courseId: row.course_id,
    semesterId: row.semester_id,
    courseProgress: (row.course_progress ?? {}) as UserCourse_DB["courseProgress"],
    courseSelectedSections:
      (row.course_selected_sections ?? {}) as UserCourse_DB["courseSelectedSections"],
    customColor: row.custom_color ?? undefined,
    resources: (row.resources ?? []) as ResourceMeta[],
  };
}

async function fetchUserCourses(
  userId: string,
  semesterId: string,
): Promise<UserCourse_DB[]> {
  const { data, error } = await supabase
    .from("user_courses")
    .select(
      "user_id, course_id, semester_id, course_progress, course_selected_sections, custom_color, resources",
    )
    .eq("user_id", userId)
    .eq("semester_id", semesterId);
  if (error) {
    console.error(error);
    throw error;
  }
  return data.map(rowToUserCourseDB);
}

async function addUserCourseDB(
  userId: string,
  course: UserCourse_DB,
): Promise<void> {
  const { error } = await supabase.from("user_courses").insert({
    user_id: userId,
    course_id: course.courseId,
    semester_id: course.semesterId,
    course_progress: {},
    course_selected_sections: {},
  });
  if (error) {
    console.error(error);
    throw error;
  }
}

async function deleteUserCourseDB(
  userId: string,
  courseId: string,
  semesterId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_courses")
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("semester_id", semesterId);
  if (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Full-object write (read-modify-write happens client-side, on the already
 * optimistically-updated cache). Unlike progress toggling, there's no
 * set-arithmetic race to protect against here — the last write simply wins,
 * same as the old Firestore dot-path update effectively did for a single
 * client.
 */
async function setSelectedSectionIdDB(
  userId: string,
  courseId: string,
  semesterId: string,
  selectedSections: Record<string, string | null>,
): Promise<void> {
  const { error } = await supabase
    .from("user_courses")
    .update({ course_selected_sections: selectedSections })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("semester_id", semesterId);
  if (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Calls the toggle_course_progress RPC (supabase/schemas/3.rpc.sql) instead
 * of computing the new state client-side and blind-writing it — the toggle
 * (union onto the existing set, unless every requested slot is already
 * complete, in which case clear them) happens atomically in Postgres via a
 * `select ... for update`, so concurrent toggles from two tabs can't race
 * and clobber each other. Returns the authoritative post-toggle slot array.
 */
async function toggleTimeslotsDB(
  userId: string,
  courseId: string,
  semesterId: string,
  sessionType: string,
  weekNumber: number,
  timeslots: SlotIndex[],
): Promise<number[]> {
  const { data, error } = await supabase.rpc("toggle_course_progress", {
    p_user_id: userId,
    p_course_id: courseId,
    p_semester_id: semesterId,
    p_session_type: sessionType,
    p_week_number: weekNumber,
    p_timeslots: timeslots,
  });
  if (error) {
    console.error(error);
    throw error;
  }
  return data ?? [];
}

export {
  fetchUserCourses,
  addUserCourseDB,
  deleteUserCourseDB,
  toggleTimeslotsDB,
  setSelectedSectionIdDB,
};
