import { render, screen, waitFor } from "@testing-library/react";
import { createHead, UnheadProvider } from "@unhead/react/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { RouteMetadata } from "../../src/routes/RouteMetadata";

test("RouteMetadata updates canonical, robots, social, and structured metadata from route loader data", async () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: 'Field Camera </script><script>alert("metadata injection")</script>',
  };
  const router = createMemoryRouter(
    [
      {
        path: "/product",
        loader: () => ({
          metadata: {
            canonicalUrl: "https://app.example/product",
            description: "A factual product description.",
            imageUrl: "https://app.example/product.jpg",
            indexable: true,
            structuredData,
            title: "Factual product | Product Compare",
          },
        }),
        element: (
          <>
            <RouteMetadata />
            <main>Product body</main>
          </>
        ),
      },
    ],
    { initialEntries: ["/product"] },
  );

  render(
    <UnheadProvider head={createHead()}>
      <RouterProvider router={router} />
    </UnheadProvider>,
  );
  expect(await screen.findByText("Product body")).toBeVisible();

  await waitFor(() => expect(document.title).toBe("Factual product | Product Compare"));
  expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://app.example/product",
  );
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index,follow",
  );
  expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://app.example/product",
  );
  expect(document.head.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  expect(document.head.querySelector('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    "https://app.example/product.jpg",
  );
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');

  expect(jsonLdScripts).toHaveLength(1);
  expect(JSON.parse(jsonLdScripts[0]?.textContent ?? "")).toEqual(structuredData);
  expect(document.querySelectorAll("script")).toHaveLength(1);
});

test("RouteMetadata defaults non-public static routes to noindex", async () => {
  const router = createMemoryRouter(
    [
      {
        path: "/account",
        handle: { metadata: { title: "Account", description: "Private account" } },
        element: (
          <>
            <RouteMetadata />
            <main>Account body</main>
          </>
        ),
      },
    ],
    { initialEntries: ["/account"] },
  );

  render(
    <UnheadProvider head={createHead()}>
      <RouterProvider router={router} />
    </UnheadProvider>,
  );
  expect(await screen.findByText("Account body")).toBeVisible();
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow",
  );
  expect(document.head.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
});
