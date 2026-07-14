import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { RouteMetadata } from "../../src/routes/RouteMetadata";

test("RouteMetadata updates canonical, robots, social, and structured metadata from route loader data", async () => {
  const router = createMemoryRouter([
    {
      path: "/product",
      loader: () => ({
        metadata: {
          canonicalUrl: "https://app.example/product",
          description: "A factual product description.",
          indexable: true,
          structuredData: '{"@type":"Product"}',
          title: "Factual product | Product Compare"
        }
      }),
      element: <><RouteMetadata /><main>Product body</main></>
    }
  ], { initialEntries: ["/product"] });

  render(<RouterProvider router={router} />);
  expect(await screen.findByText("Product body")).toBeVisible();

  await waitFor(() => expect(document.title).toBe("Factual product | Product Compare"));
  expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://app.example/product");
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
  expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute("content", "https://app.example/product");
  expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toBe('{"@type":"Product"}');
});

test("RouteMetadata defaults non-public static routes to noindex", async () => {
  const router = createMemoryRouter([
    {
      path: "/account",
      handle: { metadata: { title: "Account", description: "Private account" } },
      element: <><RouteMetadata /><main>Account body</main></>
    }
  ], { initialEntries: ["/account"] });

  render(<RouterProvider router={router} />);
  expect(await screen.findByText("Account body")).toBeVisible();
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
});
