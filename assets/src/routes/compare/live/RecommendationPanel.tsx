import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLocation } from "react-router-dom";
import { graphql, useLazyLoadQuery } from "react-relay";
import type { RecommendationPanelQuery } from "$generated/RecommendationPanelQuery.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import type { CompareSpecMode } from "../compare-route-data";
import {
  buildRecommendationQueryInput,
  buildRecommendationProfilePath,
  recommendationProfileFromUrl,
  type RecommendationProfile,
} from "../recommendation-route-data";
import { getRecommendationViewData } from "../recommendation-view-data";

const compareRecommendationQuery = graphql`
  query RecommendationPanelQuery($slugs: [String!]!, $profile: RecommendationProfile!) {
    comparisonRecommendation(slugs: $slugs, profile: $profile) {
      winnerProductId
      missingInputs
      rankings {
        productId
        productName
        claimIds
        reasons
      }
    }
  }
`;

const styles = create({
  controls: { display: "flex", flexWrap: "wrap", gap: "0.75rem" },
  details: { color: "var(--pc-text-secondary)", margin: 0 },
  panel: {
    borderBlockStart: "2px solid var(--pc-border-emphasized)",
    display: "grid",
    gap: "0.8rem",
    paddingBlock: "1rem",
  },
  reasons: { display: "grid", gap: "0.35rem", margin: 0, paddingInlineStart: "1.25rem" },
  title: { fontSize: "1.3rem", margin: 0 },
});

export function RecommendationPanel({
  slugs,
  specMode,
}: {
  slugs: readonly string[];
  specMode: CompareSpecMode;
}) {
  const location = useLocation();
  const profile = recommendationProfileFromUrl(`${location.pathname}${location.search}`);
  const recommendationQueryInput = buildRecommendationQueryInput(slugs, profile);

  if (slugs.length < 2) {
    return null;
  }

  return (
    <ResettableErrorBoundary
      resetToken={recommendationQueryInput.resetToken}
      fallback={<FeedbackState kind="error" title="Decision recommendation unavailable." />}
    >
      <Suspense fallback={<FeedbackState kind="loading" title="Loading recommendation..." />}>
        <RecommendationContent
          key={recommendationQueryInput.resetToken}
          profile={profile}
          queryVariables={recommendationQueryInput.queryVariables}
          slugs={slugs}
          specMode={specMode}
        />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function RecommendationContent({
  profile,
  queryVariables,
  slugs,
  specMode,
}: {
  profile: RecommendationProfile;
  queryVariables: ReturnType<typeof buildRecommendationQueryInput>["queryVariables"];
  slugs: readonly string[];
  specMode: CompareSpecMode;
}) {
  const data = useLazyLoadQuery<RecommendationPanelQuery>(
    compareRecommendationQuery,
    queryVariables,
    { fetchPolicy: "store-or-network" },
  );
  const recommendation = data.comparisonRecommendation;

  if (!recommendation) {
    return null;
  }

  const viewData = getRecommendationViewData(recommendation);

  return (
    <section aria-labelledby="recommendation-title" {...props(styles.panel)}>
      <h2 id="recommendation-title" {...props(styles.title)}>
        Decision recommendation
      </h2>
      <nav aria-label="Recommendation profiles" {...props(styles.controls)}>
        <Link
          aria-current={profile === "lowest_current_cost" ? "page" : undefined}
          to={buildRecommendationProfilePath(slugs, specMode, "lowest_current_cost")}
        >
          Lowest current cost
        </Link>
        <Link
          aria-current={profile === "best_value" ? "page" : undefined}
          to={buildRecommendationProfilePath(slugs, specMode, "best_value")}
        >
          Best supported value
        </Link>
      </nav>
      {viewData.kind === "supported" ? (
        <>
          <strong>{viewData.productName}</strong>
          <ul {...props(styles.reasons)}>
            {viewData.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p {...props(styles.details)}>{viewData.details}</p>
        </>
      ) : (
        <>
          <strong>No supported winner</strong>
          <ul {...props(styles.reasons)}>
            {viewData.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
