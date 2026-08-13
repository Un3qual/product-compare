import { parseGraphQLDateTime } from "$relay/scalars";
import { formatProductDateTime } from "$frontend/formatting";
import type {
  CJProgramStage as GeneratedCJProgramStage,
  CJProgramWarningCode,
} from "$generated/ProgramLifecycleRow_program.graphql";

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
] as const satisfies readonly {
  countKey: string;
  label: string;
  urlValue: string;
  value: Exclude<GeneratedCJProgramStage, "%future added value">;
}[];

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

export function cjProgramStageLabel(stage: GeneratedCJProgramStage) {
  return CJ_PROGRAM_STAGES.find(({ value }) => value === stage)?.label ?? null;
}

export function editableCJProgramStage(stage: GeneratedCJProgramStage) {
  return stage === "%future added value" ? null : stage;
}

export function cjProgramWarningCopy(code: CJProgramWarningCode) {
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

export function formatFeedProductCount(productCount: number | null) {
  if (productCount === null) {
    return "Product count unavailable";
  }

  return productCount === 1 ? "1 product" : `${productCount} products`;
}

export function formatCJDateTime(value: string | null) {
  const date = parseGraphQLDateTime(value);

  return date ? formatProductDateTime(date) : "";
}
