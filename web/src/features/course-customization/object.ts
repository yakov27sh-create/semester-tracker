import type { UserCourse } from "@/entities/user-course/types";

function updateCourseColor(userCourse: UserCourse, color: string) {
  const clone = structuredClone(userCourse);
  clone.customColor = color;
  return clone;
}

export { updateCourseColor };
