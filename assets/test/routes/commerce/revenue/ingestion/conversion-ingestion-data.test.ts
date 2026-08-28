import { expect, test } from "vitest";
import {
  SettingsValidationError,
  buildSettingsVariables,
  buildSyncRunPaginationPath,
  formatIngestionFreshness,
  formatSyncRunDuration,
  resolveIngestionMutationOutcome,
} from "../../../../../src/routes/commerce/revenue/ingestion/conversion-ingestion-data";

test("buildSettingsVariables preserves valid operator schedule values exactly", () => {
  const form = new FormData();
  form.set("enabled", "on");
  form.set("intervalMinutes", "1440");
  form.set("lookbackDays", "90");
  form.set("maxPages", "100");

  expect(buildSettingsVariables(form)).toEqual({
    input: { enabled: true, intervalMinutes: 1440, lookbackDays: 90, maxPages: 100 },
  });
});

test("buildSettingsVariables treats an unchecked schedule as disabled and rejects invalid bounds", () => {
  const unchecked = new FormData();
  unchecked.set("intervalMinutes", "15");
  unchecked.set("lookbackDays", "1");
  unchecked.set("maxPages", "1");

  expect(buildSettingsVariables(unchecked)).toEqual({
    input: { enabled: false, intervalMinutes: 15, lookbackDays: 1, maxPages: 1 },
  });

  const invalid = new FormData();
  invalid.set("intervalMinutes", "14.5");
  invalid.set("lookbackDays", "91");
  invalid.set("maxPages", "0");

  expect(() => buildSettingsVariables(invalid)).toThrow(SettingsValidationError);
  expect(() => buildSettingsVariables(invalid)).toThrow("Interval must be a whole number");
});

test("resolveIngestionMutationOutcome keeps payload validation separate from transport errors", () => {
  const payloadError = resolveIngestionMutationOutcome(
    {
      errors: [{ field: "lookbackDays", message: "Lookback must be 90 days or fewer" }],
      ingestion: null,
    },
    null,
  );
  const transportError = resolveIngestionMutationOutcome({ errors: [], ingestion: null }, [
    { message: "operator session expired" },
  ] as never);

  expect(payloadError).toEqual({
    kind: "error",
    field: "lookbackDays",
    message: "Lookback must be 90 days or fewer",
  });
  expect(transportError).toEqual({ kind: "error", message: "Request failed. Please try again." });
});

test("run helpers provide bounded freshness, terminal duration, and cursor-safe navigation", () => {
  expect(formatIngestionFreshness("2026-08-27T11:45:00Z", new Date("2026-08-27T12:00:00Z"))).toBe(
    "Fresh 15 minutes ago",
  );
  expect(
    formatSyncRunDuration(
      "2026-08-27T11:50:00Z",
      "2026-08-27T12:00:00Z",
      new Date("2026-08-27T12:00:00Z"),
    ),
  ).toBe("10 minutes");
  expect(buildSyncRunPaginationPath("cursor+/=")).toBe(
    "/commerce/revenue/ingestion?after=cursor%2B%2F%3D",
  );
});
