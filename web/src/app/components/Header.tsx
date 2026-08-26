import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import clsx from "clsx";
import { SunIcon, MoonIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

import { useUserCoursesQueryOptions } from "@/entities/user-course/hooks";

import HeaderAuth from "@/features/auth/components/HeaderAuth";
import CourseSearchBar from "@/features/course-search/CourseSearchBar";
import SemesterSearchBar from "@/features/semester-search/SemesterSearchBar";
import CourseProgressCircle from "@/features/course-progress/CourseProgressCircle";

import CourseWindow from "./CourseWindow";
import { useTheme } from "../hooks";
import { Spinner } from "@/shared/components/ui/spinner";

function Header({ className }: { className: string }) {
  const { data: userCourses, isLoading: isUserCoursesLoading } = useQuery(
    useUserCoursesQueryOptions(),
  );

  const { theme, setTheme } = useTheme();

  const [openCourseId, setOpenCourseId] = useState<string | undefined>();

  return (
    <div
      className={clsx(
        "grid [grid-template-columns:1fr_1fr_1fr] h-fit p-1",
        className,
      )}
    >
      <div className="h-full w-full flex items-center justify-center">
        <SemesterSearchBar />
      </div>

      <div className="col-2 flex items-center justify-center min-h-20">
        {isUserCoursesLoading ? (
          <Spinner />
        ) : (
          Object.values(userCourses ?? {}).map((uc) => (
            <button
              key={uc.courseId}
              className=" h-20 w-20 hover:scale-105"
              onClick={() => setOpenCourseId(uc.courseId)}
            >
              <CourseProgressCircle
                key={uc.courseId}
                courseId={uc.courseId}
                name={uc.courseMeta.name}
                className="h-full w-full"
              />
            </button>
          ))
        )}
        {/* Last in DOM order lands at the physical left edge of this row
            under the app's RTL layout — pinning it beside the
            enrolled-course list as one more member of it, independent of
            that list's own loading state. */}
        <CourseSearchBar />
      </div>
      <div className="col-3 h-full w-full flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Button>
        <HeaderAuth className="" />
      </div>
      <CourseWindow
        onOpenChange={() => setOpenCourseId(undefined)}
        open={openCourseId ? true : false}
        courseId={openCourseId!}
      />
    </div>
  );
}

export default Header;
