import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { CheckIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
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
  useUserCoursesQueryOptions,
} from "@/entities/user-course/hooks";

import { useWeeklySessionTypeProgressQO } from "@/features/course-progress/hooks";
import AddResourcePopover from "@/features/resources/components/AddResourceForm";
import { useResourceSignedUrlsQO } from "@/features/resources/hooks";

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
  const { data: course, isLoading: isCourseLoading } = useQuery({
    ...useUserCoursesQueryOptions(),
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

  const resources =
    course?.resources.filter(
      (r) =>
        r.sessionType === props.sessionType &&
        r.week === props.weekNumber &&
        overlapsSession(new Set(r.timeSlots), props.timeSlots),
    ) ?? [];

  const storagePaths = resources
    .map((r) => r.storagePath)
    .filter((p): p is string => !!p);
  const { data: signedUrls } = useQuery(useResourceSignedUrlsQO(storagePaths));

  return (
    <Dialog open={props.open} onOpenChange={() => props.onOpenChange()}>
      {isCourseLoading ? (
        <Spinner />
      ) : (
        <DialogContent dir="rtl" className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle dir="rtl" className="mt-2 text-center">
              {course?.courseMeta.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-center gap-0.5 text-center text-sm">
              <div className="font-bold">{props.sessionType}</div>
              <div className="text-muted-foreground">{`שבוע: ${props.weekNumber}`}</div>
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
                  "bg-secondary",
                  "border-3 border-border",
                  "shadow-md",
                  "hover:scale-110 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
                )}
                disabled={!props.onChangeSelection}
                onClick={() => props.onChangeSelection?.()}
              >
                <RefreshCwIcon strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              {resources.length === 0 ? (
                <p className="text-muted-foreground text-xs col-span-2 text-center">
                  אין קבצים
                </p>
              ) : (
                resources.map((r) => {
                  const href = r.storagePath
                    ? signedUrls?.[r.storagePath]
                    : r.url;
                  return (
                    <div
                      key={r.storagePath ?? r.url}
                      className="p-1 text-xs truncate text-center"
                    >
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {r.title}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          {r.title}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
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

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default SessionWindow;
