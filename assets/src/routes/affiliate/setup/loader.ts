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
import {
  merchantPaginationFromUrl,
  type MerchantPagination
} from "../../merchants/pagination";

export type AffiliateSetupMerchantPagination = MerchantPagination;

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
  const merchantPagination = merchantPaginationFromUrl(new URL(request.url));

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
