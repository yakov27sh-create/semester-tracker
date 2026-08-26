import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";

import { CheckIcon } from "lucide-react";

import { useToggleTimeslotsMO } from "@/entities/user-course/hooks";
import type { SlotIndex } from "@/entities/course/types";

import { useWeeklySessionTypeProgressQO } from "./hooks";

export type WeeklySessionTypeProgressCardProps = {
  className?: string;
  textStyles?: CSSProperties;
  courseId: string;
  sessionType: string;
  weekNumber: number;
  slotIndices: Set<SlotIndex>;
  courseName: string;
  children?: ReactNode;
};

const WSTPCContext = createContext<
  (WeeklySessionTypeProgressCardProps & { completionPercent: number }) | null
>(null);

function useWSTPCContext() {
  const ctx = useContext(WSTPCContext);
  if (!ctx) throw Error({ error: "error" });
  return ctx;
}

function WeeklySessionTypeProgressCard(
  props: WeeklySessionTypeProgressCardProps,
) {
  const {
    data: completionPercent,
    isLoading,
    isError,
    error,
  } = useQuery(
    useWeeklySessionTypeProgressQO(
      props.courseId,
      props.sessionType,
      props.weekNumber,
      props.slotIndices,
    ),
  );

  if (isLoading) return <Loading />;
  if (isError || completionPercent === undefined)
    return <Error error={error?.message ?? "error"} />;

  return (
    <WSTPCContext.Provider
      value={{ ...props, completionPercent: completionPercent }}
    >
      <div
        className={clsx(
          completionPercent === 100
            ? "line-through decoration-course-text "
            : "",
          props.className,
        )}
      >
        <div className="flex flex-wrap-reverse items-center justify-between mb-0.5 gap-1 sm:gap-3">
          <TypeAndWeekNumber className="flex-1 mr-1 " />
          <div className="flex-1 flex items-center justify-center">
            {props.children}
          </div>
        </div>

        <div
          className=" text-[0.4rem] sm:text-xs
				sm:mr-2
			"
          style={props.textStyles}
        >
          {props.courseName}
        </div>
      </div>
    </WSTPCContext.Provider>
  );
}

function TypeAndWeekNumber({ className }: { className?: string }) {
  const { textStyles, weekNumber, sessionType } = useWSTPCContext();
  return (
    <div className={className}>
      <div
        className="text-[0.6rem] sm:text-sm
		font-bold 
		text-center
		"
        style={textStyles}
      >
        {sessionType}
      </div>
      <div
        className="text-[0.5rem] sm:text-xs 
		text-nowrap text-center"
        style={textStyles}
      >
        {`שבוע: ${weekNumber}`}
      </div>
    </div>
  );
}
function CompleteButton() {
  const toggleTimeSlotsTrigger = useMutation(useToggleTimeslotsMO());
  const { courseId, sessionType, weekNumber, slotIndices, completionPercent } =
    useWSTPCContext();
  return (
    <button
      className={clsx(
        "group",
        "aspect-square",
        "flex items-center justify-center",
        "rounded-full",
        "min-h-4 sm:min-h-8",
        "max-h-10",
        "bg-completion",
        "border-3 border-course-text",
        "shadow-md",
        "hover:scale-120 cursor-pointer",
        completionPercent !== 100 && "opacity-40",
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleTimeSlotsTrigger.mutate({
          courseId: courseId,
          sessionType: sessionType,
          weekNumber: weekNumber,
          timeslots: slotIndices,
        });
      }}
    >
      <CheckIcon
        strokeWidth={2.5}
        className={clsx(
          "text-course-text",
          completionPercent !== 100 && "opacity-0 group-hover:opacity-100",
        )}
      />
    </button>
  );
}

WeeklySessionTypeProgressCard.CompleteButton = () => <CompleteButton />;

export default WeeklySessionTypeProgressCard;

function Loading() {
  return <div>loading</div>;
}

function Error({ error }: { error: string }) {
  return <div>{error}</div>;
}
