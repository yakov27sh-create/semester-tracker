import type { Enrollment_DB } from "@/entities/enrollment/types";

import { supabase } from "@/shared/supabase";

async function setCourseColorDB(
  userId: string,
  courseId: string,
  semesterId: string,
  customColor: Enrollment_DB["customColor"],
): Promise<void> {
  const { error } = await supabase
    .from("enrollments")
    .update({ custom_color: customColor ?? null })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("semester_id", semesterId);
  if (error) {
    console.error(error);
    throw error;
  }
}

export { setCourseColorDB };
