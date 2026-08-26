import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useToggleSelectedSectionMO } from "@/entities/user-course/hooks";

type SectionSelectCardProps = {
  className?: string;
  textStyles?: CSSProperties;
  courseId: string;
  sessionType: string;
  sectionId: string;
  instructorName: string;
  groupNum: number;
  selectButton?: ReactNode;
};

const SectionSelectContext = createContext<SectionSelectCardProps | null>(null);

function useSectionSelectContext() {
  const ctx = useContext(SectionSelectContext);
  if (!ctx) throw Error("error");
  return ctx;
}

function SectionSelectCard(props: SectionSelectCardProps) {
  return (
    <SectionSelectContext.Provider value={props}>
      <div style={props.textStyles} className={clsx("", props.className)}>
        <WeekNumAndButton />
        <div style={props.textStyles} className="text-[0.6rem] text-center">
          {props.instructorName}
        </div>
      </div>
    </SectionSelectContext.Provider>
  );
}

function SelectButton() {
  const toggleSelectionTrigger = useMutation(useToggleSelectedSectionMO());
  const { courseId, sessionType, sectionId } = useSectionSelectContext();
  return (
    <button
      className="min-h-3 min-w-3 
		aspect-square rounded-full
		shadow-md
		bg-section-select
		hover:scale-120 cursor-pointer
		"
      onClick={() =>
        toggleSelectionTrigger.mutate({
          courseId: courseId,
          sessionType: sessionType,
          sectionId: sectionId,
        })
      }
    ></button>
  );
}

function WeekNumAndButton() {
  const { groupNum, selectButton } = useSectionSelectContext();
  return (
    <div
      className="flex items-center justify-center
		gap-2"
    >
      <div className="text-[0.5rem]">{`קב' ${groupNum}`}</div>
      {selectButton}
    </div>
  );
}

SectionSelectCard.SelectButton = SelectButton;

export default SectionSelectCard;
