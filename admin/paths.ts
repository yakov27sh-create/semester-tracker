const paths = {
  catalog: {
    courses: (university: string, semesterId: string) =>
      `universities/${university}/semester/${semesterId}/courses`,
  },
  user: {
    userCourses: (userId: string, semesterId: string) =>
      `users/${userId}/semesters/${semesterId}/courses`,
    profile: (userId: string) => `users/${userId}`,
  },
};

export { paths };
