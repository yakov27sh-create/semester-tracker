import clsx from "clsx";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";

import { makeTimeString } from "@/shared/utils/timeUtils";
import { useClickOutside } from "@/shared/utils/hooks";

import type { ScheduleItem } from "@/entities/course/types";
import {
  useToggleSelectedSectionMO,
  useToggleTimeslotsMO,
} from "@/entities/enrollment/hooks";

import { makeGradientBackground } from "@/features/course-customization/colors";
import { useCourseColor } from "@/features/course-customization/hooks";
import { useWeeklySessionTypeProgressQO } from "@/features/course-progress/hooks";

type ScheduleCardProps = {
  className?: string;
  isSelected: boolean;
  item: ScheduleItem;
  courseName: string;
  weekNumber: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: (item: ScheduleItem) => void;
  isEditMode: boolean;
  attributes?: React.HTMLAttributes<HTMLDivElement>;
};

function ScheduleCard({
  item,
  isSelected,
  courseName,
  className,
  weekNumber,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isEditMode,
}: ScheduleCardProps) {
  const courseColor = useCourseColor(item.courseId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHeightAuto, setsHeightAuto] = useState(false);
  const { data: completionPercent = 0 } = useQuery(
    useWeeklySessionTypeProgressQO(
      item.courseId,
      item.sessionType,
      weekNumber,
      item.timeSlots,
    ),
  );
  const toggleTimeSlotsTrigger = useMutation(useToggleTimeslotsMO());
  const toggleSelectionTrigger = useMutation(useToggleSelectedSectionMO());
  const isComplete = completionPercent === 100;

  useClickOutside(containerRef, () => {
    onMouseLeave?.();
    setsHeightAuto(false);
  });

  const timeString = makeTimeString(item.startMinute, item.endMinute);

  return (
    <motion.div
      ref={containerRef}
      layout
      layoutDependency={isHeightAuto}
      transition={{ type: "spring", stiffness: 1000, damping: 25, mass: 0.2 }}
      animate={{ scale: isHeightAuto ? 1.1 : 1 }}
      className={clsx(
        isSelected ? "cursor-pointer" : "opacity-50 relative",
        "rounded-sm shadow-md",
        "border-3 border-border",
        "flex items-start justify-center relative",
        "min-w-full min-h-full",
        className,
        isHeightAuto ? "h-auto w-fit z-20" : "h-full overflow-hidden",
      )}
      style={{
        background: makeGradientBackground(courseColor),
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isSelected && isEditMode) {
          toggleSelectionTrigger.mutate({
            courseId: item.courseId,
            sessionType: item.sessionType,
            sectionId: item.sectionId,
          });
          return;
        }
        setsHeightAuto(true);
        onClick?.(item);
      }}
      onFocus={() => {
        onMouseEnter?.();
        setsHeightAuto(true);
      }}
      onBlur={() => {
        onMouseLeave?.();
        setsHeightAuto(false);
      }}
      onMouseEnter={() => {
        onMouseEnter?.();
        setsHeightAuto(true);
      }}
      onMouseLeave={() => {
        onMouseLeave?.();
        setsHeightAuto(false);
      }}
    >
      <div className="flex flex-col items-center gap-0.5 text-center font-bold text-course-text">
        <div className="text-[0.6rem] sm:text-sm">{item.sessionType}</div>
        {!isEditMode && (
          <div
            className={clsx(
              "text-[0.5rem] sm:text-xs",
              isComplete && "opacity-60 line-through decoration-course-text",
            )}
          >{`שבוע: ${weekNumber}`}</div>
        )}
        <div className="text-[0.4rem] sm:text-xs">{courseName}</div>
        <div className="text-[0.5rem] sm:text-xs">{`קב' 0`}</div>
        <div className="text-[0.5rem] sm:text-xs">{item.instructor}</div>
        <div className="text-[0.6rem]">{timeString}</div>
      </div>

      {isSelected && !isEditMode && (
        <motion.div
          layout
          layoutDependency={isHeightAuto}
          className="absolute top-1 left-1 flex flex-col gap-1"
        >
          <button
            className={clsx(
              "group",
              "aspect-square",
              "flex items-center justify-center",
              "rounded-full",
              "min-h-4 sm:min-h-8",
              "max-h-10",
              "bg-completion",
              "border-3 border-border",
              "shadow-md",
              "hover:scale-120 cursor-pointer",
              !isComplete && "opacity-40",
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleTimeSlotsTrigger.mutate({
                courseId: item.courseId,
                sessionType: item.sessionType,
                weekNumber,
                timeslots: item.timeSlots,
              });
            }}
          >
            <CheckIcon
              strokeWidth={2.5}
              className={clsx(!isComplete && "opacity-0 group-hover:opacity-100")}
            />
          </button>
        </motion.div>
      )}

      {!isSelected && <SelectOverlay item={item} />}
    </motion.div>
  );
}

function SelectOverlay({ item }: { item: ScheduleItem }) {
  const toggleSelectionTrigger = useMutation(useToggleSelectedSectionMO());
  return (
    <button
      className="absolute inset-0 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        toggleSelectionTrigger.mutate({
          courseId: item.courseId,
          sessionType: item.sessionType,
          sectionId: item.sectionId,
        });
      }}
    ></button>
  );
}

export default ScheduleCard;
