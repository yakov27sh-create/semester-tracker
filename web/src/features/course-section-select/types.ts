import type { ScheduleItem } from "@/entities/course/types";

type ScheduleItemWSelectionStatus = ScheduleItem & { isSelected: boolean };

export type { ScheduleItemWSelectionStatus };
