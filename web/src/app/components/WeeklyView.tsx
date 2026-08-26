import { useState } from "react";
import clsx from "clsx";

import WeekSelector from "./WeekSelector";
import ScheduleItemsCalendar from "./ScheduleItemsCalendar";

type WeeklyViewProps = {
  className?: string;
};

function WeeklyView(props: WeeklyViewProps) {
  const [selectedWeek, setSelectedWeek] = useState(5);
  return (
    <div className={clsx("flex flex-col", props.className)}>
      <div className="flex justify-center font-bold text-primary">
        <WeekSelector
          numOfWeeks={13}
          setSelectedWeekNumber={setSelectedWeek}
          selectedWeekNumber={selectedWeek}
        />
      </div>
      <ScheduleItemsCalendar className="flex-1" weekNum={selectedWeek} />
    </div>
  );
}

export default WeeklyView;
