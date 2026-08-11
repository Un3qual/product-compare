import { Link } from "react-router-dom";
import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment } from "react-relay";
import type { CompareProductList_product$key } from "$generated/CompareProductList_product.graphql";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { DisclosureGroup } from "$ui/components/feedback/DisclosureGroup";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import { ProductAttributeList } from "../products/ProductAttributeList";
import type {
  CompareProductSummary,
  CompareRouteLoaderData,
  CompareSpecMode,
} from "./compare-route-data";
import { DecisionSummary } from "./DecisionSummary";
import { CompareSpecificationMatrix } from "./CompareSpecificationMatrix";
import { buildComparePathAfterRemovingSlugIndex } from "./paths";
import { RecommendationPanel } from "./RecommendationPanel";

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

type CompareProductFragmentRef = CompareProductList_product$key & { readonly slug: string };

const styles = create({
  product: {
    display: "grid",
    gap: "0.7rem",
  },
  productTitle: {
    fontSize: "1.25rem",
    letterSpacing: "-0.02em",
    margin: 0,
  },
  metadata: {
    color: tokens.textSecondary,
    margin: 0,
  },
});

export function CompareProductList({
  fragmentProducts,
  loaderData,
}: {
  fragmentProducts: ReadonlyArray<CompareProductFragmentRef | null | undefined>;
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
}) {
  const fragmentsBySlug = new Map(
    fragmentProducts.flatMap((product) => (product ? [[product.slug, product] as const] : [])),
  );

  return (
    <>
      <RecommendationPanel slugs={loaderData.slugs} specMode={loaderData.specMode} />
      <DecisionSummary offerContexts={loaderData.offerContexts} products={loaderData.products} />
      <CompareSpecificationMatrix products={loaderData.products} specMode={loaderData.specMode} />
      <DisclosureGroup
        items={[
          {
            content: (
              <DataList label="Compared products">
                {loaderData.products.map((product, index) => (
                  <DataListItem key={product.id}>
                    {fragmentsBySlug.has(product.slug) ? (
                      <CompareProductCard
                        product={fragmentsBySlug.get(product.slug)!}
                        selectedSlugs={loaderData.slugs}
                        selectedIndex={index}
                        specMode={loaderData.specMode}
                      />
                    ) : (
                      <CompareProductSummaryCard product={product} />
                    )}
                  </DataListItem>
                ))}
              </DataList>
            ),
            label: "Individual product details",
            value: "product-details",
          },
        ]}
        label="Supporting comparison detail"
      />
    </>
  );
}

export function CompareProductSummaryList({ products }: { products: CompareProductSummary[] }) {
  return (
    <DataList label="Compared product summaries">
      {products.map((product) => (
        <DataListItem key={product.id}>
          <CompareProductSummaryCard product={product} />
        </DataListItem>
      ))}
    </DataList>
  );
}

function CompareProductCard({
  product: fragmentRef,
  selectedSlugs,
  selectedIndex,
  specMode,
}: {
  product: CompareProductList_product$key;
  selectedSlugs: readonly string[];
  selectedIndex: number;
  specMode: CompareSpecMode;
}) {
  const product = useFragment(compareProductFragment, fragmentRef);
  const removePath = buildComparePathAfterRemovingSlugIndex(selectedSlugs, selectedIndex, {
    specMode,
  });

  return (
    <article {...props(styles.product)}>
      <h2 {...props(styles.productTitle)}>{product.name}</h2>
      <p {...props(styles.metadata)}>{product.brand?.name ?? "Unknown brand"}</p>
      <p {...props(styles.metadata)}>{product.slug}</p>
      <CompareProductDescription
        description={typeof product.description === "string" ? product.description : null}
      />
      <ProductAttributeList
        attributes={product.currentAttributes}
        emptyMessage="No product attributes available yet."
      />
      <nav aria-label={`Actions for ${product.name}`}>
        <Button asChild variant="soft">
          <Link to={removePath}>Remove {product.name}</Link>
        </Button>
      </nav>
    </article>
  );
}

function CompareProductSummaryCard({ product }: { product: CompareProductSummary }) {
  return (
    <article {...props(styles.product)}>
      <h2 {...props(styles.productTitle)}>{product.name}</h2>
      <p {...props(styles.metadata)}>{product.brandName ?? "Unknown brand"}</p>
      <p {...props(styles.metadata)}>{product.slug}</p>
      {product.description ? <p>{product.description}</p> : null}
    </article>
  );
}

function CompareProductDescription({ description }: { description: string | null | undefined }) {
  return description ? <p>{description}</p> : null;
}
