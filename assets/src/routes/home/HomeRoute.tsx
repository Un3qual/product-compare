import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData, useOutletContext, useRevalidator } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import type { HomeWorkspaceRouteQuery } from "../../__generated__/HomeWorkspaceRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { ComparisonContinuity } from "../../ui/components/compare/ComparisonContinuity";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../ui/components/layout/PageShell";
import { Button } from "../../ui/primitives/Button";
import { tokens } from "../../ui/theme/tokens.stylex";
import { buildComparePathFromSlugs } from "../compare/paths";
import type { RootViewer } from "../root/loader";
import { HomeDeals } from "./HomeDeals";
import { HomeProductLedger } from "./HomeProductLedger";
import { HomeSearch } from "./HomeSearch";
import { homeCatalogSearchPath } from "./home-paths";
import { homeWorkspaceViewData } from "./home-view-data";
import { type HomeLoaderData, homeLoader } from "./loader";
import homeWorkspaceRouteQuery from "./queries/HomeWorkspaceRouteQuery";

const styles = create({
  categories: {
    display: "grid",
    gap: "0.65rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  category: {
    borderBlockStart: `1px solid ${tokens.borderQuiet}`,
    display: "grid",
    gap: "0.3rem",
    paddingBlockStart: "0.65rem",
  },
  categoryLink: { color: tokens.actionAccent, fontWeight: 700, textDecoration: "none" },
  categoryDescription: {
    color: tokens.textSecondary,
    fontSize: "0.88rem",
    lineHeight: 1.5,
    margin: 0,
  },
  section: { display: "grid", gap: "1rem" },
  sectionTitle: { fontSize: "1.25rem", letterSpacing: "-0.025em", margin: 0 },
});

type HomeOutletContext = { viewer: RootViewer | null };

export function HomeRoute() {
  const loaderData = useLoaderData<typeof homeLoader>() as HomeLoaderData;
  const outletContext = useOutletContext<HomeOutletContext | null>();
  const viewer = outletContext?.viewer ?? null;

  return (
    <PageShell
      description="Search the catalog, keep a comparison in view, and review current offers."
      eyebrow="Product catalog"
      title="Find the right product"
    >
      <HomeSearch selectedSlugs={loaderData.selectedSlugs} />
      {loaderData.workspace ? (
        <ResettableErrorBoundary
          fallback={<HomeWorkspaceUnavailable selectedSlugs={loaderData.selectedSlugs} />}
          resetToken={loaderData.workspace}
        >
          <Suspense fallback={<FeedbackState kind="loading" title="Loading products..." />}>
            <HomeWorkspace query={loaderData.workspace} selectedSlugs={loaderData.selectedSlugs} />
          </Suspense>
        </ResettableErrorBoundary>
      ) : (
        <HomeWorkspaceUnavailable selectedSlugs={loaderData.selectedSlugs} />
      )}
      <section aria-labelledby="home-deals-title" {...props(styles.section)}>
        <h2 id="home-deals-title" {...props(styles.sectionTitle)}>
          New and trending offers
        </h2>
        <HomeDeals
          deals={loaderData.deals}
          hasViewer={viewer !== null}
          selectedSlugs={loaderData.selectedSlugs}
        />
      </section>
    </PageShell>
  );
}

function HomeWorkspace({
  query,
  selectedSlugs,
}: {
  query: NonNullable<HomeLoaderData["workspace"]>;
  selectedSlugs: readonly string[];
}) {
  const queryRef = useRoutePreloadedQuery<HomeWorkspaceRouteQuery>(homeWorkspaceRouteQuery, query);
  const data = usePreloadedQuery<HomeWorkspaceRouteQuery>(homeWorkspaceRouteQuery, queryRef);
  const viewData = homeWorkspaceViewData(data.homeWorkspace, selectedSlugs);

  return (
    <>
      {viewData.comparisonProducts.length > 0 ? (
        <ComparisonContinuity
          destination={buildComparePathFromSlugs(
            viewData.comparisonProducts.map((product) => product.slug),
          )}
          products={viewData.comparisonProducts}
        />
      ) : null}
      <section aria-labelledby="home-categories-title" {...props(styles.section)}>
        <h2 id="home-categories-title" {...props(styles.sectionTitle)}>
          Browse by category
        </h2>
        {viewData.categories.length > 0 ? (
          <ul aria-label="Product categories" {...props(styles.categories)}>
            {viewData.categories.map((category) => (
              <li key={category.href} {...props(styles.category)}>
                <Link to={category.href} {...props(styles.categoryLink)}>
                  {category.label}
                </Link>
                <p {...props(styles.categoryDescription)}>{category.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <FeedbackState kind="empty" title="Categories are being prepared." />
        )}
      </section>
      <section aria-labelledby="home-products-title" {...props(styles.section)}>
        <h2 id="home-products-title" {...props(styles.sectionTitle)}>
          Products to compare
        </h2>
        {viewData.ledgerRows.length > 0 ? (
          <HomeProductLedger rows={viewData.ledgerRows} selectedSlugs={selectedSlugs} />
        ) : (
          <FeedbackState
            action={
              <Button asChild>
                <Link to={homeCatalogSearchPath("", selectedSlugs)}>Browse all products</Link>
              </Button>
            }
            kind="empty"
            title="No products are ready to compare yet."
          />
        )}
      </section>
    </>
  );
}

function HomeWorkspaceUnavailable({ selectedSlugs }: { selectedSlugs: readonly string[] }) {
  const revalidator = useRevalidator();

  return (
    <section aria-label="Product workspace" {...props(styles.section)}>
      <FeedbackState
        action={
          <>
            <Button onClick={() => revalidator.revalidate()} type="button" variant="soft">
              Try products again
            </Button>
            <Button asChild>
              <Link to={homeCatalogSearchPath("", selectedSlugs)}>
                Browse categories and products
              </Link>
            </Button>
          </>
        }
        description="Search by category or model, or browse the catalog while we reconnect."
        kind="error"
        title="Products are unavailable right now."
      />
    </section>
  );
}
