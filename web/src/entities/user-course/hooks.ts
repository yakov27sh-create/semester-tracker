import {
  useQueryClient,
  queryOptions,
  mutationOptions,
} from "@tanstack/react-query";

import { useUserContext } from "../user/UserContext";
import { useSemesterContext } from "../semester/SemesterContext";
import { fetchCourses } from "../course/db";
import type { Course, SlotIndex } from "../course/types";

import {
  fetchUserCourses,
  addUserCourseDB,
  setSelectedSectionIdDB,
  toggleTimeslotsDB,
  deleteUserCourseDB,
} from "./db";
import {
  createUserCourse,
  createUserCourse_DB,
  toggleSelectedSection,
  toggleTimeslots,
} from "./object";
import type { UserCourseCache } from "./types";

const userCoursesQueryKey = (uid?: string, semesterId?: string) => [
  "userCourses",
  uid,
  semesterId,
];

function useUserCoursesQueryOptions() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const key = userCoursesQueryKey(profile?.userId, selectedSemesterId);
  return queryOptions({
    queryKey: key,
    queryFn: async () => {
      const userCoursesData = await fetchUserCourses(
        profile!.userId,
        selectedSemesterId!,
      );

      const courseIds = userCoursesData.map((c) => c.courseId);
      const courses = await fetchCourses(courseIds, selectedSemesterId!);

      const userCourses: UserCourseCache = userCoursesData.reduce(
        (acc, ucd) => {
          const course = courses.find((c) => c.id === ucd.courseId);
          if (!course) return acc;
          acc[course.id] = createUserCourse(ucd, course);
          return acc;
        },
        {} as UserCourseCache,
      );

      return userCourses;
    },
    enabled: !!profile && !!selectedSemesterId,
  });
}

function useAddUserCourseMutationOptions() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();
  return mutationOptions({
    onMutate: (course) => {
      if (!profile || !selectedSemesterId) return;
      const key = userCoursesQueryKey(profile.userId, selectedSemesterId);
      qc.cancelQueries({ queryKey: key });
      const userCourse_DB = createUserCourse_DB(
        profile.userId,
        course.id,
        selectedSemesterId,
      );
      const newUserCourse = createUserCourse(userCourse_DB, course);
      qc.setQueryData(key, (data: UserCourseCache) => {
        return { ...data, [newUserCourse.courseId]: newUserCourse };
      });
    },

    mutationFn: (course: Course) => {
      if (!profile) throw new Error("User not logger in");
      if (!selectedSemesterId) throw new Error("No semester selected");
      const userCourse_DB = createUserCourse_DB(
        profile.userId,
        course.id,
        selectedSemesterId,
      );

      return addUserCourseDB(profile.userId, userCourse_DB);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: userCoursesQueryKey(profile?.userId, selectedSemesterId),
      });
    },
  });
}

function useDeleteUserCourseMO() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();
  return mutationOptions({
    onMutate: (courseId) => {
      qc.setQueryData(
        userCoursesQueryKey(profile?.userId, selectedSemesterId),
        (data: UserCourseCache) => {
          return Object.fromEntries(
            Object.entries(data).filter((e) => e[0] != courseId),
          );
        },
      );
      if (!profile) return;
    },
    mutationFn: (courseId: string) => {
      if (!selectedSemesterId) throw new Error("No semester selected");
      return deleteUserCourseDB(profile!.userId, courseId, selectedSemesterId);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: userCoursesQueryKey(profile?.userId, selectedSemesterId),
      });
    },
  });
}

function useToggleSelectedSectionMO() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();
  return mutationOptions({
    onMutate: ({ courseId, sessionType, sectionId }) => {
      if (!profile) return;
      const key = userCoursesQueryKey(profile.userId, selectedSemesterId);
      qc.cancelQueries({ queryKey: key });
      qc.setQueryData(key, (data: UserCourseCache) => {
        const course = data[courseId];
        const toggledCourse = toggleSelectedSection(
          course,
          sessionType,
          sectionId,
        );

        const updatedCache = { ...data, [courseId]: toggledCourse };
        return updatedCache;
      });
    },
    mutationFn: ({
      courseId,
    }: {
      courseId: string;
      sessionType: string;
      sectionId: string;
    }) => {
      if (!selectedSemesterId) throw new Error("No semester selected");
      // Cache already holds the post-toggle value (onMutate ran first) —
      // write that whole object back.
      const course = (
        qc.getQueryData(
          userCoursesQueryKey(profile?.userId, selectedSemesterId),
        ) as UserCourseCache
      )[courseId];

      return setSelectedSectionIdDB(
        profile!.userId,
        courseId,
        selectedSemesterId,
        course.courseSelectedSections,
      );
    },
  });
}

function useToggleTimeslotsMO() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();
  return mutationOptions({
    onMutate: ({
      courseId,
      sessionType,
      weekNumber,
      timeslots,
    }: {
      courseId: string;
      sessionType: string;
      weekNumber: number;
      timeslots: Set<SlotIndex>;
    }) => {
      if (!profile) return;
      qc.setQueryData(
        userCoursesQueryKey(profile.userId, selectedSemesterId),
        (data: UserCourseCache) => {
          const course = data[courseId];
          const toggled = toggleTimeslots(
            course,
            sessionType,
            weekNumber,
            timeslots,
          );
          const updated = { ...data, [courseId]: toggled };
          return updated;
        },
      );
    },
    mutationFn: async ({
      courseId,
      sessionType,
      weekNumber,
      timeslots,
    }: {
      courseId: string;
      sessionType: string;
      weekNumber: number;
      timeslots: Set<SlotIndex>;
    }) => {
      if (!selectedSemesterId) throw new Error("No semester selected");
      const newSlots = await toggleTimeslotsDB(
        profile!.userId,
        courseId,
        selectedSemesterId,
        sessionType,
        weekNumber,
        [...timeslots],
      );
      return { courseId, sessionType, weekNumber, newSlots };
    },
    // The optimistic update in onMutate predicts the toggle from
    // client-cached state; reconcile with whatever Postgres actually ended
    // up with (the RPC's real, race-safe result) once it comes back.
    onSuccess: ({ courseId, sessionType, weekNumber, newSlots }) => {
      qc.setQueryData(
        userCoursesQueryKey(profile?.userId, selectedSemesterId),
        (data: UserCourseCache) => {
          const course = data[courseId];
          if (!course) return data;
          const updated = structuredClone(course);
          updated.courseProgress[sessionType] ??= {};
          updated.courseProgress[sessionType][weekNumber] = new Set(
            newSlots as SlotIndex[],
          );
          return { ...data, [courseId]: updated };
        },
      );
    },
  });
}

export {
  userCoursesQueryKey,
  useUserCoursesQueryOptions,
  useAddUserCourseMutationOptions,
  useDeleteUserCourseMO,
  useToggleSelectedSectionMO,
  useToggleTimeslotsMO,
};
