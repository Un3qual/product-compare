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
      return "Advertiser name is unavailable.";
    case "MISSING_PRODUCT_COUNT":
      return "Product count is unavailable.";
    case "NON_US_MARKET":
      return "No observed feed is in the US market.";
    case "NON_USD_CURRENCY":
      return "No observed feed uses USD.";
    case "NON_ENGLISH_LANGUAGE":
      return "No observed feed is in English.";
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

export function formatCJProgramLastChanged(value: string | null | undefined) {
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
