import { render } from "../src/entry.server";

test("server render returns a promise that resolves to app markup", async () => {
  const html = render("/");

  expect(html).toBeInstanceOf(Promise);
  await expect(html).resolves.toContain("Product Compare");
});

test("server render resolves auth route markup", async () => {
  await expect(render("/auth/login")).resolves.toContain("Sign in");
});

test("server render emits route document metadata", async () => {
  const html = await render("/auth/login");

  expect(typeof html).toBe("string");
  expect(html).toContain("<title>Sign in | Product Compare</title>");
  expect(html).toContain(
    '<meta name="description" content="Sign in to manage saved comparisons and account tools."/>',
  );
});

test("server render emits qualified product canonical, robots, social, and safe JSON-LD metadata", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = vi.fn((_input, init) => {
    const body = JSON.parse(String(init?.body)) as { query: string };
    const payload = body.query.includes("ProductDetailRouteQuery")
      ? {
          data: {
            product: {
              id: "product-seo-1",
              name: "Field Camera",
              slug: "field-camera",
              description: "A detailed field camera.",
              seo: {
                title: "Field Camera specifications and prices | Product Compare",
                description: "Compare accepted Field Camera specifications and current offers.",
                canonicalPath: "/products/field-camera",
                indexable: true,
                imageUrl: null,
                structuredData:
                  '{"@context":"https://schema.org","@type":"Product","name":"Field Camera","url":"/products/field-camera"}',
              },
              brand: { id: "brand-1", name: "Acme" },
              currentAttributes: [],
              reviewSummary: { count: 0, averageRating: null },
              reviews: [],
              questions: [],
              merchantProducts: { edges: [], pageInfo: { endCursor: null, hasNextPage: false } },
            },
          },
        }
      : { data: { viewer: null } };

    return Promise.resolve(
      new Response(JSON.stringify(payload), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
  }) as typeof fetch;

  try {
    const html = await render("/products/field-camera", {
      request: new Request("https://app.example/products/field-camera"),
    });

    expect(typeof html).toBe("string");
    expect(html).toContain(
      "<title>Field Camera specifications and prices | Product Compare</title>",
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://app.example/products/field-camera"/>',
    );
    expect(html).toContain('<meta name="robots" content="index,follow"/>');
    expect(html).toContain("https://app.example/products/field-camera");
    expect(html).toContain('type="application/ld+json"');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("server render returns a 404 response for unknown application paths", async () => {
  const result = await render("/missing-page");

  expect(result).toBeInstanceOf(Response);

  const response = result as Response;

  expect(response.status).toBe(404);
  const body = await response.text();

  expect(body).toContain("<title>Page not found | Product Compare</title>");
  expect(body).toContain(
    '<meta name="description" content="The requested Product Compare page could not be found."/>',
  );
  expect(body).toContain("The requested page could not be found.");
  expect(body).toContain("__relayRecords");
});

test("server render handles product chunk failures with product-specific feedback", async () => {
  vi.doMock("../src/routes/products/ProductDetailRoute", () => {
    throw new Error("product chunk import failed");
  });

  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    const result = await render("/products/unavailable-product");

    expect(result).toBeInstanceOf(Response);

    const response = result as Response;

    expect(response.status).toBe(500);
    const body = await response.text();

    expect(body).toContain("Product details");
    expect(body).toContain("An unexpected error occurred while loading the product.");
  } finally {
    consoleError.mockRestore();
    vi.doUnmock("../src/routes/products/ProductDetailRoute");
  }
});

test("server render returns product not-found markup and Relay bootstrap with HTTP 404", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          data: {
            product: null,
            viewer: null,
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 200,
        },
      ),
    ),
  ) as typeof fetch;

  try {
    const result = await render("/products/missing-product");

    expect(result).toBeInstanceOf(Response);

    const response = result as Response;

    expect(response.status).toBe(404);
    const body = await response.text();

    expect(body).toContain("Product not found.");
    expect(body).toContain("__relayRecords");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("server render resolves recovery route markup", async () => {
  await expect(render("/auth/forgot-password")).resolves.toContain("Reset your password");
});

test("server render includes serialized Relay records for matched route queries", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          data: {
            products: {
              pageInfo: {
                hasNextPage: false,
                endCursor: "cursor-1",
              },
              edges: [
                {
                  cursor: "cursor-1",
                  node: {
                    __typename: "Product",
                    id: "product-1",
                    name: "Catalog First",
                    slug: "catalog-first",
                    brand: {
                      id: "brand-1",
                      name: "Acme",
                    },
                  },
                },
              ],
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 200,
        },
      ),
    ),
  ) as typeof fetch;

  try {
    const html = await render("/products");
    const records = parseRelayRecords(html);
    const recordValues = Object.values(records);

    expect(html).toContain("__relayRecords");
    expect(recordValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Catalog First",
          slug: "catalog-first",
        }),
      ]),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("server render does not wait for the optional attribution ledger", async () => {
  const originalFetch = globalThis.fetch;
  const ledgerResponse = deferredPromise<Response>();

  globalThis.fetch = vi.fn((_input, init) => {
    const body = JSON.parse(String(init?.body)) as { query: string };

    if (body.query.includes("AttributionLedgerRouteQuery")) {
      return ledgerResponse.promise;
    }

    const payload = body.query.includes("RevenueSummaryRouteQuery")
      ? {
          data: {
            revenueSummary: {
              filters: {
                currency: "USD",
                from: null,
                merchantId: null,
                network: null,
                productId: null,
                to: null,
              },
              metrics: {
                averagePaidPrice: null,
                clicks: 1,
                commissionRevenue: "0",
                conversions: 0,
                currency: "USD",
                grossOrderValue: "0",
              },
            },
          },
        }
      : { data: { viewer: null } };

    return Promise.resolve(jsonResponse(payload));
  }) as typeof fetch;

  const renderResult = render("/commerce/revenue?currency=USD");

  try {
    await expect(
      Promise.race([
        renderResult.then(() => "rendered" as const),
        new Promise<"blocked">((resolve) => setTimeout(() => resolve("blocked"), 2_000)),
      ]),
    ).resolves.toBe("rendered");
  } finally {
    ledgerResponse.resolve(
      jsonResponse({
        data: {
          commerceAttributionClicks: {
            edges: [],
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      }),
    );
    await renderResult;
    globalThis.fetch = originalFetch;
  }
});

test("server render does not wait for optional home deals", async () => {
  const originalFetch = globalThis.fetch;
  const dealsResponse = deferredPromise<Response>();

  globalThis.fetch = vi.fn((_input, init) => {
    const body = JSON.parse(String(init?.body)) as { query: string };

    if (body.query.includes("HomeDealsQuery")) {
      return dealsResponse.promise;
    }

    const payload = body.query.includes("HomeRouteQuery")
      ? {
          data: {
            homeWorkspace: {
              categories: { edges: [] },
              products: { edges: [] },
              selectedProducts: [],
            },
          },
        }
      : { data: { viewer: null } };

    return Promise.resolve(jsonResponse(payload));
  }) as typeof fetch;

  const renderResult = render("/");

  try {
    const result = await Promise.race([
      renderResult.then(() => "rendered" as const),
      new Promise<"blocked">((resolve) => setTimeout(() => resolve("blocked"), 2_000)),
    ]);

    expect(result).toBe("rendered");
    await expect(renderResult).resolves.toContain("Find the right product");
    await expect(renderResult).resolves.toContain("Loading new and trending offers...");
    await expect(renderResult).resolves.not.toContain('"deals":{}');
  } finally {
    dealsResponse.resolve(
      jsonResponse({
        data: {
          homeDeals: {
            forYou: { edges: [] },
            new: { edges: [] },
            trending: { edges: [] },
          },
        },
      }),
    );
    await renderResult;
    globalThis.fetch = originalFetch;
  }
});

function parseRelayRecords(html: Response | string) {
  expect(typeof html).toBe("string");

  const documentRef = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const script = documentRef.getElementById("__relayRecords");

  expect(script?.textContent).toBeTruthy();

  const payload = JSON.parse(script?.textContent ?? "{}") as {
    records?: Record<string, Record<string, unknown>>;
  };

  return payload.records ?? {};
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}

function deferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}
