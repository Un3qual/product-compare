import { render } from "../entry.server";

test("server render returns a promise that resolves to app markup", async () => {
  const html = render("/");

  expect(html).toBeInstanceOf(Promise);
  await expect(html).resolves.toContain("Product Compare");
});

test("server render resolves auth route markup", async () => {
  await expect(render("/auth/login")).resolves.toContain("Sign in");
});

test("server render resolves recovery route markup", async () => {
  await expect(render("/auth/forgot-password")).resolves.toContain("Reset your password");
});

test("server render includes serialized Relay records for matched route queries", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: {
          products: {
            pageInfo: {
              hasNextPage: false,
              endCursor: "cursor-1"
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
                    name: "Acme"
                  }
                }
              }
            ]
          }
        }
      }),
      {
        headers: {
          "content-type": "application/json"
        },
        status: 200
      }
    )
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
          slug: "catalog-first"
        })
      ])
    );
  } finally {
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
