import courses from "./courses.json";
import convertTechnionCourse from "./convert-course.ts";

import { db } from "./index";
import { paths } from "./paths";

const parsedCourses = courses.map((course) => convertTechnionCourse(course));

parsedCourses.forEach((c) => {
  const id = c.id;
  const coursePath = paths.catalog.courses("technion", "1") + "/" + `${id}`;
  try {
  } catch (err) {
    console.log(err);
  }
  db.doc(coursePath).set(c);
});
