import type { GraphQLResponse } from "relay-runtime";
import type { LoaderFunctionArgs } from "react-router-dom";
import { fetchGraphQL } from "../../relay/fetch-graphql";
import type { SSRContext } from "../../relay/fetch-graphql";

export interface BrowseProduct {
  id: string;
  name: string;
  slug: string;
  brandName: string | null;
}

const BROWSE_PRODUCTS_QUERY = `
  query BrowseProducts($first: Int) {
    products(first: $first) {
      edges {
        node {
          id
          name
          slug
          brand {
            id
            name
          }
        }
      }
    }
  }
`;

export interface BrowseProductsLoaderData {
  products: BrowseProduct[];
}

export async function loadBrowseProducts(ssrContext?: SSRContext): Promise<BrowseProduct[]> {
  const response = await fetchGraphQL(BROWSE_PRODUCTS_QUERY, { first: 12 }, ssrContext);
  return parseBrowseProducts(response);
}

export async function browseLoader({ request }: LoaderFunctionArgs): Promise<BrowseProductsLoaderData> {
  return {
    products: await loadBrowseProducts(typeof window === "undefined" ? { request } : undefined)
  };
}

function parseBrowseProducts(response: GraphQLResponse): BrowseProduct[] {
  const edges = readEdges(response);

  return edges
    .map((edge) => parseBrowseProduct(edge))
    .filter((product): product is BrowseProduct => product !== null);
}

function readEdges(response: GraphQLResponse) {
  if (Array.isArray(response) || !("data" in response) || !response.data) {
    return [];
  }

  if (typeof response.data !== "object" || Array.isArray(response.data)) {
    return [];
  }

  const products = (response.data as Record<string, unknown>).products;

  if (!products || typeof products !== "object" || Array.isArray(products)) {
    return [];
  }

  const edges = (products as Record<string, unknown>).edges;

  return Array.isArray(edges) ? edges : [];
}

function parseBrowseProduct(edge: unknown): BrowseProduct | null {
  if (!edge || typeof edge !== "object" || !("node" in edge)) {
    return null;
  }

  const node = edge.node;

  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return null;
  }

  const candidate = node as Record<string, unknown>;

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
    brandName: parseBrandName(candidate.brand)
  };
}

function parseBrandName(brand: unknown) {
  if (!brand || typeof brand !== "object" || Array.isArray(brand)) {
    return null;
  }

  const candidate = brand as Record<string, unknown>;

  return typeof candidate.name === "string" ? candidate.name : null;
}
