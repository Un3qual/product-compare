import { parseGraphQLDateTime } from "../../graphql-datetime";
import { formatProductDateTime } from "../../product-formatting";
import type { CJProgramStage } from "./pagination";

export function cjProgramStageLabel(stage: string | null | undefined) {
  switch (stage) {
    case "CONSIDERING":
      return "Considering";
    case "SELECTED":
      return "Selected";
    case "APPLIED":
      return "Applied";
    case "ACCEPTED":
      return "Accepted";
    case "NOT_PURSUING":
      return "Not pursuing";
    case "DECLINED":
      return "Declined";
    case "NEW":
      return "New";
    default:
      return null;
  }
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

export function formatCJProgramName({
  advertiserId,
  advertiserName
}: {
  readonly advertiserId: string;
  readonly advertiserName: string | null | undefined;
}) {
  return advertiserName ?? advertiserId;
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

export function buildUpdateCJProgramInput(
  id: string,
  stage: CJProgramStage,
  currentNote: string | null | undefined
) {
  const note = currentNote?.trim();

  return {
    id,
    stage,
    note: note || null
  };
}
