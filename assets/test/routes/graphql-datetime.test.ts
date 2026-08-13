import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel,
  parseGraphQLDateTime,
} from "../../src/relay/scalars";

test.each([
  ["2026-06-01T00:00:00Z", "2026-06-01"],
  ["2026-06-01T00:30:00+02:00", "2026-06-01"],
  ["2026-06-01T00:00:00.123456Z", "2026-06-01"],
  ["2024-02-29T12:00:00Z", "2024-02-29"],
])("accepts canonical GraphQL DateTime %s", (value, label) => {
  expect(graphQLDateTimeContext(value)).toEqual({ dateTime: value, label });
  expect(graphQLDateTimeLabel(value)).toBe(label);
});

test.each([
  null,
  1_717_326_000_000,
  "not-a-date",
  "June 1 2026",
  "2026-02-30T00:00:00Z",
  "2025-02-29T12:00:00Z",
  "2026-06-01 00:00:00Z",
])("rejects unsupported DateTime value %s", (value) => {
  expect(graphQLDateTimeContext(value)).toBeNull();
  expect(graphQLDateTimeLabel(value)).toBeNull();
});

test.each([
  ["2026-06-01T00:00:00.1Z", "2026-06-01T00:00:00.100Z"],
  ["2026-06-01T00:00:00.123456Z", "2026-06-01T00:00:00.123Z"],
  ["2026-06-01T00:00:00.987654+02:00", "2026-05-31T22:00:00.987Z"],
])("parses GraphQL fractional-second precision for %s", (value, expected) => {
  expect(parseGraphQLDateTime(value)?.toISOString()).toBe(expected);
});
