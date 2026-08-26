import type { UserCourse_DB } from "@/entities/user-course/types";

import { supabase } from "@/shared/supabase";

async function setCourseColorDB(
  userId: string,
  courseId: string,
  semesterId: string,
  customColor: UserCourse_DB["customColor"],
): Promise<void> {
  const { error } = await supabase
    .from("user_courses")
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
