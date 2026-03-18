import type { LoaderFunctionArgs } from "react-router-dom";

export type CompareRouteLoaderData =
  | {
      status: "empty";
      slugs: [];
    }
  | {
      status: "too_many" | "ready";
      slugs: string[];
    };

export async function compareLoader({
  request
}: LoaderFunctionArgs): Promise<CompareRouteLoaderData> {
  const slugs = parseSelectedSlugs(request.url);

  if (slugs.length === 0) {
    return {
      status: "empty",
      slugs: []
    };
  }

  if (slugs.length > 3) {
    return {
      status: "too_many",
      slugs
    };
  }

  return {
    status: "ready",
    slugs
  };
}

function parseSelectedSlugs(requestUrl: string) {
  const url = new URL(requestUrl);
  const selected = new Set<string>();

  for (const rawSlug of url.searchParams.getAll("slug")) {
    const slug = rawSlug.trim();

    if (slug !== "") {
      selected.add(slug);
    }
  }

  return Array.from(selected);
}
