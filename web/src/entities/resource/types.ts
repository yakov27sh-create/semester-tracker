import type { SlotIndex } from "../course/types";
import type { WeekNumber } from "../enrollment/types";

/** One user_course_resources row (see supabase/schemas/3.resources.sql). */
type ResourceMeta = {
  id: string;
  courseId: string;
  title: string;
  /** External link; absent for uploaded files (their signed URL is resolved on read — see useResourceSignedUrlsQO). */
  url?: string;
  sessionType: string;
  /** The week of the schedule card this resource was added from. */
  week: WeekNumber;
  /**
   * The time slots of the schedule item this resource was added from. Slot
   * indices are only comparable within the same sessionType (see
   * ScheduleItem.timeSlots), so matching a resource to a card also requires
   * sessionType equality — see ScheduleCard's resource filter.
   */
  timeSlots: SlotIndex[];
  /** Present for uploaded files; absent for external-link resources. */
  storagePath?: string;
};

/** The caller-supplied part of a new resource: everything but its id, course and stored file/link. */
type ResourceDraft = Omit<ResourceMeta, "id" | "courseId" | "url" | "storagePath">;

export type { ResourceMeta, ResourceDraft };
