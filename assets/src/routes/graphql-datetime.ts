export type GraphQLDateTimeContext = {
  dateTime: string;
  label: string;
};

type GraphQLDateTimeParts = {
  day: number;
  dayText: string;
  hour: number;
  minute: number;
  month: number;
  monthText: string;
  offsetHour: number;
  offsetMinute: number;
  second: number;
  year: number;
  yearText: string;
};

const GRAPHQL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-](\d{2}):(\d{2}))$/;

export function graphQLDateTimeContext(value: unknown): GraphQLDateTimeContext | null {
  if (typeof value !== "string") {
    return null;
  }

  const parts = graphQLDateTimeParts(value);

  if (!parts || !isValidGraphQLDateTime(value, parts)) {
    return null;
  }

  return {
    dateTime: value,
    label: `${parts.yearText}-${parts.monthText}-${parts.dayText}`
  };
}

function graphQLDateTimeParts(value: string): GraphQLDateTimeParts | null {
  const match = GRAPHQL_DATE_TIME_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    offsetHourText,
    offsetMinuteText
  ] = match;

  return {
    day: Number(dayText),
    dayText,
    hour: Number(hourText),
    minute: Number(minuteText),
    month: Number(monthText),
    monthText,
    offsetHour: Number(offsetHourText ?? 0),
    offsetMinute: Number(offsetMinuteText ?? 0),
    second: Number(secondText),
    year: Number(yearText),
    yearText
  };
}

function isValidGraphQLDateTime(value: string, parts: GraphQLDateTimeParts) {
  return (
    isValidCalendarDate(parts) &&
    isValidTime(parts) &&
    isValidOffset(parts) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

function isValidCalendarDate({ day, month, year }: GraphQLDateTimeParts) {
  return isWithinRange(month, 1, 12) && isWithinRange(day, 1, daysInMonth(year, month));
}

function isValidTime({ hour, minute, second }: GraphQLDateTimeParts) {
  return (
    isWithinRange(hour, 0, 23) &&
    isWithinRange(minute, 0, 59) &&
    isWithinRange(second, 0, 59)
  );
}

function isValidOffset({ offsetHour, offsetMinute }: GraphQLDateTimeParts) {
  return isWithinRange(offsetHour, 0, 23) && isWithinRange(offsetMinute, 0, 59);
}

function isWithinRange(value: number, minimum: number, maximum: number) {
  return value >= minimum && value <= maximum;
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
