import { type FormEvent, useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { useMutation } from "react-relay";
import type { PublishComparisonSnapshotMutation } from "../../__generated__/PublishComparisonSnapshotMutation.graphql";
import type { RevokeComparisonSnapshotMutation } from "../../__generated__/RevokeComparisonSnapshotMutation.graphql";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, routeMutationErrorMessage } from "../route-errors";
import type { CompareRecommendationSummary, CompareProductSummary } from "./loader";
import publishComparisonSnapshotMutation from "./queries/PublishComparisonSnapshotMutation";
import revokeComparisonSnapshotMutation from "./queries/RevokeComparisonSnapshotMutation";

const styles = create({
  control: { borderBlockStart: "1px solid var(--pc-border-quiet)", paddingBlockStart: "0.85rem" },
  field: { display: "grid", gap: "0.35rem" },
  form: { display: "grid", gap: "0.75rem", paddingBlockStart: "0.8rem" },
  input: { backgroundColor: "var(--pc-surface)", border: "1px solid var(--pc-border-emphasized)", borderRadius: "0.4rem", color: "var(--pc-text)", minHeight: "2.6rem", paddingInline: "0.7rem" },
  message: { color: "var(--pc-text-secondary)", margin: 0 },
  summary: { cursor: "pointer", fontWeight: 650 }
});

export function ShareComparisonControl({ products, recommendation }: { products: readonly CompareProductSummary[]; recommendation?: CompareRecommendationSummary }) {
  const titleId = useId();
  const [published, setPublished] = useState<{ id: string; path: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [commitPublish, publishing] = useMutation<PublishComparisonSnapshotMutation>(publishComparisonSnapshotMutation);
  const [commitRevoke, revoking] = useMutation<RevokeComparisonSnapshotMutation>(revokeComparisonSnapshotMutation);

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitPublish, {
        variables: {
          input: {
            productIds: products.map((product) => product.id),
            recommendationProfile: recommendation?.profile === "best_value" ? "BEST_VALUE" : "LOWEST_CURRENT_COST",
            ...(title ? { title } : {})
          }
        }
      });
      const payload = response.publishComparisonSnapshot;
      if (payload?.snapshot?.id && payload.sharePath) {
        setPublished({ id: payload.snapshot.id, path: payload.sharePath });
        setMessage("Public snapshot published. This link will keep the captured facts unchanged.");
      } else {
        setMessage(routeMutationErrorMessage(payload?.errors, graphQLErrors));
      }
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  async function handleRevoke() {
    if (!published) return;
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitRevoke, { variables: { snapshotId: published.id } });
      const payload = response.revokeComparisonSnapshot;
      if (payload?.revokedSnapshotId) {
        setPublished(null);
        setMessage("Public snapshot revoked. The old link now returns not found.");
      } else {
        setMessage(routeMutationErrorMessage(payload?.errors, graphQLErrors));
      }
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return (
    <details {...props(styles.control)}>
      <summary {...props(styles.summary)}>Share a fixed comparison snapshot</summary>
      <form onSubmit={handlePublish} {...props(styles.form)}>
        <label htmlFor={titleId} {...props(styles.field)}>
          Optional title
          <input id={titleId} name="title" maxLength={120} {...props(styles.input)} />
        </label>
        <Button disabled={publishing || products.length < 2} type="submit">{publishing ? "Publishing…" : "Publish snapshot"}</Button>
        {published ? (
          <>
            <Link to={published.path}>Open public snapshot</Link>
            <Button disabled={revoking} onClick={handleRevoke} tone="danger" type="button" variant="soft">{revoking ? "Revoking…" : "Revoke public link"}</Button>
          </>
        ) : null}
        {message ? <p role="status" {...props(styles.message)}>{message}</p> : null}
      </form>
    </details>
  );
}
