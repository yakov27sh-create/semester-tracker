import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { maxNum, minNum } from "@/shared/utils/math";
import WeeklyCalendar, {
  type CalendarEvent,
  CalendarContent,
} from "@/shared/components/custom/weeklyCalendar/WeeklyCalendar";

import { useEnrollmentsQueryOptions } from "@/entities/enrollment/hooks";

import { useScheduleItemsWithSelectionStatus } from "@/features/course-section-select/hooks";
import type { ScheduleItemWSelectionStatus } from "@/features/course-section-select/types";
import type { WeekNumber } from "@/entities/enrollment/types";

import ScheduleCard from "./ScheduleCard";
import clsx from "clsx";
import { minuteToTime, timeToMinute } from "@/shared/utils/timeUtils";
import type { ScheduleItem } from "@/entities/course/types";

type ScheduleItemsCalendarProps = {
  weekNum: WeekNumber;
  className?: string;
  onClickScheduleCard?: (item: ScheduleItem) => void;
  isEditMode?: boolean;
};

function ScheduleItemsCalendar(props: ScheduleItemsCalendarProps) {
  const { data: enrollments } = useQuery(useEnrollmentsQueryOptions());

  const { data: scheduleItems } = useScheduleItemsWithSelectionStatus();

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const events = [] as CalendarEvent<ScheduleItemWSelectionStatus>[];
  let maxEndMinute = timeToMinute("17:00");
  let minStartMinute = timeToMinute("08:30");
  if (scheduleItems) {
    scheduleItems.forEach((i) => {
      maxEndMinute = maxNum(maxEndMinute, i.endMinute);
      minStartMinute = minNum(minStartMinute, i.startMinute);
      events.push(
        Object.assign(
          {
            id: i.id,
            day: i.dayOfWeek,
            startMinute: i.startMinute,
            endMinute: i.endMinute,
          },
          { payload: i },
        ),
      );
    });
  }
  const endTime = minuteToTime(maxEndMinute);
  const startTime = minuteToTime(minStartMinute);

  return (
    <WeeklyCalendar
      className={clsx("", props.className)}
      days={[0, 1, 2, 3, 4]}
      gapInMinutes={60}
      startHour={startTime}
      endHour={endTime}
    >
      <CalendarContent
        events={events}
        cellClassName="relative z-20 hover:z-30"
        renderEvent={(e) => (
          <div
            dir="rtl"
            className="absolute inset-0 p-1"
            key={e.id + e.instructor}
          >
            <ScheduleCard
              className={clsx(
                makeHoverKey(e) === hoveredKey &&
                  !e.isSelected &&
                  "scale-110 opacity-85 backdrop-blur-xl",
              )}
              item={e}
              courseName={enrollments?.[e.courseId].courseMeta.name ?? ""}
              isSelected={e.isSelected}
              weekNumber={props.weekNum}
              onMouseEnter={() =>
                !e.isSelected && setHoveredKey(makeHoverKey(e))
              }
              onMouseLeave={() => !e.isSelected && setHoveredKey(null)}
              onClick={props.onClickScheduleCard}
              isEditMode={props.isEditMode ?? false}
            />
          </div>
        )}
      />
    </WeeklyCalendar>
  );
}

function makeHoverKey(item: ScheduleItem) {
  return `${item.courseId}-${item.sessionType}-${item.sectionId}`;
}

export default ScheduleItemsCalendar;
