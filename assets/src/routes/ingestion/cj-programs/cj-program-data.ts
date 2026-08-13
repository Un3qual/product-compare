import { parseGraphQLDateTime } from "$relay/scalars";
import { formatProductDateTime } from "$frontend/formatting";

export const CJ_PROGRAM_STAGES = [
  { countKey: "new", label: "New", urlValue: "new", value: "NEW" },
  {
    countKey: "considering",
    label: "Considering",
    urlValue: "considering",
    value: "CONSIDERING",
  },
  { countKey: "selected", label: "Selected", urlValue: "selected", value: "SELECTED" },
  { countKey: "applied", label: "Applied", urlValue: "applied", value: "APPLIED" },
  { countKey: "accepted", label: "Accepted", urlValue: "accepted", value: "ACCEPTED" },
  {
    countKey: "notPursuing",
    label: "Not pursuing",
    urlValue: "not_pursuing",
    value: "NOT_PURSUING",
  },
  { countKey: "declined", label: "Declined", urlValue: "declined", value: "DECLINED" },
] as const;

export type CJProgramStage = (typeof CJ_PROGRAM_STAGES)[number]["value"];

export const CJ_PROGRAM_SORTS = [
  { label: "Name", urlValue: "name_asc", value: "NAME_ASC" },
  {
    label: "Last changed",
    urlValue: "last_changed_desc",
    value: "LAST_CHANGED_DESC",
  },
  { label: "Feed count", urlValue: "feed_count_desc", value: "FEED_COUNT_DESC" },
] as const;

export type CJProgramSort = (typeof CJ_PROGRAM_SORTS)[number]["value"];

export function cjProgramStageLabel(stage: string | null | undefined) {
  return CJ_PROGRAM_STAGES.find(({ value }) => value === stage)?.label ?? null;
}

export function isCJProgramStage(stage: string): stage is CJProgramStage {
  return CJ_PROGRAM_STAGES.some(({ value }) => value === stage);
}

export function cjProgramWarningCopy(code: string | null | undefined) {
  switch (code) {
    case "MISSING_ADVERTISER_NAME":
      return "At least one observed feed is missing an advertiser name.";
    case "MISSING_PRODUCT_COUNT":
      return "At least one observed feed has no positive product count.";
    case "NON_US_MARKET":
      return "At least one observed feed is not marked for the US market.";
    case "NON_USD_CURRENCY":
      return "At least one observed feed is not marked with USD currency.";
    case "NON_ENGLISH_LANGUAGE":
      return "At least one observed feed is not marked as English.";
    default:
      return null;
  }
}

export function formatFeedProductCount(productCount: number | null | undefined) {
  if (typeof productCount !== "number") {
    return "Product count unavailable";
  }

  return productCount === 1 ? "1 product" : `${productCount} products`;
}

export function formatCJDateTime(value: string | null | undefined) {
  const date = parseGraphQLDateTime(value);

  return date ? formatProductDateTime(date) : "";
}
