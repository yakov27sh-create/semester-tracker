import type { Enrollment } from "@/entities/enrollment/types";

function updateCourseColor(enrollment: Enrollment, color: string) {
  const clone = structuredClone(enrollment);
  clone.customColor = color;
  return clone;
}

export { updateCourseColor };
