function timeToMinute(time: string) {
  const arr = time.split(":");
  const hourNum = Number(arr[0]);
  const minuteNum = Number(arr[1]);
  return hourNum * 60 + minuteNum;
}

function minuteToTime(minute: number) {
  const timeMinute = String(minute % 60).padStart(2, "0");
  const timeHour = String(Math.floor(minute / 60)).padStart(2, "0");
  return [timeHour, timeMinute].join(":");
}

function makeTimeString(startMinute: number, endMinute: number) {
  return minuteToTime(endMinute) + " - " + minuteToTime(startMinute);
}

function hebrewDayToIndex(day: string) {
  const map = {
    ראשון: 0,
    שני: 1,
    שלישי: 2,
    רביעי: 3,
    חמישי: 4,
    שישי: 5,
    שבת: 6,
  };
  return map[day] ?? -1; // returns -1 if not found
}

export { timeToMinute, minuteToTime, makeTimeString, hebrewDayToIndex };
