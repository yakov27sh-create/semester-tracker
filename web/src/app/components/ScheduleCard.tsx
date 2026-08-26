import clsx from "clsx";
import { motion } from "motion/react";
import React, { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { makeTimeString } from "@/shared/utils/timeUtils";
import { useClickOutside } from "@/shared/utils/hooks";
import { setIntersection } from "@/shared/utils/set";

import type { ScheduleItem } from "@/entities/course/types";
import { useToggleSelectedSectionMO } from "@/entities/user-course/hooks";

import {
  darkenHsl,
  makeGradientBackground,
} from "@/features/course-customization/colors";
import { useCourseColor } from "@/features/course-customization/hooks";
import WeeklySessionTypeProgressCard from "@/features/course-progress/WeeklySessionTypeProgressCard";
import { useWeeklySessionTypeProgressQO } from "@/features/course-progress/hooks";
import SectionSelectCard from "@/features/course-section-select/SectionSelectCard";
import AddResourcePopover from "@/features/resources/components/AddResourceForm";
import { useGetResourceForCourseQO } from "@/features/resources/hooks";
import ResourceList from "@/features/resources/components/ScrollList";

const TEXT_STYLE: React.CSSProperties = {
  fontWeight: "bold",
  color: "var(--course-text)",
};

type ScheduleCardProps = {
  className?: string;
  isSelected: boolean;
  item: ScheduleItem;
  courseName: string;
  weekNumber: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
}: ScheduleCardProps) {
  const courseColor = useCourseColor(item.courseId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHeightAuto, setsHeightAuto] = useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const { data: resources } = useQuery(
    useGetResourceForCourseQO(item.courseId),
  );
  const { data: completionPercent } = useQuery(
    useWeeklySessionTypeProgressQO(
      item.courseId,
      item.sessionType,
      weekNumber,
      item.timeSlots,
    ),
  );
  useClickOutside(containerRef, () => {
    onMouseLeave?.();
    setsHeightAuto(false);
  });

  // A resource belongs to this card if it was added for the same week under
  // the same sessionType (slot indices are only comparable within one
  // sessionType) and more than half of the card's time slots overlap with
  // the resource's stored slots — the overlap check (rather than requiring
  // the exact same slots) means a resource still shows up if the card's
  // slots shift slightly within that week (e.g. a makeup session).
  const res =
    resources?.filter((r) => {
      if (r.week !== weekNumber || r.sessionType !== item.sessionType)
        return false;
      const overlap = setIntersection(item.timeSlots, new Set(r.timeSlots));
      return overlap.size / item.timeSlots.size > 0.5;
    }) ?? [];
  return (
    <motion.div
      ref={containerRef}
      layout
      transition={{ type: "spring", stiffness: 1000, damping: 25, mass: 0.2 }}
      animate={{ scale: isHeightAuto ? 1.1 : 1 }}
      className={clsx(
        !isSelected && "opacity-50 relative",
        "rounded-sm  shadow-md",
        "flex flex-col justify-start items-center",
        "min-w-full min-h-full ",
        className,
        isHeightAuto ? "h-auto w-fit z-20" : "h-full overflow-hidden",
      )}
      style={{
        x: -1,
        y: -2,
        background: makeGradientBackground(
          completionPercent === 100 ? darkenHsl(courseColor, 20) : courseColor,
        ),
        boxShadow: `1px 3px 0px 0px ${darkenHsl(courseColor, completionPercent === 100 ? 50 : 20)}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setsHeightAuto(true);
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
      <div className="flex gap-2">
        <div>
          <WeeklySessionTypeProgressCard
            className="mb-1 mt-1 border-b border-course-text text-truncate"
            textStyles={{
              ...TEXT_STYLE,
              opacity: completionPercent === 100 ? "0.6" : "1",
            }}
            courseId={item.courseId}
            sessionType={item.sessionType}
            slotIndices={item.timeSlots}
            weekNumber={weekNumber}
            courseName={courseName}
          >
            {isSelected && <WeeklySessionTypeProgressCard.CompleteButton />}
          </WeeklySessionTypeProgressCard>
          <SectionSelectCard
            className="mb-0.5"
            textStyles={{
              ...TEXT_STYLE,
              opacity: completionPercent === 100 ? "0.6" : "1",
            }}
            courseId={item.courseId}
            sessionType={item.sessionType}
            sectionId={item.sectionId}
            instructorName={item.instructor}
            groupNum={0}
            selectButton={
              isSelected ? <SectionSelectCard.SelectButton /> : null
            }
          />
          <ExtraInfo
            item={item}
            opacity={completionPercent === 100 ? "0.6" : "1"}
          />
        </div>
        {(isAddingResource || (isSelected && isHeightAuto)) && (
        <div
          className={clsx(
            "h-30 w-30 outline ouline-red-500 absolute top-1 flex flex-col ",
              "bg-primary/40 rounded-md max-h-100 overflow-hidden",
            item.dayOfWeek < 2 ? "right-full" : "left-full",
          )}
        >
            <AddResourcePopover
              courseId={item.courseId}
              resourceMeta={{
                sessionType: item.sessionType,
                week: weekNumber,
                timeSlots: [...item.timeSlots],
              }}
              onToggle={() => setIsAddingResource(!isAddingResource)}
            />
            <ResourceList resources={res} />
          </div>
        )}
        {!isSelected && <SelectOverlay item={item} />}
      </div>
    </motion.div>
  );
}

function SelectOverlay({ item }: { item: ScheduleItem }) {
  const toggleSelectionTrigger = useMutation(useToggleSelectedSectionMO());
  return (
    <button
      className="absolute inset-0 cursor-pointer"
      onClick={() =>
        toggleSelectionTrigger.mutate({
          courseId: item.courseId,
          sessionType: item.sessionType,
          sectionId: item.sectionId,
        })
      }
    ></button>
  );
}

function ExtraInfo({
  item,
  opacity,
}: {
  item: ScheduleItem;
  opacity?: string;
}) {
  const timeString = makeTimeString(item.startMinute, item.endMinute);
  return (
    <div className="text-center">
      <div
        className="text-[0.6rem]"
        style={{ ...TEXT_STYLE, opacity: opacity }}
      >
        {timeString}
      </div>
    </div>
  );
}

export default ScheduleCard;
