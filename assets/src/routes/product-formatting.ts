const PRODUCT_LOCALE = "en-US";
const PRODUCT_TIME_ZONE = "UTC";

const PRODUCT_TEXT_COLLATOR = new Intl.Collator(PRODUCT_LOCALE, {
  sensitivity: "base"
});

const PRODUCT_DATE_TIME_FORMATTER = new Intl.DateTimeFormat(PRODUCT_LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: PRODUCT_TIME_ZONE
});

const PRODUCT_DATE_FORMATTER = new Intl.DateTimeFormat(PRODUCT_LOCALE, {
  dateStyle: "medium",
  timeZone: PRODUCT_TIME_ZONE
});

export function compareProductText(first: string, second: string) {
  return PRODUCT_TEXT_COLLATOR.compare(first, second);
}

export function formatProductDateTime(date: Date) {
  return PRODUCT_DATE_TIME_FORMATTER.format(date);
}

export function formatProductDateLabel(value: string) {
  return formatProductDateString(value, PRODUCT_DATE_FORMATTER);
}

export function formatProductDateTimeLabel(value: string) {
  return formatProductDateString(value, PRODUCT_DATE_TIME_FORMATTER);
}

function formatProductDateString(value: string, formatter: Intl.DateTimeFormat) {
  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? formatter.format(timestamp) : value;
}
