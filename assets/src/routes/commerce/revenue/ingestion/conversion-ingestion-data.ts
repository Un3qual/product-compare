import { DEFAULT_MUTATION_ERROR_MESSAGE, hasGraphQLErrors } from "$relay/mutation-errors";
import type { MutationGraphQLErrors } from "$relay/mutation-errors";
import type { RunCJCommissionIngestionNowMutation } from "$generated/RunCJCommissionIngestionNowMutation.graphql";
import type { UpdateCJCommissionIngestionSettingsMutation } from "$generated/UpdateCJCommissionIngestionSettingsMutation.graphql";
import type { UpdateCJCommissionIngestionSettingsMutation$variables } from "$generated/UpdateCJCommissionIngestionSettingsMutation.graphql";

export const SYNC_RUN_PAGE_SIZE = 25;

const SETTINGS_BOUNDS = {
  intervalMinutes: { label: "Interval", maximum: 10_080, minimum: 15, unit: "minutes" },
  lookbackDays: { label: "Lookback", maximum: 90, minimum: 1, unit: "days" },
  maxPages: { label: "Maximum pages", maximum: 100, minimum: 1, unit: "pages" },
} as const;

export class SettingsValidationError extends Error {
  constructor(
    readonly field: keyof typeof SETTINGS_BOUNDS,
    message: string,
  ) {
    super(message);
    this.name = "SettingsValidationError";
  }
}

export function buildSettingsVariables(
  form: FormData,
): UpdateCJCommissionIngestionSettingsMutation$variables {
  return {
    input: {
      enabled: form.get("enabled") === "on",
      intervalMinutes: readBoundedWholeNumber(form, "intervalMinutes"),
      lookbackDays: readBoundedWholeNumber(form, "lookbackDays"),
      maxPages: readBoundedWholeNumber(form, "maxPages"),
    },
  };
}

export function resolveIngestionMutationOutcome(
  payload:
    | UpdateCJCommissionIngestionSettingsMutation["response"]["updateCjCommissionIngestionSettings"]
    | RunCJCommissionIngestionNowMutation["response"]["runCjCommissionIngestionNow"]
    | null
    | undefined,
  graphQLErrors: MutationGraphQLErrors,
) {
  if (hasGraphQLErrors(graphQLErrors)) {
    return { kind: "error" as const, message: DEFAULT_MUTATION_ERROR_MESSAGE };
  }

  const error = payload?.errors[0];
  if (error) {
    return {
      kind: "error" as const,
      ...(error.field ? { field: error.field } : {}),
      message: error.message,
    };
  }

  if (!payload?.ingestion) {
    return { kind: "error" as const, message: DEFAULT_MUTATION_ERROR_MESSAGE };
  }

  return { ingestion: payload.ingestion, kind: "success" as const };
}

export function formatIngestionFreshness(value: string | null | undefined, now = new Date()) {
  if (!value) return "No successful run recorded";

  const elapsedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - new Date(value).getTime()) / 60_000),
  );
  if (elapsedMinutes === 0) return "Fresh just now";
  if (elapsedMinutes < 60) return `Fresh ${elapsedMinutes} minute${plural(elapsedMinutes)} ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Fresh ${elapsedHours} hour${plural(elapsedHours)} ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Fresh ${elapsedDays} day${plural(elapsedDays)} ago`;
}

export function formatSyncRunDuration(
  startedAt: string,
  finishedAt: string | null,
  now = new Date(),
) {
  const end = finishedAt ? new Date(finishedAt) : now;
  const elapsedMinutes = Math.max(
    0,
    Math.round((end.getTime() - new Date(startedAt).getTime()) / 60_000),
  );

  if (elapsedMinutes < 1) return finishedAt ? "Less than a minute" : "Running now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} minute${plural(elapsedMinutes)}`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const remainingMinutes = elapsedMinutes % 60;
  return remainingMinutes === 0
    ? `${elapsedHours} hour${plural(elapsedHours)}`
    : `${elapsedHours} hour${plural(elapsedHours)} ${remainingMinutes} minute${plural(remainingMinutes)}`;
}

function readBoundedWholeNumber(form: FormData, field: keyof typeof SETTINGS_BOUNDS) {
  const value = form.get(field);
  const text = typeof value === "string" ? value.trim() : "";
  const bounds = SETTINGS_BOUNDS[field];

  if (!/^\d+$/.test(text)) {
    throw new SettingsValidationError(
      field,
      `${bounds.label} must be a whole number from ${bounds.minimum} to ${bounds.maximum} ${bounds.unit}.`,
    );
  }

  const number = Number(text);
  if (number < bounds.minimum || number > bounds.maximum) {
    throw new SettingsValidationError(
      field,
      `${bounds.label} must be between ${bounds.minimum} and ${bounds.maximum} ${bounds.unit}.`,
    );
  }

  return number;
}

function plural(value: number) {
  return value === 1 ? "" : "s";
}
