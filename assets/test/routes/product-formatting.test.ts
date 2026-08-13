import {
  formatProductDateLabel,
  formatProductDateTime,
  formatProductDateTimeLabel,
} from "../../src/frontend/formatting";

test("formatProductDateTime keeps the existing Date-input UTC label", () => {
  expect(formatProductDateTime(new Date("2026-07-14T01:00:00Z"))).toBe("Jul 14, 2026, 1:00 AM");
});

test("formatProductDateLabel renders the UTC calendar date", () => {
  expect(formatProductDateLabel("2026-07-14T01:00:00Z")).toBe("Jul 14, 2026");
});

test("formatProductDateLabel normalizes offsets across a UTC day boundary", () => {
  expect(formatProductDateLabel("2026-07-14T23:30:00-02:00")).toBe("Jul 15, 2026");
});

test("formatProductDateTimeLabel renders a normalized UTC date and time", () => {
  expect(formatProductDateTimeLabel("2026-07-14T23:30:00-02:00")).toBe("Jul 15, 2026, 1:30 AM");
});

test("string-input formatters preserve malformed source values exactly", () => {
  const malformedValue = "  not-a-date  ";

  expect(formatProductDateLabel(malformedValue)).toBe(malformedValue);
  expect(formatProductDateTimeLabel(malformedValue)).toBe(malformedValue);
});

test.each(["2026-02-30T00:00:00Z", "2026-07-14T01:00:00"])(
  "string-input formatters reject non-canonical GraphQL DateTime %s",
  (value) => {
    expect(formatProductDateLabel(value)).toBe(value);
    expect(formatProductDateTimeLabel(value)).toBe(value);
  },
);
