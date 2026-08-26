import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { LayoutGroup, motion } from "motion/react";

import {
  useWeekProgressSummariesQO,
  type WeekProgressSummaries,
} from "@/features/course-progress/hooks";

type WeekSelectorProps = {
  className?: string;
  numOfWeeks: number;
  selectedWeekNumber: number;
  setSelectedWeekNumber: (n: number) => void;
};

function WeekSelector(props: WeekSelectorProps) {
  const { data: progressSummaries } = useQuery(useWeekProgressSummariesQO());

  const weekStr = "שבוע";
  const strings = Array.from({ length: props.numOfWeeks + 1 }).map((_, i) => {
    if (i < props.selectedWeekNumber - 1) return `${i + 1}`;
    if (i === props.selectedWeekNumber - 1) return weekStr;
    return `${i}`;
  });

  return (
    <LayoutGroup>
      <div className={clsx("flex gap-2 items-end", props.className)}>
        {strings.map((s, i) => (
          <motion.div
            className={clsx("flex flex-col justify-end items-center")}
            key={"week-" + s}
            layout
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 40,
              mass: 0.3,
            }}
          >
            {s != weekStr && (
              <div
                className="h-1 w-1 rounded-full translate-y-0.5"
                style={{
                  background: progressStringToColor(
                    progressSummaries?.[Number(s)],
                  ),
                }}
              />
            )}
            <button
              onClick={() =>
                Number(s) && props.setSelectedWeekNumber(Number(s))
              }
              className={clsx(
                "select-none  ",
                Number(s) === props.selectedWeekNumber || s === "שבוע"
                  ? "text-2xl md:text-5xl"
                  : "text-xs md:text-lg hover:scale-110 cursor-pointer",
                progressStringToTWClass(
                  progressSummaries?.[s === "שבוע" ? i + 1 : Number(s)],
                ),
              )}
            >
              {s}
            </button>
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
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
