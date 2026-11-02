import { supabase } from "@/shared/supabase";

import type { SlotIndex } from "../course/types";

import type { ResourceMeta } from "./types";

function rowToResourceMeta(row: {
  id: string;
  course_id: string;
  session_type: string;
  week_number: number;
  time_slots: number[];
  title: string;
  url: string | null;
  storage_path: string | null;
}): ResourceMeta {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    url: row.url ?? undefined,
    sessionType: row.session_type,
    week: row.week_number,
    timeSlots: row.time_slots as SlotIndex[],
    storagePath: row.storage_path ?? undefined,
  };
}

/**
 * Fetches every resource for every course the user is taking this semester
 * in one query (filtered per course client-side — see useCourseResourcesQO)
 * rather than one query per course, mirroring how fetchEnrollments fetches
 * all of a user's courses for the semester in one shot.
 */
async function fetchResources(
  userId: string,
  semesterId: string,
): Promise<ResourceMeta[]> {
  const { data, error } = await supabase
    .from("user_course_resources")
    .select("id, course_id, session_type, week_number, time_slots, title, url, storage_path")
    .eq("user_id", userId)
    .eq("semester_id", semesterId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error(error);
    throw error;
  }
  return data.map(rowToResourceMeta);
}

export { fetchResources, rowToResourceMeta };
