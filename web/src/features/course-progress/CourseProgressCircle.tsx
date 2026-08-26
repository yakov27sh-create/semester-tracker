import { useQuery } from "@tanstack/react-query";
import { ChartContainer, type ChartConfig } from "@/shared/components/ui/chart";
import {
  RadialBarChart,
  RadialBar,
  Customized,
  Label,
  PolarRadiusAxis,
} from "recharts";

import { useCourseColor } from "../course-customization/hooks";

import { useCourseProgressQO } from "./hooks";
import clsx from "clsx";

type CourseProgressRingProps = {
  className?: string;
  courseId: string;
  name: string;
};

function CourseProgressCircle(props: CourseProgressRingProps) {
  const { data: progressInfo } = useQuery(useCourseProgressQO(props.courseId));

  const color = useCourseColor(props.courseId);
  const displayName = makeDisplayName(props.name);

  const chartData = [progressInfo];

  const chartConfig: ChartConfig = {
    complete: { label: "Completed", color: "var(--completion)" },
    behind: { label: "Behind", color: "var(--behind)" },
    ahead: { label: "Ahead", color: "var(--ahead)" },
    left: { label: "Left", color: "transparent" },
  };

  return (
    <ChartContainer className={props.className} config={chartConfig}>
      <RadialBarChart
        data={chartData}
        startAngle={90}
        endAngle={-270}
        innerRadius={30}
        outerRadius={40}
      >
        <Customized
          component={(props) => {
            const { cx, cy, innerRadius } = props as {
              cx: number;
              cy: number;
              innerRadius: number;
            };

            if (
              cx === undefined ||
              cy === undefined ||
              innerRadius === undefined
            ) {
              return null;
            }

            return (
              <g>
                <circle cx={cx} cy={cy} r={innerRadius - 5} fill={color} />
              </g>
            );
          }}
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className={clsx(
                        "fill-course-text text-sm font-bold",
                        progressInfo?.left === 0 &&
                          "line-through decoration-course-text opacity-50",
                      )}
                    >
                      {displayName}
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </PolarRadiusAxis>
        <RadialBar
          dataKey="onTrack"
          stackId="a"
          cornerRadius={1}
          fill="var(--completion)"
          animationDuration={600}
          className="stroke-transparent stroke-2"
        />

        <RadialBar
          dataKey="behind"
          stackId="a"
          cornerRadius={1}
          fill="var(--behind)"
          animationDuration={600}
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="ahead"
          stackId="a"
          cornerRadius={1}
          fill="var(--ahead)"
          animationDuration={600}
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="left"
          stackId="a"
          fill="transparent"
          cornerRadius={1}
          animationDuration={600}
          className="stroke-transparent"
        />
      </RadialBarChart>
    </ChartContainer>
  );
}

function makeDisplayName(name: string) {
  const wordArr = name.split(" ");
  if (wordArr.length === 1) {
    const word = wordArr[0];
    return word[0] + word[1] + word[2] + "'";
  } else {
    return wordArr.map((w) => w[0]).join(".");
  }
}

export default CourseProgressCircle;
