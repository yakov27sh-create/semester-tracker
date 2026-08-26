type Semester_DB = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  examPeriodAStart: string;
  examPeriodBStart: string;
};

type Semester = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  examPeriodAStart: Date;
  examPeriodBStart: Date;
};

export type { Semester, Semester_DB };
