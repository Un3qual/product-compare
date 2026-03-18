import type { GraphQLResponse } from "relay-runtime";
import type { LoaderFunctionArgs } from "react-router-dom";
import { fetchGraphQL } from "../../relay/fetch-graphql";
import type { SSRContext } from "../../relay/fetch-graphql";

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brandName: string | null;
}

export interface ProductOffer {
  id: string;
  merchantName: string;
  url: string;
  priceText: string;
}

export type ProductOffersStatus = "ready" | "empty" | "error";

export type ProductDetailLoaderData =
  | {
      status: "ready";
      product: ProductDetail;
      offersStatus: ProductOffersStatus;
      offers: ProductOffer[];
    }
  | {
      status: "not_found" | "error";
      product: null;
    };

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

const PRODUCT_OFFERS_QUERY = `
  query ProductOffers($input: MerchantProductsInput!) {
    merchantProducts(input: $input) {
      edges {
        node {
          id
          url
          currency
          merchant {
            id
            name
          }
          latestPrice {
            id
            price
          }
        }
      }
    }
  }
`;

export async function loadProductDetail(
  slug: string,
  ssrContext?: SSRContext
): Promise<ProductDetail | null> {
  if (slug === "") {
    throw new Error("Product slug is required");
  }

  const response = await fetchGraphQL(PRODUCT_DETAIL_QUERY, { slug }, ssrContext);

  if (hasGraphQLErrors(response)) {
    throw new Error("GraphQL response contained errors");
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

async function loadProductOffers(
  productId: string,
  ssrContext?: SSRContext
): Promise<ProductOffer[]> {
  const response = await fetchGraphQL(
    PRODUCT_OFFERS_QUERY,
    {
      input: {
        productId,
        activeOnly: true,
        first: 6
      }
    },
    ssrContext
  );

  if (hasGraphQLErrors(response)) {
    throw new Error("GraphQL response contained errors");
  }

  return parseProductOffers(response);
}

export async function productDetailLoader({
  params,
  request
}: LoaderFunctionArgs): Promise<ProductDetailLoaderData> {
  try {
    const ssrContext = typeof window === "undefined" ? { request } : undefined;

    const product = await loadProductDetail(params.slug ?? "", ssrContext);

    if (!product) {
      return {
        status: "not_found",
        product: null
      };
    }
    let offersStatus: ProductOffersStatus = "ready";
    let offers: ProductOffer[] = [];

    try {
      offers = await loadProductOffers(product.id, ssrContext);
      offersStatus = offers.length === 0 ? "empty" : "ready";
    } catch {
      offersStatus = "error";
    }

    return {
      status: "ready",
      product,
      offersStatus,
      offers
    };
  } catch {
    return {
      status: "error",
      product: null
    };
  }
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

function hasGraphQLErrors(response: GraphQLResponse) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return false;
  }

  const candidate = response as unknown as Record<string, unknown>;
  const errors = candidate.errors;

  return Array.isArray(errors) && errors.length > 0;
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

function parseProductOffers(response: GraphQLResponse): ProductOffer[] {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return [];
  }

  if (!("data" in response) || !response.data) {
    return [];
  }

  if (typeof response.data !== "object" || Array.isArray(response.data)) {
    return [];
  }

  const merchantProducts = (response.data as Record<string, unknown>).merchantProducts;

  if (!merchantProducts || typeof merchantProducts !== "object" || Array.isArray(merchantProducts)) {
    return [];
  }

  const edges = (merchantProducts as Record<string, unknown>).edges;

  if (!Array.isArray(edges)) {
    return [];
  }

  return edges.flatMap((edge) => {
    if (!edge || typeof edge !== "object" || Array.isArray(edge)) {
      return [];
    }

    const node = (edge as Record<string, unknown>).node;

    if (!node || typeof node !== "object" || Array.isArray(node)) {
      return [];
    }

    const candidate = node as Record<string, unknown>;
    const merchantName = parseMerchantName(candidate.merchant);
    const priceText = formatPriceText(candidate.latestPrice, candidate.currency);

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.url !== "string" ||
      !merchantName ||
      !priceText
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        merchantName,
        url: candidate.url,
        priceText
      }
    ];
  });
}

function parseMerchantName(merchant: unknown) {
  if (!merchant || typeof merchant !== "object" || Array.isArray(merchant)) {
    return null;
  }

  const candidate = merchant as Record<string, unknown>;

  return typeof candidate.name === "string" ? candidate.name : null;
}

function formatPriceText(latestPrice: unknown, currency: unknown) {
  if (!latestPrice || typeof latestPrice !== "object" || Array.isArray(latestPrice)) {
    return null;
  }

  if (typeof currency !== "string") {
    return null;
  }

  const candidate = latestPrice as Record<string, unknown>;

  if (typeof candidate.price === "string" && candidate.price !== "") {
    return `${candidate.price} ${currency}`;
  }

  if (typeof candidate.price === "number" && Number.isFinite(candidate.price)) {
    return `${candidate.price.toFixed(2)} ${currency}`;
  }

  return null;
}
