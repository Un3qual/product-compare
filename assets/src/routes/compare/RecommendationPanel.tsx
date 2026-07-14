import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { CompareRecommendationSummary, CompareSpecMode } from "./loader";

const styles = create({
  controls: { display: "flex", flexWrap: "wrap", gap: "0.75rem" },
  evidence: { color: "var(--pc-text-secondary)", margin: 0 },
  panel: { borderBlockStart: "2px solid var(--pc-border-emphasized)", display: "grid", gap: "0.8rem", paddingBlock: "1rem" },
  reasons: { display: "grid", gap: "0.35rem", margin: 0, paddingInlineStart: "1.25rem" },
  title: { fontSize: "1.3rem", margin: 0 }
});

export function RecommendationPanel({ recommendation, slugs, specMode }: { recommendation?: CompareRecommendationSummary; slugs: readonly string[]; specMode: CompareSpecMode }) {
  if (!recommendation) return null;
  const winner = recommendation.rankings.find((ranking) => ranking.productId === recommendation.winnerProductId);

  return (
    <section aria-labelledby="recommendation-title" {...props(styles.panel)}>
      <h2 id="recommendation-title" {...props(styles.title)}>Decision recommendation</h2>
      <nav aria-label="Recommendation profiles" {...props(styles.controls)}>
        <Link aria-current={recommendation.profile === "lowest_current_cost" ? "page" : undefined} to={profilePath(slugs, specMode, "lowest_current_cost")}>Lowest current cost</Link>
        <Link aria-current={recommendation.profile === "best_value" ? "page" : undefined} to={profilePath(slugs, specMode, "best_value")}>Best supported value</Link>
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

function profilePath(slugs: readonly string[], specMode: CompareSpecMode, profile: "lowest_current_cost" | "best_value") {
  const params = new URLSearchParams();
  slugs.forEach((slug) => {
    params.append("slug", slug);
  });
  if (specMode !== "shared") params.set("specs", specMode);
  if (profile === "best_value") params.set("recommend", profile);
  return `/compare?${params.toString()}`;
}
