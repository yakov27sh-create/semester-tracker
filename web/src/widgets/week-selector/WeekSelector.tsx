import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";

import {
  useWeekProgressSummariesQO,
  type WeekProgressSummaries,
} from "@/features/course-progress/hooks";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/shared/components/ui/radio-group";

type WeekSelectorProps = {
  className?: string;
  numOfWeeks: number;
  selectedWeekNumber: number;
  setSelectedWeekNumber: (n: number) => void;
};

function WeekSelector(props: WeekSelectorProps) {
  const { data: progressSummaries } = useQuery(useWeekProgressSummariesQO());

  const weeks = Array.from({ length: props.numOfWeeks }, (_, i) => i + 1);

  return (
    <RadioGroup
      dir="rtl"
      value={String(props.selectedWeekNumber)}
      onValueChange={(value) => props.setSelectedWeekNumber(Number(value))}
      className={clsx("flex items-center gap-2", props.className)}
      aria-label="שבוע"
    >
      {weeks.map((week) => {
        const isSelected = week === props.selectedWeekNumber;
        return (
          <div
            key={"week-" + week}
            className="flex h-11 flex-col items-center justify-center gap-1 md:h-13"
          >
            <div
              className="h-1 w-1 rounded-full"
              style={{
                background: progressStringToColor(progressSummaries?.[week]),
              }}
            />
            <RadioGroupItem
              value={String(week)}
              className={clsx(
                "flex aspect-square shrink-0 items-center justify-center border-0 text-sm leading-none font-bold shadow-none select-none cursor-pointer transition-all duration-200 md:text-base",
                isSelected
                  ? "size-9 rounded-full bg-accent md:size-11"
                  : "size-7 bg-transparent md:size-9 hover:scale-110",
                progressStringToTWClass(progressSummaries?.[week]),
              )}
            >
              {week}
            </RadioGroupItem>
          </div>
        );
      })}
    </RadioGroup>
  );
}

function progressStringToColor(
  summary: WeekProgressSummaries[number] | undefined,
) {
  if (!summary) return "transparent";
  const map: Record<typeof summary, string> = {
    ahead: "var(--ahead)",
    behind: "var(--behind)",
    completed: "transparent",
    default: "transparent",
  };
  return map[summary];
}

function progressStringToTWClass(
  summary: WeekProgressSummaries[number] | undefined,
) {
  if (!summary) return "";
  const map: Record<typeof summary, string> = {
    ahead: "",
    behind: "",
    completed: "opacity-80 line-through",
    default: "",
  };
  return map[summary];
}

export default WeekSelector;
