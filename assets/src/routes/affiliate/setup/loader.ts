import type { LoaderFunctionArgs } from "react-router-dom";
import affiliateSetupRouteQuery, {
  type AffiliateSetupRouteQuery
} from "../../../__generated__/AffiliateSetupRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../../relay/route-preload";
import { recoverRouteLoaderError } from "../../loader-errors";

const AFFILIATE_SETUP_DEFAULT_MERCHANT_PAGE_SIZE = 20;
const AFFILIATE_SETUP_MAX_MERCHANT_PAGE_SIZE = 50;

export interface AffiliateSetupMerchantPagination {
  after: string | null;
  first: number;
}

export type AffiliateSetupLoaderData =
  | {
      status: "ready";
      merchantPagination: AffiliateSetupMerchantPagination;
      merchantQuery: RelayRouteQueryDescriptor<AffiliateSetupRouteQuery["variables"]>;
    }
  | {
      status: "error";
      merchantPagination: AffiliateSetupMerchantPagination;
    };

export async function affiliateSetupLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<AffiliateSetupLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const merchantPagination = affiliateSetupMerchantPaginationFromUrl(new URL(request.url));

  try {
    return {
      status: "ready",
      merchantPagination,
      merchantQuery: await preloadRouteQuery<AffiliateSetupRouteQuery>(
        environment,
        affiliateSetupRouteQuery,
        merchantPagination,
        { signal: request.signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<AffiliateSetupLoaderData>(
      error,
      "Failed to preload affiliate setup merchant choices.",
      {
        status: "error",
        merchantPagination
      }
    );
  }
}

export function affiliateSetupMerchantPaginationFromUrl(
  url: URL
): AffiliateSetupMerchantPagination {
  return {
    first: normalizeAffiliateSetupMerchantPageSize(url.searchParams.get("first")),
    after: normalizeAffiliateSetupMerchantCursor(url.searchParams.get("after"))
  };
}

function normalizeAffiliateSetupMerchantPageSize(value: string | null) {
  const normalized = value?.trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return AFFILIATE_SETUP_DEFAULT_MERCHANT_PAGE_SIZE;
  }

  const pageSize = Number(normalized);

  return pageSize >= 1 && pageSize <= AFFILIATE_SETUP_MAX_MERCHANT_PAGE_SIZE
    ? pageSize
    : AFFILIATE_SETUP_DEFAULT_MERCHANT_PAGE_SIZE;
}

function normalizeAffiliateSetupMerchantCursor(value: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}
