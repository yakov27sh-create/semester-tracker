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

export { timeToMinute, minuteToTime, makeTimeString };
