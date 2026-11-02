import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { CheckIcon, PencilIcon, RefreshCcwIcon } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";
import { Spinner } from "@/shared/components/ui/spinner";
import { generateDayStrings } from "@/shared/components/custom/weeklyCalendar/utils";
import { makeTimeString } from "@/shared/utils/timeUtils";
import { setIntersection } from "@/shared/utils/set";

import type { SlotIndex } from "@/entities/course/types";
import {
  useToggleTimeslotsMO,
  useEnrollmentsQueryOptions,
} from "@/entities/enrollment/hooks";
import { useCourseResourcesQO } from "@/entities/resource/hooks";

import { useWeeklySessionTypeProgressQO } from "@/features/course-progress/hooks";
import AddResourcePopover from "@/features/resources/components/AddResourceForm";
import ResourceList from "@/features/resources/components/ScrollList";

type SessionWindowProps = {
  courseId: string;
  sessionType: string;
  timeSlots: Set<SlotIndex>;
  weekNumber: number;
  open: boolean;
  onOpenChange: () => void;
  onChangeSelection: (() => void) | null;
};

// A schedule item or resource "belongs" to this session if more than half of
// this session's time slots overlap with it — the overlap check (rather than
// an exact match) tolerates slight slot drift (e.g. a makeup session). Same
// rule ScheduleCard uses to match resources.
function overlapsSession(
  timeSlots: Set<SlotIndex>,
  sessionTimeSlots: Set<SlotIndex>,
) {
  const overlap = setIntersection(timeSlots, sessionTimeSlots);
  return overlap.size / sessionTimeSlots.size > 0.5;
}

function SessionWindow(props: SessionWindowProps) {
  const [isEditingResources, setIsEditingResources] = useState(false);
  const { data: course, isLoading: isCourseLoading } = useQuery({
    ...useEnrollmentsQueryOptions(),
    select: (data) => data[props.courseId],
  });
  const { data: completionPercent = 0 } = useQuery(
    useWeeklySessionTypeProgressQO(
      props.courseId,
      props.sessionType,
      props.weekNumber,
      props.timeSlots,
    ),
  );
  const toggleTimeSlotsTrigger = useMutation(useToggleTimeslotsMO());
  const isComplete = completionPercent === 100;

  const scheduleItem = course?.courseMeta.schedule[props.sessionType]?.find(
    (i) => overlapsSession(i.timeSlots, props.timeSlots),
  );

  const { data: courseResources = [] } = useQuery(
    useCourseResourcesQO(props.courseId),
  );
  const resources = courseResources.filter(
    (r) =>
      r.sessionType === props.sessionType &&
      r.week === props.weekNumber &&
      overlapsSession(new Set(r.timeSlots), props.timeSlots),
  );

  return (
    <Dialog open={props.open} onOpenChange={() => props.onOpenChange()}>
      {isCourseLoading ? (
        <Spinner />
      ) : (
        <DialogContent
          dir="rtl"
          className="sm:max-w-[425px] flex max-h-[calc(100dvh-2rem)] flex-col"
        >
          <DialogHeader>
            <DialogTitle
              dir="rtl"
              className="mt-2 flex items-center justify-center gap-2"
            >
              <span>{props.sessionType}</span>
              <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
              <span>{course?.courseMeta.name}</span>
              <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
              <span>{`שבוע ${props.weekNumber}`}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 flex flex-col items-center gap-0.5 text-center text-sm">
              {scheduleItem && (
                <>
                  <div className="text-muted-foreground">
                    {generateDayStrings([scheduleItem.dayOfWeek])[0]}
                    {", "}
                    {makeTimeString(
                      scheduleItem.startMinute,
                      scheduleItem.endMinute,
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {scheduleItem.instructor}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                className={clsx(
                  "group",
                  "aspect-square",
                  "flex items-center justify-center",
                  "rounded-full",
                  "min-h-8",
                  "bg-completion",
                  "border-3 border-border",
                  "shadow-md",
                  "hover:scale-110 cursor-pointer",
                  !isComplete && "opacity-40",
                )}
                onClick={() =>
                  toggleTimeSlotsTrigger.mutate({
                    courseId: props.courseId,
                    sessionType: props.sessionType,
                    weekNumber: props.weekNumber,
                    timeslots: props.timeSlots,
                  })
                }
              >
                <CheckIcon
                  strokeWidth={2.5}
                  className={clsx(
                    !isComplete && "opacity-0 group-hover:opacity-100",
                  )}
                />
              </button>
              <button
                className={clsx(
                  "aspect-square",
                  "flex items-center justify-center",
                  "rounded-full",
                  "min-h-8",
                  "border-3 border-border",
                  "shadow-md",
                  "hover:scale-110 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
                )}
                disabled={!props.onChangeSelection}
                onClick={() => props.onChangeSelection?.()}
              >
                <RefreshCcwIcon strokeWidth={2.5} className="size-4" />
              </button>
            </div>
          </div>

          <Separator />

          <div className="flex min-h-0 flex-1 gap-2">
            {resources.length > 0 && 
            <button
              type="button"
              className={clsx(
                "aspect-square shrink-0 self-center",
                "flex items-center justify-center",
                "rounded-full",
                "min-h-8",
                "border-3 border-border",
                "shadow-md",
                "hover:scale-110 cursor-pointer transition-all",
                isEditingResources && "bg-primary text-primary-foreground scale-110",
              )}
              aria-pressed={isEditingResources}
              onClick={() => setIsEditingResources((editing) => !editing)}
            >
              <PencilIcon strokeWidth={2.5} className="size-4" />
            </button>
              }
            <div className="min-w-0 min-h-0 flex-1">
              <ResourceList
                resources={resources}
                isEditMode={isEditingResources}
              />
            </div>
            <AddResourcePopover
              courseId={props.courseId}
              resourceMeta={{
                sessionType: props.sessionType,
                week: props.weekNumber,
                timeSlots: [...props.timeSlots],
              }}
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default SessionWindow;
