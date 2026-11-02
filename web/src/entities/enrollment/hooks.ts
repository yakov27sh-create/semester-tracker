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
  fetchEnrollments,
  addEnrollmentDB,
  setSelectedSectionIdDB,
  toggleTimeslotsDB,
  unenrollDB,
} from "./db";
import {
  createEnrollment,
  createEnrollment_DB,
  toggleSelectedSection,
  toggleTimeslots,
} from "./object";
import type { EnrollmentCache } from "./types";

const enrollmentsQueryKey = (uid?: string, semesterId?: string) => [
  "enrollments",
  uid,
  semesterId,
];

function useEnrollmentsQueryOptions() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const key = enrollmentsQueryKey(profile?.userId, selectedSemesterId);
  return queryOptions({
    queryKey: key,
    queryFn: async () => {
      // Resources are their own entity with their own query — see
      // entities/resource/hooks.ts.
      const enrollmentsData = await fetchEnrollments(
        profile!.userId,
        selectedSemesterId!,
      );

      const courseIds = enrollmentsData.map((c) => c.courseId);
      const courses = await fetchCourses(courseIds, selectedSemesterId!);

      const enrollments: EnrollmentCache = enrollmentsData.reduce(
        (acc, ucd) => {
          const course = courses.find((c) => c.id === ucd.courseId);
          if (!course) return acc;
          acc[course.id] = createEnrollment(ucd, course);
          return acc;
        },
        {} as EnrollmentCache,
      );

      return enrollments;
    },
    enabled: !!profile && !!selectedSemesterId,
    // Mutations on this data keep the cache correct via setQueryData
    // (onMutate/onSuccess) — there's nothing for a background refetch to
    // reconcile, and the default staleTime would otherwise cause a refetch
    // storm on every focus change / component mount touching this query.
    staleTime: Infinity,
  });
}

function useAddEnrollmentMutationOptions() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();
  return mutationOptions({
    onMutate: (course) => {
      if (!profile || !selectedSemesterId) return;
      const key = enrollmentsQueryKey(profile.userId, selectedSemesterId);
      qc.cancelQueries({ queryKey: key });
      const enrollment_DB = createEnrollment_DB(
        profile.userId,
        course.id,
        selectedSemesterId,
      );
      const newEnrollment = createEnrollment(enrollment_DB, course);
      qc.setQueryData(key, (data: EnrollmentCache) => {
        return { ...data, [newEnrollment.courseId]: newEnrollment };
      });
    },

    mutationFn: (course: Course) => {
      if (!profile) throw new Error("User not logger in");
      if (!selectedSemesterId) throw new Error("No semester selected");
      const enrollment_DB = createEnrollment_DB(
        profile.userId,
        course.id,
        selectedSemesterId,
      );

      return addEnrollmentDB(profile.userId, enrollment_DB);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: enrollmentsQueryKey(profile?.userId, selectedSemesterId),
      });
    },
  });
}

function useUnenrollMO() {
  const { profile } = useUserContext();
  const { selectedSemesterId } = useSemesterContext();
  const qc = useQueryClient();
  return mutationOptions({
    onMutate: (courseId) => {
      qc.setQueryData(
        enrollmentsQueryKey(profile?.userId, selectedSemesterId),
        (data: EnrollmentCache) => {
          return Object.fromEntries(
            Object.entries(data).filter((e) => e[0] != courseId),
          );
        },
      );
      if (!profile) return;
    },
    mutationFn: (courseId: string) => {
      if (!selectedSemesterId) throw new Error("No semester selected");
      return unenrollDB(profile!.userId, courseId, selectedSemesterId);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: enrollmentsQueryKey(profile?.userId, selectedSemesterId),
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
      const key = enrollmentsQueryKey(profile.userId, selectedSemesterId);
      qc.cancelQueries({ queryKey: key });
      qc.setQueryData(key, (data: EnrollmentCache) => {
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
          enrollmentsQueryKey(profile?.userId, selectedSemesterId),
        ) as EnrollmentCache
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
        enrollmentsQueryKey(profile.userId, selectedSemesterId),
        (data: EnrollmentCache) => {
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
        enrollmentsQueryKey(profile?.userId, selectedSemesterId),
        (data: EnrollmentCache) => {
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
  enrollmentsQueryKey,
  useEnrollmentsQueryOptions,
  useAddEnrollmentMutationOptions,
  useUnenrollMO,
  useToggleSelectedSectionMO,
  useToggleTimeslotsMO,
};
