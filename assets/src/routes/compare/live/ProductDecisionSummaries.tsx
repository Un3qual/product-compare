import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { graphql, useFragment } from "react-relay";
import type { ReactNode } from "react";
import type { CompareProductList_product$key } from "$generated/CompareProductList_product.graphql";
import type { CompareRouteQuery$data } from "$generated/CompareRouteQuery.graphql";
import { RelativeDateTime } from "$ui/components/data";
import { tokens } from "$ui/theme/tokens.stylex";
import type { CompareProductSummary, CompareRouteLoaderData } from "../compare-route-data";

const compareProductFragment = graphql`
  fragment CompareProductList_product on Product {
    id
    name
    slug
    description
    brand {
      name
    }
    currentAttributes {
      attributeId
      code
      displayName
      dataType
      valueText
      sortOrder
      groupLabel
      isRequired
      numericValue
      booleanValue
      enumOptionId
      unitSymbol
    }
  }
`;

type ReadyLoaderData = Extract<CompareRouteLoaderData, { status: "ready" }>;

const styles = create({
  section: {
    display: "grid",
    gap: "0.85rem",
  },
  heading: {
    fontSize: "1.25rem",
    margin: 0,
  },
  grid: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
  },
  card: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.65rem",
    padding: "1rem",
  },
  title: {
    fontSize: "1.1rem",
    margin: 0,
  },
  metadata: {
    color: tokens.textSecondary,
    margin: 0,
  },
  facts: {
    display: "grid",
    gap: "0.4rem",
    margin: 0,
  },
  fact: {
    display: "grid",
    gap: "0.15rem",
    gridTemplateColumns: "minmax(7rem, auto) minmax(0, 1fr)",
  },
  term: {
    color: tokens.textSecondary,
    fontWeight: 650,
  },
  value: { margin: 0 },
  link: {
    color: tokens.actionAccent,
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    textDecoration: "none",
    textDecorationLine: { ":hover": "underline", default: "none" },
  },
});

export function ProductDecisionSummaries({
  fragmentProducts,
  loaderData,
}: {
  fragmentProducts: CompareRouteQuery$data["comparisonProducts"];
  loaderData: ReadyLoaderData;
}) {
  const fragmentsBySlug = new Map(
    fragmentProducts.flatMap((product) => (product ? [[product.slug, product] as const] : [])),
  );

  return (
    <section aria-label="Product decision summaries" {...props(styles.section)}>
      <h2 {...props(styles.heading)}>Product summaries</h2>
      <div {...props(styles.grid)}>
        {loaderData.products.map((summary) => (
          <ProductDecisionSummary
            fragment={fragmentsBySlug.get(summary.slug) ?? null}
            key={summary.id}
            offerContext={loaderData.offerContexts[summary.id]}
            summary={summary}
          />
        ))}
      </div>
    </section>
  );
}

function ProductDecisionSummary({
  fragment,
  offerContext,
  summary,
}: {
  fragment: CompareRouteQuery$data["comparisonProducts"][number];
  offerContext: ReadyLoaderData["offerContexts"][string];
  summary: CompareProductSummary;
}) {
  const fragmentProduct = useFragment<CompareProductList_product$key>(
    compareProductFragment,
    fragment,
  );
  const product = fragmentProduct ?? summary;
  const keySpecifications = product.currentAttributes.slice(0, 2);

  return (
    <article {...props(styles.card)}>
      <div>
        <h3 {...props(styles.title)}>{product.name}</h3>
        <p {...props(styles.metadata)}>
          {"brand" in product
            ? (product.brand?.name ?? "Unknown brand")
            : (product.brandName ?? "Unknown brand")}
        </p>
      </div>
      {product.description ? <p>{product.description}</p> : null}
      <dl {...props(styles.facts)}>
        <DecisionFact label="Current buying position" value={currentBuyingPosition(offerContext)} />
        <DecisionFact label="Price freshness" value={priceFreshness(offerContext)} />
        {keySpecifications.map((attribute) => (
          <DecisionFact
            key={attribute.code}
            label={attribute.displayName}
            value={attribute.valueText}
          />
        ))}
      </dl>
      <Link to={`/products/${product.slug}`} {...props(styles.link)}>
        View {product.name}
      </Link>
    </article>
  );
}

function DecisionFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div {...props(styles.fact)}>
      <dt {...props(styles.term)}>{label}</dt>
      <dd {...props(styles.value)}>{value}</dd>
    </div>
  );
}

function currentBuyingPosition(context: ReadyLoaderData["offerContexts"][string]) {
  if (context.status === "unavailable") return "Offer details unavailable";
  if (context.hasMoreActiveOffers)
    return `${context.activeOfferCount} offers shown; more available`;
  return context.activeOfferCount === 1
    ? "1 offer shown"
    : `${context.activeOfferCount} offers shown`;
}

function priceFreshness(context: ReadyLoaderData["offerContexts"][string]) {
  if (context.status === "unavailable") return "Unavailable";
  return context.latestPriceObservedAt ? (
    <RelativeDateTime
      prefix="Observed"
      referenceTime={context.referenceTime}
      value={context.latestPriceObservedAt}
    />
  ) : (
    "No price check available"
  );
}
