import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { DialogFooter, DialogHeader } from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";

import {
  useDeleteUserCourseMO,
  useUserCoursesQueryOptions,
} from "@/entities/user-course/hooks";

import ColorList from "@/features/course-customization/components/ColorList";
import { useSetCourseColor } from "@/features/course-customization/hooks";
import { Spinner } from "@/shared/components/ui/spinner";

type CourseWindowProps = {
  courseId: string;
  open: boolean;
  onOpenChange: () => void;
};

function CourseWindow(props: CourseWindowProps) {
  const { data: course, isLoading: isCourseLoading } = useQuery({
    ...useUserCoursesQueryOptions(),
    select: (data) => {
      return data[props.courseId];
    },
  });
  const setCourseColorTrigger = useSetCourseColor();
  const deleteCourseTrigger = useMutation(useDeleteUserCourseMO());

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
          <Separator />
          <div className="flex justify-between items-center">
            <Button
              variant="destructive"
              onClick={() => {
                props.onOpenChange();
                deleteCourseTrigger.mutate(props.courseId);
              }}
            >
              מחק קורס
            </Button>
            <ColorList
              className="flex justify-start gap-1 flex-wrap h-auto max-w-30 "
              onClickColor={(color) => {
                setCourseColorTrigger.mutate({
                  courseId: props.courseId,
                  color: color,
                });
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

export default CourseWindow;
