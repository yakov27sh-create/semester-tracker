import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";

import type { ScheduleItem } from "@/entities/course/types";
import {
  useCurrentWeekNumber,
  useTotalWeekCount,
} from "@/entities/semester/hooks";
import { useToggleSelectedSectionMO } from "@/entities/user-course/hooks";

import WeekSelector from "@/widgets/week-selector/WeekSelector";
import ScheduleItemsCalendar from "@/widgets/schedule-calendar/ScheduleItemsCalendar";
import SessionWindow from "@/widgets/session-window/SessionWindow";

type WeeklyViewProps = {
  className?: string;
};

function WeeklyView(props: WeeklyViewProps) {
  const currentWeekNumber = useCurrentWeekNumber();
  const totalWeekCount = useTotalWeekCount();
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(
    undefined,
  );
  const [openSession, setOpenSession] = useState<ScheduleItem | null>(null);
  const [isEditModeOverride, setIsEditModeOverride] = useState<
    boolean | undefined
  >(undefined);
  const toggleSelectionTrigger = useMutation(useToggleSelectedSectionMO());

  // Default to the current week of the semester until the user picks one.
  const week = selectedWeek ?? currentWeekNumber;
  if (week === undefined || totalWeekCount === undefined) return null;

  // Default into edit mode before the semester starts or after it ends,
  // until the user explicitly picks a mode themselves.
  const isEditMode =
    isEditModeOverride ?? (week < 0 || week > totalWeekCount);

  return (
    <div className={clsx("flex flex-col", props.className)}>
      <div className="flex justify-center">
        <WeekSelector
          numOfWeeks={totalWeekCount}
          setSelectedWeekNumber={setSelectedWeek}
          selectedWeekNumber={week}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditModeOverride}
        />
      </div>
      <ScheduleItemsCalendar
        className="flex-1"
        weekNum={week}
        onClickScheduleCard={setOpenSession}
        isEditMode={isEditMode}
      />
      <SessionWindow
        courseId={openSession?.courseId ?? ""}
        sessionType={openSession?.sessionType ?? ""}
        timeSlots={openSession?.timeSlots ?? new Set()}
        weekNumber={week}
        open={openSession !== null}
        onOpenChange={() => setOpenSession(null)}
        onChangeSelection={
          openSession
            ? () => {
                toggleSelectionTrigger.mutate({
                  courseId: openSession.courseId,
                  sessionType: openSession.sessionType,
                  sectionId: openSession.sectionId,
                });
                setOpenSession(null);
              }
            : null
        }
      />
    </div>
  );
}

export default WeeklyView;
