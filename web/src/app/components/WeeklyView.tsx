import { useState } from "react";
import clsx from "clsx";

import {
  useCurrentWeekNumber,
  useTotalWeekCount,
} from "@/entities/semester/hooks";

import WeekSelector from "./WeekSelector";
import ScheduleItemsCalendar from "./ScheduleItemsCalendar";

type WeeklyViewProps = {
  className?: string;
};

function WeeklyView(props: WeeklyViewProps) {
  const currentWeekNumber = useCurrentWeekNumber();
  const totalWeekCount = useTotalWeekCount();
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(
    undefined,
  );

  // Default to the current week of the semester until the user picks one.
  const week = selectedWeek ?? currentWeekNumber;
  if (week === undefined || totalWeekCount === undefined) return null;

  return (
    <div className={clsx("flex flex-col", props.className)}>
      <div className="flex justify-center">
        <WeekSelector
          numOfWeeks={totalWeekCount}
          setSelectedWeekNumber={setSelectedWeek}
          selectedWeekNumber={week}
        />
      </div>
      <ScheduleItemsCalendar className="flex-1" weekNum={week} />
    </div>
  );
}

export default WeeklyView;
