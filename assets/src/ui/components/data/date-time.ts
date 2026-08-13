const exactDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  timeZoneName: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const relativeDateTimeFormatter = new Intl.RelativeTimeFormat("en-US", {
  numeric: "always",
  style: "long",
});

export function exactDateTime(value: string) {
  const date = validDate(value);
  return date ? exactDateTimeFormatter.format(date).replace(" at ", ", ") : null;
}

export function shortDate(value: string) {
  const date = validDate(value);
  return date ? shortDateFormatter.format(date) : null;
}

export function relativeDateTime(value: string, referenceTime: string) {
  const date = validDate(value);
  const reference = validDate(referenceTime);
  if (!date || !reference) return null;

  const seconds = (date.getTime() - reference.getTime()) / 1_000;
  const absoluteSeconds = Math.abs(seconds);

  if (absoluteSeconds < 60) return relativeDateTimeFormatter.format(Math.round(seconds), "second");
  if (absoluteSeconds < 3_600) {
    return relativeDateTimeFormatter.format(Math.round(seconds / 60), "minute");
  }
  if (absoluteSeconds < 86_400) {
    return relativeDateTimeFormatter.format(Math.round(seconds / 3_600), "hour");
  }

  return relativeDateTimeFormatter.format(Math.round(seconds / 86_400), "day");
}

function validDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
