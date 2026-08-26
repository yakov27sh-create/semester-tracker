import { timeToMinute, minuteToTime } from "@/shared/utils/timeUtils";

function generateTimeStrings(
  startTime: string,
  endTime: string,
  gapInMinutes: number,
) {
  const timeStrings = [];
  let cur = timeToMinute(startTime);
  const endTimeMinute = timeToMinute(endTime);
  while (cur <= endTimeMinute) {
    timeStrings.push(minuteToTime(cur));
    cur += gapInMinutes;
  }
  return timeStrings;
}

function timeToRowNumber(
  time: number,
  startTime: string,
  gapInMinutes: number,
) {
  const startTimeInMinutes = timeToMinute(startTime);
  return (time - startTimeInMinutes) / gapInMinutes;
}

function generateDayStrings(days: number[]) {
  const dayStringMap = [
    "ראשון",
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "שישי",
    "שבת",
  ];
  return days.map((day) => dayStringMap[day]);
}

export { generateTimeStrings, generateDayStrings, timeToRowNumber };
