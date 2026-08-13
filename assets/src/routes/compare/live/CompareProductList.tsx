import type { CompareRouteQuery$data } from "$generated/CompareRouteQuery.graphql";
import type { CompareRouteLoaderData } from "../compare-route-data";
import { DecisionSummary } from "./DecisionSummary";
import { RecommendationPanel } from "./RecommendationPanel";
import { ComparisonModeTabs } from "./ComparisonModeTabs";
import { ProductDecisionSummaries } from "./ProductDecisionSummaries";

export function CompareProductList({
  fragmentProducts,
  loaderData,
}: {
  fragmentProducts: CompareRouteQuery$data["comparisonProducts"];
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
}) {
  return (
    <>
      <RecommendationPanel slugs={loaderData.slugs} specMode={loaderData.specMode} />
      <DecisionSummary offerContexts={loaderData.offerContexts} products={loaderData.products} />
      <ProductDecisionSummaries fragmentProducts={fragmentProducts} loaderData={loaderData} />
      <ComparisonModeTabs
        products={loaderData.products}
        selectedSlugs={loaderData.slugs}
        specMode={loaderData.specMode}
      />
    </>
  );
}
