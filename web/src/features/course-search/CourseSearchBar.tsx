import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Check, PlusCircleIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

import { useAddUserCourseMutationOptions } from "@/entities/user-course/hooks";
import { useAllCoursesQueryOptions } from "@/entities/course/hooks";
import type { Course } from "@/entities/course/types";
import { Spinner } from "@/shared/components/ui/spinner";

// TODO: Have the courses grouped by faculty
function CourseSearchBar() {
  const { data: courseList, isLoading: isCourseListLoading } = useQuery(
    useAllCoursesQueryOptions(),
  );
  const addCourseTrigger = useMutation(useAddUserCourseMutationOptions());

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const onClickCourse = (course: Course) => {
    addCourseTrigger.mutate(course);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-6 h-6 rounded-full"
        >
          <PlusCircleIcon className="opacity-50 w-6 h-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command dir="rtl">
          <CommandInput placeholder="חיפוש קורסים" className="h-9" />
          <CommandList>
            <CommandEmpty>{"אין תוצאות"}</CommandEmpty>
            <CommandGroup>
              {isCourseListLoading ? (
                <CoursesLoading />
              ) : (
                courseList?.map((course) => (
                  <CommandItem
                    key={course.name + course.id}
                    value={course.name}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      onClickCourse(course);
                      setOpen(false);
                    }}
                  >
                    {course.name}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === course.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CoursesLoading() {
  return <Spinner />;
}

export default CourseSearchBar;
