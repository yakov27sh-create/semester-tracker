import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { useSemestersQueryOptions } from "./hooks";
import type { Semester } from "./types";

type SemesterContextType = {
  semesters: Semester[];
  selectedSemesterId: string | undefined;
  setSelectedSemesterId: (id: string) => void;
  selectedSemester: Semester | undefined;
};

const SemesterContext = createContext<SemesterContextType | null>(null);

const useSemesterContext = () => {
  const ctx = useContext(SemesterContext);
  if (!ctx) throw new Error("Error: Semester context used outside provider");
  return ctx;
};

function SemesterProvider({ children }: { children: ReactNode }) {
  const { data: semesters } = useQuery(useSemestersQueryOptions());
  const [selectedSemesterId, setSelectedSemesterId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    // Default to the most recent semester (fetchSemesters orders by
    // start_date desc) the first time the list loads; don't override an
    // explicit user selection afterward.
    if (selectedSemesterId === undefined && semesters && semesters.length > 0) {
      setSelectedSemesterId(semesters[0].id);
    }
  }, [semesters, selectedSemesterId]);

  const selectedSemester = semesters?.find((s) => s.id === selectedSemesterId);

  return (
    <SemesterContext.Provider
      value={{
        semesters: semesters ?? [],
        selectedSemesterId,
        setSelectedSemesterId,
        selectedSemester,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export { SemesterProvider, useSemesterContext };
