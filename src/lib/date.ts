const JST_TIME_ZONE = "Asia/Tokyo";

export function getJstDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(dateString: string, days: number): string {
  const date = parseDateString(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return getJstDateString(date);
}

export function diffDays(fromDateString: string, toDateString?: string): number {
  const from = parseDateString(fromDateString);
  const to = parseDateString(toDateString ?? getJstDateString());
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export function getRecentDateStrings(
  days: number,
  endDateString: string = getJstDateString()
): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    dates.push(addDays(endDateString, -i));
  }
  return dates;
}
