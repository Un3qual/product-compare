import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import {
  Link,
  useLoaderData,
  useOutletContext,
  useRevalidator,
} from "react-router";
import { graphql, usePreloadedQuery } from "react-relay";
import type { HomeRouteQuery } from "$generated/HomeRouteQuery.graphql";
import type { Route } from "./+types/HomeRoute";
import { routeMetaDescriptors } from "$frontend/seo";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { buildComparePathFromSlugs } from "$routes/compare/paths";
import { isAbortError } from "$relay/loader-errors";
import type { RootViewer } from "$routes/root/viewer";
import { ComparisonContinuity } from "$ui/components/compare/ComparisonContinuity";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { PageShell } from "$ui/components/layout/PageShell";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import { HomeDeals } from "./HomeDeals";
import { HomeProductLedger } from "./HomeProductLedger";

export { HomeRoute as default, homeLoader as loader };
export function clientLoader(args: Route.ClientLoaderArgs) {
  return homeLoader(args);
}

export function meta() {
  return routeMetaDescriptors({
    title: "Product Compare",
    description: "Choose products with clearer specifications and current offers.",
  });
}
import { HomeSearch } from "./HomeSearch";
import {
  homeCatalogSearchPath,
  homeCategoryCatalogPath,
  selectedHomeCompareSlugs,
} from "./home-paths";
const HOME_PAGE_SIZE = 6;

const homeWorkspaceRouteQuery = graphql`
  query HomeRouteQuery($selectedSlugs: [String!]!, $first: Int!) {
    homeWorkspace(selectedSlugs: $selectedSlugs) {
      categories(first: $first) {
        edges {
          node {
            id
            name
            slug
            description
          }
        }
      }
      selectedProducts {
        id
        name
        slug
      }
      products(first: $first) {
        edges {
          cursor
        }
        ...HomeProductLedger_products
      }
    }
  }
`;

export type HomeLoaderData = {
  referenceTime: string;
  selectedSlugs: string[];
  workspace: RelayRouteQueryDescriptor<HomeRouteQuery["variables"]> | null;
};

export async function homeLoader({
  context,
  request,
}: Route.LoaderArgs): Promise<HomeLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const referenceTime = new Date().toISOString();
  const selectedSlugs = selectedHomeCompareSlugs(new URL(request.url).search);
  const variables = { first: HOME_PAGE_SIZE, selectedSlugs };
  const workspace = preloadRouteQuery<HomeRouteQuery>(
    environment,
    homeWorkspaceRouteQuery,
    variables,
    { signal: request.signal },
  );

  try {
    return { referenceTime, selectedSlugs, workspace: await workspace };
  } catch (error) {
    if (request.signal.aborted || isAbortError(error)) throw error;

    console.error("Failed to preload home workspace route query.", { error });
    return { referenceTime, selectedSlugs, workspace: null };
  }
}

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
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.3rem",
    paddingBlockStart: "0.65rem",
  },
  categoryLink: {
    alignItems: "center",
    color: tokens.actionAccent,
    display: "flex",
    fontWeight: 700,
    minHeight: "var(--pc-control-height)",
    textDecoration: "none",
  },
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
  const loaderData = useLoaderData<typeof homeLoader>();
  const outletContext = useOutletContext<HomeOutletContext | null>();
  const viewer = outletContext?.viewer ?? null;

  return (
    <PageShell
      description="Search the catalog, keep a comparison in view, and review current offers."
      eyebrow="Product catalog"
      title="Find the right product"
    >
      {loaderData.workspace ? (
        <ResettableErrorBoundary
          fallback={
            <HomeWorkspaceRecovery
              hasViewer={viewer !== null}
              selectedSlugs={loaderData.selectedSlugs}
            />
          }
          resetToken={loaderData.workspace}
        >
          <Suspense fallback={<FeedbackState kind="loading" title="Loading products..." />}>
            <HomeWorkspace
              hasViewer={viewer !== null}
              query={loaderData.workspace}
              referenceTime={loaderData.referenceTime}
            />
          </Suspense>
        </ResettableErrorBoundary>
      ) : (
        <HomeWorkspaceRecovery
          hasViewer={viewer !== null}
          selectedSlugs={loaderData.selectedSlugs}
        />
      )}
    </PageShell>
  );
}

function HomeWorkspace({
  hasViewer,
  query,
  referenceTime,
}: {
  hasViewer: boolean;
  query: NonNullable<HomeLoaderData["workspace"]>;
  referenceTime: string;
}) {
  const queryRef = useRoutePreloadedQuery<HomeRouteQuery>(homeWorkspaceRouteQuery, query);
  const data = usePreloadedQuery<HomeRouteQuery>(homeWorkspaceRouteQuery, queryRef);
  const selectedSlugs = data.homeWorkspace.selectedProducts.map((product) => product.slug);
  const comparisonProducts = data.homeWorkspace.selectedProducts.map((product) => ({
    label: product.name,
    slug: product.slug,
  }));
  const categories = data.homeWorkspace.categories.edges.map(({ node: category }) => ({
    description: category.description,
    href: homeCategoryCatalogPath(category.id, selectedSlugs),
    label: category.name,
  }));

  return (
    <>
      <HomeSearch selectedSlugs={selectedSlugs} />
      {comparisonProducts.length > 0 ? (
        <ComparisonContinuity
          destination={buildComparePathFromSlugs(comparisonProducts.map((product) => product.slug))}
          products={comparisonProducts}
        />
      ) : null}
      <section aria-labelledby="home-categories-title" {...props(styles.section)}>
        <h2 id="home-categories-title" {...props(styles.sectionTitle)}>
          Browse by category
        </h2>
        {categories.length > 0 ? (
          <ul aria-label="Product categories" {...props(styles.categories)}>
            {categories.map((category) => (
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
        {data.homeWorkspace.products.edges.length > 0 ? (
          <HomeProductLedger
            products={data.homeWorkspace.products}
            referenceTime={referenceTime}
            selectedSlugs={selectedSlugs}
          />
        ) : (
          <FeedbackState
            action={
              <Button render={<Link to={homeCatalogSearchPath("", selectedSlugs)} />}>
                Browse all products
              </Button>
            }
            kind="empty"
            title="No products are ready to compare yet."
          />
        )}
      </section>
      <HomeDealsSection hasViewer={hasViewer} selectedSlugs={selectedSlugs} />
    </>
  );
}

function HomeWorkspaceRecovery({
  hasViewer,
  selectedSlugs,
}: {
  hasViewer: boolean;
  selectedSlugs: readonly string[];
}) {
  return (
    <>
      <HomeSearch selectedSlugs={selectedSlugs} />
      <HomeWorkspaceUnavailable selectedSlugs={selectedSlugs} />
      <HomeDealsSection hasViewer={hasViewer} selectedSlugs={selectedSlugs} />
    </>
  );
}

function HomeDealsSection({
  hasViewer,
  selectedSlugs,
}: {
  hasViewer: boolean;
  selectedSlugs: readonly string[];
}) {
  return (
    <section aria-labelledby="home-deals-title" {...props(styles.section)}>
      <h2 id="home-deals-title" {...props(styles.sectionTitle)}>
        New and trending offers
      </h2>
      <HomeDeals hasViewer={hasViewer} selectedSlugs={selectedSlugs} />
    </section>
  );
}

function HomeWorkspaceUnavailable({ selectedSlugs }: { selectedSlugs: readonly string[] }) {
  const revalidator = useRevalidator();

  return (
    <section aria-label="Product workspace" {...props(styles.section)}>
      <FeedbackState
        action={
          <>
            <Button onClick={() => revalidator.revalidate()} type="button" variant="secondary">
              Try products again
            </Button>
            <Button render={<Link to={homeCatalogSearchPath("", selectedSlugs)} />}>
              Browse categories and products
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
