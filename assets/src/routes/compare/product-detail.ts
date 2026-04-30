import type { GraphQLResponse } from "relay-runtime";
import {
  fetchGraphQL,
  formatGraphQLErrorMessage,
  hasGraphQLErrors
} from "../../relay/fetch-graphql";
import type { SSRContext } from "../../relay/fetch-graphql";

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brandName: string | null;
}

const PRODUCT_DETAIL_QUERY = `
  query ProductDetail($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      brand {
        id
        name
      }
    }
  }
`;

export async function loadProductDetail(
  slug: string,
  ssrContext?: SSRContext
): Promise<ProductDetail | null> {
  const normalizedSlug = slug.trim();

  if (normalizedSlug === "") {
    throw new Error("Product slug is required");
  }

  const response = await fetchGraphQL(PRODUCT_DETAIL_QUERY, { slug: normalizedSlug }, ssrContext);

  if (hasGraphQLErrors(response)) {
    throw new Error(formatGraphQLErrorMessage(response));
  }

  if (isProductMissing(response)) {
    return null;
  }

  const product = parseProductDetail(response);

  if (!product) {
    throw new Error("Product detail was missing from the GraphQL response");
  }

  return product;
}

function parseProductDetail(response: GraphQLResponse): ProductDetail | null {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return null;
  }

  if (!("data" in response) || !response.data) {
    return null;
  }

  if (typeof response.data !== "object" || Array.isArray(response.data)) {
    return null;
  }

  const product = (response.data as Record<string, unknown>).product;

  if (!product || typeof product !== "object" || Array.isArray(product)) {
    return null;
  }

  const candidate = product as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.slug !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    slug: candidate.slug,
    description: typeof candidate.description === "string" ? candidate.description : null,
    brandName: parseBrandName(candidate.brand)
  };
}

function isProductMissing(response: GraphQLResponse) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return false;
  }

  if (!("data" in response) || !response.data) {
    return false;
  }

  if (typeof response.data !== "object" || Array.isArray(response.data)) {
    return false;
  }

  const data = response.data as Record<string, unknown>;

  return "product" in data && data.product === null;
}

function parseBrandName(brand: unknown) {
  if (!brand || typeof brand !== "object" || Array.isArray(brand)) {
    return null;
  }

  const candidate = brand as Record<string, unknown>;

  return typeof candidate.name === "string" ? candidate.name : null;
}
