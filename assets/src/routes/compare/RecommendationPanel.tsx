import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLocation } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay";
import type { CompareRecommendationQuery } from "../../__generated__/CompareRecommendationQuery.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import type { CompareSpecMode } from "./loader";
import {
  buildRecommendationProfilePath,
  recommendationProfileFromUrl,
  type RecommendationProfile
} from "./recommendation-route-data";
import compareRecommendationQuery from "./queries/CompareRecommendationQuery";

const styles = create({
  controls: { display: "flex", flexWrap: "wrap", gap: "0.75rem" },
  evidence: { color: "var(--pc-text-secondary)", margin: 0 },
  panel: { borderBlockStart: "2px solid var(--pc-border-emphasized)", display: "grid", gap: "0.8rem", paddingBlock: "1rem" },
  reasons: { display: "grid", gap: "0.35rem", margin: 0, paddingInlineStart: "1.25rem" },
  title: { fontSize: "1.3rem", margin: 0 }
});

export function RecommendationPanel({
  slugs,
  specMode
}: {
  slugs: readonly string[];
  specMode: CompareSpecMode;
}) {
  const location = useLocation();
  const profile = recommendationProfileFromUrl(`${location.pathname}${location.search}`);
  const resetToken = `${slugs.join("|")}:${profile}`;

  if (slugs.length < 2) {
    return null;
  }

  return (
    <ResettableErrorBoundary
      resetToken={resetToken}
      fallback={<FeedbackState kind="error" title="Decision recommendation unavailable." />}
    >
      <Suspense fallback={<FeedbackState kind="loading" title="Loading recommendation..." />}>
        <RecommendationContent
          key={resetToken}
          profile={profile}
          slugs={slugs}
          specMode={specMode}
        />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function RecommendationContent({
  profile,
  slugs,
  specMode
}: {
  profile: RecommendationProfile;
  slugs: readonly string[];
  specMode: CompareSpecMode;
}) {
  const data = useLazyLoadQuery<CompareRecommendationQuery>(
    compareRecommendationQuery,
    {
      slugs: [...slugs],
      profile: profile === "best_value" ? "BEST_VALUE" : "LOWEST_CURRENT_COST"
    },
    { fetchPolicy: "store-or-network" }
  );
  const recommendation = data.comparisonRecommendation;

  if (!recommendation) {
    return null;
  }

  const winner = recommendation.rankings.find(
    (ranking) => ranking.productId === recommendation.winnerProductId
  );

  return (
    <section aria-labelledby="recommendation-title" {...props(styles.panel)}>
      <h2 id="recommendation-title" {...props(styles.title)}>Decision recommendation</h2>
      <nav aria-label="Recommendation profiles" {...props(styles.controls)}>
        <Link aria-current={profile === "lowest_current_cost" ? "page" : undefined} to={buildRecommendationProfilePath(slugs, specMode, "lowest_current_cost")}>Lowest current cost</Link>
        <Link aria-current={profile === "best_value" ? "page" : undefined} to={buildRecommendationProfilePath(slugs, specMode, "best_value")}>Best supported value</Link>
      </nav>
      {winner ? (
        <>
          <strong>{winner.productName}</strong>
          <ul {...props(styles.reasons)}>{winner.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <p {...props(styles.evidence)}>Evidence: price observation {winner.pricePointId}; {winner.claimIds.length} accepted claim reference{winner.claimIds.length === 1 ? "" : "s"}. Algorithm {recommendation.algorithmVersion}.</p>
        </>
      ) : (
        <>
          <strong>No supported winner</strong>
          <ul {...props(styles.reasons)}>{recommendation.missingInputs.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </>
      )}
    </section>
  );
}
