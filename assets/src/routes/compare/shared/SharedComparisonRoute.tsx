import { create, props } from "@stylexjs/stylex";
import { data, Link, useLoaderData } from "react-router";
import { graphql, usePreloadedQuery } from "react-relay";
import type { SharedComparisonRouteQuery as SharedComparisonRouteQueryType } from "$generated/SharedComparisonRouteQuery.graphql";
import type { Route } from "./+types/SharedComparisonRoute";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { PageShell } from "$ui/components/layout/PageShell";
import { tokens } from "$ui/theme/tokens.stylex";
import { normalizeRouteLoaderThrownError } from "$relay/loader-errors";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import {
  routeMetadataFromSeo,
  routeMetaDescriptors,
  type RouteDocumentMetadata,
} from "$frontend/seo";
import { buildSharedComparisonViewData } from "./shared-comparison-view-data";
import { RouteErrorBoundary as SharedRouteErrorBoundary } from "../RouteErrorBoundary";

export {
  SharedComparisonRoute as default,
  sharedComparisonLoader as loader,
};
export function clientLoader(args: Route.ClientLoaderArgs) {
  return sharedComparisonLoader(args);
}
clientLoader.hydrate = true as const;

const sharedComparisonRouteQuery = graphql`
  query SharedComparisonRouteQuery($token: String!) {
    comparisonSnapshot(token: $token) {
      title
      seo {
        title
        description
        canonicalPath
        indexable
        imageUrl
        structuredData
      }
      capturedAt
      disclaimer
      products {
        id
        name
        slug
        description
        modelNumber
        brandName
        attributes {
          claimId
          displayName
          valueText
          evidence {
            sourceName
          }
        }
        offers {
          pricePointId
          merchantName
          currency
          landedPrice
          observedAt
        }
      }
      recommendation {
        evaluatedAt
        winnerProductId
        missingInputs
        rankings {
          productId
          productName
          reasons
        }
      }
    }
  }
`;

export type SharedComparisonLoaderData =
  | {
      status: "ready";
      metadata: RouteDocumentMetadata;
      query: RelayRouteQueryDescriptor<SharedComparisonRouteQueryType["variables"]>;
    }
  | { status: "not_found" };

export function meta({ loaderData }: Route.MetaArgs) {
  return routeMetaDescriptors(
    loaderData?.status === "ready"
      ? loaderData.metadata
      : {
          title: "Shared comparison | Product Compare",
          description: "Review a fixed, source-backed product comparison snapshot.",
        },
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <SharedRouteErrorBoundary
      error={error}
      resourceName="shared comparison"
      title="Shared comparison"
    />
  );
}

export async function sharedComparisonLoader({ context, params, request }: Route.LoaderArgs) {
  const token = params.token?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return sharedComparisonNotFound();
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetched = await fetchRouteQuery<SharedComparisonRouteQueryType>(
      environment,
      sharedComparisonRouteQuery,
      { token },
      { signal: request.signal },
    );
    if (!fetched.data.comparisonSnapshot) {
      fetched.dispose();
      return sharedComparisonNotFound();
    }
    return {
      status: "ready" as const,
      metadata: routeMetadataFromSeo(fetched.data.comparisonSnapshot.seo, request.url, {
        allowIndexing: new URL(request.url).search === "",
      }),
      query: fetched.descriptor,
    };
  } catch (error) {
    throw normalizeRouteLoaderThrownError(error, "Shared comparison fetch failed");
  }
}

function sharedComparisonNotFound() {
  return data<SharedComparisonLoaderData>({ status: "not_found" }, { status: 404 });
}

const styles = create({
  attributeList: { display: "grid", gap: "0.5rem", margin: 0, padding: 0 },
  capture: { color: tokens.textSecondary, margin: 0 },
  disclaimer: {
    borderBlock: "1px solid var(--pc-border-emphasized)",
    margin: 0,
    paddingBlock: "1rem",
  },
  evidence: { color: tokens.textSecondary, fontSize: "0.9rem", margin: 0 },
  grid: {
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(18rem, 100%), 1fr))",
  },
  product: { display: "grid", gap: "0.85rem" },
  recommendation: { display: "grid", gap: "0.65rem" },
  title: { fontSize: "1.35rem", margin: 0 },
});

type SharedProductViewData = ReturnType<typeof buildSharedComparisonViewData>["products"][number];
type SharedRecommendationViewData = ReturnType<
  typeof buildSharedComparisonViewData
>["recommendation"];

export function SharedComparisonRoute() {
  const loaderData = useLoaderData<typeof sharedComparisonLoader>();

  if (loaderData.status !== "ready") {
    return (
      <PageShell eyebrow="Shared comparison" title="Comparison not found">
        <FeedbackState
          kind="error"
          title="This shared comparison is unavailable or has been revoked."
        />
      </PageShell>
    );
  }

  return <ReadySharedComparison query={loaderData.query} />;
}

function ReadySharedComparison({
  query,
}: {
  query: Extract<SharedComparisonLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<SharedComparisonRouteQueryType>(
    sharedComparisonRouteQuery,
    query,
  );
  const data = usePreloadedQuery<SharedComparisonRouteQueryType>(
    sharedComparisonRouteQuery,
    queryRef,
  );
  const snapshot = data.comparisonSnapshot;

  if (!snapshot) {
    return null;
  }

  const viewData = buildSharedComparisonViewData(snapshot);

  return (
    <PageShell
      description="A fixed record of the product details and prices available when this comparison was published."
      eyebrow="Shared comparison"
      title={viewData.title}
    >
      <p {...props(styles.capture)}>
        Published{" "}
        <time dateTime={viewData.capturedAt}>
          {formatProductDateTimeLabel(viewData.capturedAt)}
        </time>
      </p>
      <p role="note" {...props(styles.disclaimer)}>
        {viewData.disclaimer}
      </p>
      <SharedRecommendation recommendation={viewData.recommendation} />
      <section aria-label="Published products" {...props(styles.grid)}>
        {viewData.products.map((product) => (
          <SharedProductCard key={product.id} product={product} />
        ))}
      </section>
      <Link to={viewData.liveComparisonPath}>Open a live comparison</Link>
    </PageShell>
  );
}

function SharedRecommendation({
  recommendation,
}: {
  recommendation: SharedRecommendationViewData;
}) {
  return (
    <section aria-labelledby="shared-recommendation" {...props(styles.recommendation)}>
      <h2 id="shared-recommendation" {...props(styles.title)}>
        Published recommendation
      </h2>
      <strong>{recommendation.label}</strong>
      <ul>
        {recommendation.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p {...props(styles.evidence)}>
        Recommendation checked {formatProductDateTimeLabel(recommendation.evaluatedAt)}.
      </p>
    </section>
  );
}

function SharedProductCard({ product }: { product: SharedProductViewData }) {
  return (
    <article {...props(styles.product)}>
      <h2 {...props(styles.title)}>{product.name}</h2>
      <p {...props(styles.capture)}>{product.brandModelLabel}</p>
      {product.description ? <p>{product.description}</p> : null}
      <dl {...props(styles.attributeList)}>
        {product.attributes.map((attribute) => (
          <div key={attribute.key}>
            <dt>{attribute.displayName}</dt>
            <dd>
              {attribute.valueText}
              <p {...props(styles.evidence)}>{attribute.sourceLabel}</p>
            </dd>
          </div>
        ))}
      </dl>
      {product.offers.map((offer) => (
        <p key={offer.key}>
          {offer.label}
          {offer.observedAt ? (
            <>
              {" "}
              <span {...props(styles.evidence)}>
                (checked {formatProductDateTimeLabel(offer.observedAt)})
              </span>
            </>
          ) : null}
        </p>
      ))}
    </article>
  );
}
