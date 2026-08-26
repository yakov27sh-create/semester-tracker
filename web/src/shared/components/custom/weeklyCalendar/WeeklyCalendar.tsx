import {
  generateTimeStrings,
  generateDayStrings,
  timeToRowNumber,
} from "./utils";

import GridBackground from "./GridBackground";
import PositionedGrid from "./positionedGrid/PositionedGrid";

import { createContext, useContext, type ReactNode } from "react";
import clsx from "clsx";

export type CalendarEvent<T> = {
  id: number | string;
  payload?: T;
  startMinute: number;
  endMinute: number;
  day: number;
};

type WeeklyCalendarProps = {
  className?: string;
  cellClassName?: string;
  columnClassName?: string;
  contentAreaClassName?: string;
  children?: ReactNode;
  days: number[];
  gapInMinutes: number;
  startHour: string;
  endHour: string;
};

type CalendarContext = {
  dayStrings: string[];
  gapInMinutes: number;
  timeStrings: string[];
  startHour: string;
  endHour: string;
};

const CalendarContext = createContext<CalendarContext | null>(null);
const useCalendarContext = () => {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("Calendar context used outside context");
  return ctx;
};

function WeeklyCalendar({
  className,
  children,
  days = [0, 1, 2, 3, 4],
  startHour = "7:30",
  endHour = "19:30",
  gapInMinutes = 60,
}: WeeklyCalendarProps) {
  const timeStrings = generateTimeStrings(startHour, endHour, gapInMinutes);
  const dayStrings = generateDayStrings(days);

  return (
    <CalendarContext.Provider
      value={{
        gapInMinutes: gapInMinutes,
        timeStrings: timeStrings,
        dayStrings: dayStrings,
        startHour: startHour,
        endHour: endHour,
      }}
    >
      <div dir="rtl" className={clsx(className, "isolate", "flex flex-col")}>
        {/* Top Row */}
        <div className="flex">
          {/* Corner Cell */}
          <div className="w-15"></div>
          {/* Day Header Cells */}
          <div className="flex justify-evenly flex-1">
            {dayStrings.map((s) => (
              <DayHeader key={s} className={clsx("w-full")} dayString={s} />
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-1">
          {/* Time Header Cells */}
          <div className="w-15 h-full flex flex-col justify-evenly p-1 gap-2">
            {timeStrings.map((s) => (
              <TimeHeader key={s} className="h-full w-full" timeString={s} />
            ))}
          </div>

          {/** Content **/}
          <div className="flex-1 relative h-full">
            <GridBackground
              className="absolute inset-0 -z-10"
              numberOfRows={timeStrings.length * 2}
              numberOfColumns={dayStrings.length}
            />
            {children}
          </div>
        </div>
      </div>
    </CalendarContext.Provider>
  );
}

export type CalendarContentProps<T = unknown> = {
  events: CalendarEvent<T>[];
  renderEvent: (payload: T) => ReactNode;
  className?: string;
  columnClassName?: string;
  cellClassName?: string;
};

export function CalendarContent<T = unknown>({
  events,
  renderEvent,
  className = "",
  columnClassName = "",
  cellClassName = "",
}: CalendarContentProps<T>) {
  const { timeStrings, dayStrings, startHour, gapInMinutes } =
    useCalendarContext();
  return (
    <PositionedGrid
      className={"w-full h-full " + className}
      columnOptions={{
        className: "h-full " + columnClassName,
        cellClassName: "" + cellClassName,
        numOfRows: timeStrings.length * 2,
      }}
      items={events.map((e) => {
        const startRow = timeToRowNumber(
          e.startMinute,
          startHour,
          gapInMinutes / 2,
        );

        const endRow = timeToRowNumber(
          e.endMinute,
          startHour,
          gapInMinutes / 2,
        );

        return {
          item: renderEvent(e.payload as T),
          id: e.id,
          column: e.day + 1,
          row: startRow + 1,
          rowSpan: endRow - startRow,
        };
      })}
      options={{
        numOfColumns: dayStrings.length,
      }}
    />
  );
}

function TimeHeader({
  timeString,
  className,
}: {
  timeString: string;
  className: string;
}) {
  return (
    <div
      className={clsx("flex items-start justify-center font-bold", className)}
    >
      {timeString}
    </div>
  );
}

function DayHeader({
  dayString,
  className,
}: {
  dayString: string;
  className: string;
}) {
  return (
    <div
      className={clsx("flex items-center justify-center font-bold ", className)}
    >
      {dayString}
    </div>
  );
}

export default WeeklyCalendar;
