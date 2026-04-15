
// type UnknownRecord = Record<string, any>;

// type TimeRange = {
//   startMinutes: number;
//   endMinutes: number;
// };

// type OpenRange = {
//   start: string;
//   end: string;
// };

// type UseOpenTimeRangesParams = {
//   availabilityData?: unknown;
//   timeOffsData?: unknown;
//   date?: Date;
// };

// type DayRelation = "same_day" | "previous_day" | null;

function toArray(data){
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.results)) return record.results;
  }
  return [];
}

function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function parseTimeToMinutes(value) {
  if (typeof value !== "string") return null;
  const input = value.trim();
  const match = input.match(
    /^(?:(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?|(?:\d{4}-\d{2}-\d{2}[T\s])(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)$/,
  );
  if (!match) return null;

  const hours = Number(match[1] ?? match[3]);
  const minutes = Number(match[2] ?? match[4]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function parseDateToMinutes(date){
    
const hours = date.getHours();
const minutes = date.getMinutes();
return hours * 60 + minutes;
}

function getMinutesFromRecord(record, keys) {
  for (const key of keys) {
    const raw = record[key];
    const fromString = parseTimeToMinutes(raw);
    if (fromString !== null) return fromString;

    const fromNumber = asNumber(raw);
    if (fromNumber !== null && fromNumber >= 0 && fromNumber <= 24 * 60) {
      return fromNumber;
    }
  }

  return null;
}

function getDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateLike(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateTimeFromRecord(record, keys) {
  for (const key of keys) {
    const parsed = parseDateLike(record[key]);
    if (parsed) return parsed;
  }
  return null;
}

function getDateRelation(record, selectedDate) {
  const selectedDay = getDateOnly(selectedDate);
  const previousDay = addDays(selectedDay, -1);
  const explicitDate =
    getDateTimeFromRecord(record, ["date", "start_date", "work_date", "available_date", "day"]) ??
    getDateTimeFromRecord(record, ["start_datetime", "startDateTime", "start_at", "from_datetime"]);

  if (explicitDate) {
    const dateOnly = getDateOnly(explicitDate);
    if (dateOnly.getTime() === selectedDay.getTime()) return "same_day";
    if (dateOnly.getTime() === previousDay.getTime()) return "previous_day";
    return null;
  }

  const selectedDow = selectedDay.getDay();
  const previousDow = previousDay.getDay();
  const weekdayValue =
    asNumber(record.day_of_week) ??
    asNumber(record.weekday) ??
    asNumber(record.dayOfWeek) ??
    asNumber(record.dow);

  if (weekdayValue === null) return null;
  if (weekdayValue === selectedDow) return "same_day";
  if (weekdayValue === previousDow) return "previous_day";

  return null;
}

function toRange(record) {
  const startMinutes = getMinutesFromRecord(record, [
    "start_datetime",
    "start_time",
    "start",
    "from",
    "from_time",
    "startTime",
  ]);
  const endMinutes = getMinutesFromRecord(record, [
    "end_datetime",
    "end_time",
    "end",
    "to",
    "to_time",
    "endTime",
  ]);

  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes === startMinutes) return null;

  return { startMinutes, endMinutes };
}

function getDateTimeRangesForSelectedDay(record, selectedDate) {
  const startAt = getDateTimeFromRecord(record, [
    "start_datetime",
    "startDateTime",
    "start_at",
    "from_datetime",
  ]);
  const endAt = getDateTimeFromRecord(record, [
    "end_datetime",
    "endDateTime",
    "end_at",
    "to_datetime",
  ]);

  if (!startAt || !endAt) return null;
  if (endAt.getTime() <= startAt.getTime()) return [];

  const dayStart = getDateOnly(selectedDate);
  const dayEnd = addDays(dayStart, 1);
  const overlapStart = Math.max(startAt.getTime(), dayStart.getTime());
  const overlapEnd = Math.min(endAt.getTime(), dayEnd.getTime());

  if (overlapEnd <= overlapStart) return [];

  const startDate = new Date(overlapStart);
  const endDate = new Date(overlapEnd);
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  let endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

  // Keep end-of-day intervals as 24:00 for clean rendering and subtraction math.
  if (overlapEnd === dayEnd.getTime()) {
    endMinutes = 24 * 60;
  }

  if (endMinutes <= startMinutes) return [];

  return [{ startMinutes, endMinutes }];
}

function toRangesForSelectedDay(record, selectedDate) {
  const fromDateTimes = getDateTimeRangesForSelectedDay(record, selectedDate);
  if (fromDateTimes) return fromDateTimes;

  const relation = getDateRelation(record, selectedDate);
  if (!relation) return [];

  const baseRange = toRange(record);
  if (!baseRange) return [];

  if (baseRange.endMinutes > baseRange.startMinutes) {
    return relation === "same_day" ? [baseRange] : [];
  }

  // Overnight range, e.g. 22:00 -> 02:00.
  if (relation === "same_day") {
    return [{ startMinutes: baseRange.startMinutes, endMinutes: 24 * 60 }];
  }

  return [{ startMinutes: 0, endMinutes: baseRange.endMinutes }];
}

function subtractRanges(open, blocked) {
  if (!blocked.length) return open;

  return open.flatMap((slot) => {
    let segments = [slot];

    for (const off of blocked) {
      const next = [];

      for (const seg of segments) {
        const overlapStart = Math.max(seg.startMinutes, off.startMinutes);
        const overlapEnd = Math.min(seg.endMinutes, off.endMinutes);

        if (overlapStart >= overlapEnd) {
          next.push(seg);
          continue;
        }

        if (seg.startMinutes < overlapStart) {
          next.push({ startMinutes: seg.startMinutes, endMinutes: overlapStart });
        }

        if (overlapEnd < seg.endMinutes) {
          next.push({ startMinutes: overlapEnd, endMinutes: seg.endMinutes });
        }
      }

      segments = next;
      if (!segments.length) break;
    }

    return segments;
  });
}

function minutesToTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function useOpenTimeRanges(
  availabilityData,
  timeOffsData,
  date,
) {
  return useMemo(() => {
    return getOpenTimeRanges({
      availabilityData,
      timeOffsData,
      date,
    });
  }, [availabilityData, date, timeOffsData]);
}

export function getOpenTimeRanges(
  availabilityData,
  timeOffsData,
  date,
){
  if (!date) return [];

  const availabilityRanges = toArray(availabilityData).flatMap((item) =>
    toRangesForSelectedDay(item, date),
  );

  const blockedRanges = toArray(timeOffsData).flatMap((item) =>
    toRangesForSelectedDay(item, date),
  );

  return subtractRanges(availabilityRanges, blockedRanges)
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .map((range) => ({
      start: minutesToTimeString(range.startMinutes),
      end: minutesToTimeString(range.endMinutes),
    }));
}
