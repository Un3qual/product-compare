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
            edges: [
              {
                node: {
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

    expect(html).toContain("__relayRecords");
    expect(html).toContain("Catalog First");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
