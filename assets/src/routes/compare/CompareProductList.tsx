import { Link } from "react-router-dom";
import { create, props } from "@stylexjs/stylex";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { DisclosureGroup } from "../../ui/components/feedback/DisclosureGroup";
import { Button } from "../../ui/primitives/Button";
import { tokens } from "../../ui/theme/tokens.stylex";
import { ProductAttributeList } from "../products/ProductAttributeList";
import type {
  CompareProductSummary,
  CompareRouteLoaderData,
  CompareSpecMode
} from "./loader";
import { DecisionSummary } from "./DecisionSummary";
import { CompareSpecificationMatrix } from "./CompareSpecificationMatrix";
import { buildComparePathAfterRemovingSlugIndex } from "./paths";
import { RecommendationPanel } from "./RecommendationPanel";

const styles = create({
  product: {
    display: "grid",
    gap: "0.7rem"
  },
  productTitle: {
    fontSize: "1.25rem",
    letterSpacing: "-0.02em",
    margin: 0
  },
  metadata: {
    color: tokens.textSecondary,
    margin: 0
  }
});

export function CompareProductList({
  loaderData
}: {
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
}) {
  return (
    <>
      <RecommendationPanel slugs={loaderData.slugs} specMode={loaderData.specMode} />
      <DecisionSummary
        offerContexts={loaderData.offerContexts}
        products={loaderData.products}
      />
      <CompareSpecificationMatrix
        products={loaderData.products}
        specMode={loaderData.specMode}
      />
      <DisclosureGroup
        items={[
          {
            content: (
              <DataList label="Compared products">
                {loaderData.products.map((product, index) => (
                  <DataListItem key={product.id}>
                    <CompareProductCard
                      product={product}
                      selectedSlugs={loaderData.slugs}
                      selectedIndex={index}
                      specMode={loaderData.specMode}
                    />
                  </DataListItem>
                ))}
              </DataList>
            ),
            label: "Individual product details",
            value: "product-details"
          }
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
          <article {...props(styles.product)}>
            <h2 {...props(styles.productTitle)}>{product.name}</h2>
            <p {...props(styles.metadata)}>{product.brandName ?? "Unknown brand"}</p>
            <p {...props(styles.metadata)}>{product.slug}</p>
            {product.description ? <p>{product.description}</p> : null}
          </article>
        </DataListItem>
      ))}
    </DataList>
  );
}

function CompareProductCard({
  product,
  selectedSlugs,
  selectedIndex,
  specMode
}: {
  product: CompareProductSummary;
  selectedSlugs: readonly string[];
  selectedIndex: number;
  specMode: CompareSpecMode;
}) {
  const removePath = buildComparePathAfterRemovingSlugIndex(selectedSlugs, selectedIndex, {
    specMode
  });

  return (
    <article {...props(styles.product)}>
      <h2 {...props(styles.productTitle)}>{product.name}</h2>
      <p {...props(styles.metadata)}>{product.brandName ?? "Unknown brand"}</p>
      <p {...props(styles.metadata)}>{product.slug}</p>
      <CompareProductDescription description={product.description} />
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

function CompareProductDescription({ description }: { description: string | null | undefined }) {
  return description ? <p>{description}</p> : null;
}
