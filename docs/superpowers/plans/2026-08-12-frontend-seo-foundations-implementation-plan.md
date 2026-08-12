# Frontend And SEO Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-built metadata and sitemap output, simplify frontend root ownership, and give commerce redirect actions behavior-revealing names without changing public URLs.

**Architecture:** Unhead owns document metadata across React SSR and hydration, while route handles and loader data remain typed metadata inputs. Saxy owns XML encoding for the existing dynamic sitemap endpoints. The root router becomes a small composition of shopper, account, and operator route groups; SSR mechanics move under `frontend/ssr`, and the commerce controller names describe whether a click already exists or is being created.

**Tech Stack:** React 19, React Router 7, Relay 20, Unhead React 3.2.3, StyleX, Phoenix 1.8, Saxy 1.6, Vitest, Playwright, ExUnit

## Global Constraints

- Browser auth remains GraphQL over `/api/graphql`; Phoenix remains the cookie-backed session authority.
- Public route paths, canonical redirects, status codes, cache headers, route lazy-loading, Relay SSR records, localized route failures, and sitemap partitions remain unchanged.
- Metadata must be identical after SSR and hydration, structured data remains typed data, and untrusted values never enter an unsafe head API.
- Do not style or test `ts-chart-*` or any other third-party internal class name.
- Add barrels only for stable leaf APIs; never add a router, generated-Relay, or feature-tree barrel.
- The implementation must delete more generic root/route helper files than it creates.

---

### Task 1: Characterize metadata, sitemap, router, and redirect behavior

**Files:**
- Modify: `assets/test/entry.server.test.tsx`
- Modify: `assets/test/entry.server.error-handling.test.tsx`
- Modify: `assets/test/router.test.tsx`
- Modify: `assets/test/routes/route-metadata.test.tsx`
- Modify: `test/product_compare_web/controllers/seo_controller_test.exs`
- Modify: `test/product_compare_web/controllers/commerce_redirect_controller_test.exs`

**Interfaces:**
- Produces: characterization for one title, one canonical link, one robots tag, deduplicated Open Graph/Twitter tags, safe JSON-LD, unchanged SSR response propagation, parseable sitemap documents, and both redirect lifecycles.

- [ ] **Step 1: Add failing metadata and hydration assertions**

  Assert an SSR render followed by hydration contains one tag for every unique metadata key and that loader metadata supersedes the route default. Include a JSON-LD value containing `<`, `>`, `&`, and quotes and parse the rendered script as JSON rather than comparing markup substrings.

- [ ] **Step 2: Add failing semantic XML assertions**

  Parse `/sitemap.xml` and every `/sitemaps/*.xml` response with Saxy in the test. Assert the sitemap namespace, partition locations, escaped URL round trip, ISO-8601 `lastmod`, empty partition validity, content type, and cache control.

- [ ] **Step 3: Run RED**

  ```bash
  cd assets && pnpm run test:unit -- test/entry.server.test.tsx test/entry.server.error-handling.test.tsx test/router.test.tsx test/routes/route-metadata.test.tsx
  mix test test/product_compare_web/controllers/seo_controller_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs
  ```

  Expected: Unhead provider/rendering and Saxy parsing tests fail because those boundaries do not exist; existing redirect behavior remains green.

- [ ] **Step 4: Commit characterization**

  ```bash
  git add assets/test test/product_compare_web/controllers
  git commit -m "test: characterize frontend and SEO foundations"
  ```

---

### Task 2: Make Unhead the SSR and hydration metadata owner

**Files:**
- Modify: `assets/package.json`
- Modify: `assets/pnpm-lock.yaml`
- Create: `assets/src/frontend/head/RouteHead.tsx`
- Create: `assets/src/frontend/head/route-head.ts`
- Create: `assets/src/frontend/head/index.ts`
- Modify: `assets/src/entry.client.tsx`
- Modify: `assets/src/entry.server.tsx`
- Modify: `assets/src/routes/RootRoute.tsx`
- Modify: `assets/src/router.tsx`
- Delete: `assets/src/routes/RouteMetadata.tsx`
- Delete: `assets/src/routes/route-metadata-data.ts`
- Delete: `assets/test/routes/route-metadata-data.test.ts`

**Interfaces:**
- Produces: `RouteHeadInput` with `title`, `description`, optional `canonicalUrl`, `imageUrl`, `indexable`, and `structuredData: Record<string, unknown> | readonly Record<string, unknown>[]`.
- Produces: `RouteHead({ metadata }: { metadata: RouteHeadInput }): null`, implemented with `useSeoMeta` plus a safe JSON-LD head entry.
- Produces: one client `createHead()` and one request-scoped server `createHead()` supplied through `UnheadProvider`; the server returns `head.render()` output for document insertion.

- [ ] **Step 1: Install the maintained React head integration**

  ```bash
  cd assets && pnpm add @unhead/react@3.2.3
  ```

- [ ] **Step 2: Implement the typed head boundary**

  Define route metadata on route handles or typed loader results without accepting `unknown`. Map `indexable === true` to `index,follow`, otherwise `noindex,follow`; select `summary_large_image` only when an image exists. Serialize structured data through the library's safe script-content path and never pass prebuilt HTML.

- [ ] **Step 3: Wire one head instance per render**

  Wrap both router providers with the matching Unhead provider. During SSR, wait for React data, render Unhead, and insert the returned head tags before `</head>` while Relay records remain before `</body>`. During hydration, create one client instance so existing tags are adopted instead of duplicated.

- [ ] **Step 4: Remove manual metadata interpretation**

  Delete the deepest-match `unknown` record walk and direct `<title>/<meta>/<link>/<script>` construction. Keep route-default fallback as a typed router concern and treat React Router's match array as the single library-boundary cast; do not spread record guards into dynamic route loaders.

- [ ] **Step 5: Run GREEN**

  ```bash
  cd assets && pnpm run relay:check && pnpm run typecheck && pnpm run test:unit -- test/entry.server.test.tsx test/entry.server.error-handling.test.tsx test/router.test.tsx test/routes/route-metadata.test.tsx
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add assets/package.json assets/pnpm-lock.yaml assets/src assets/test
  git commit -m "refactor: adopt Unhead for route metadata"
  ```

---

### Task 3: Encode sitemap XML with Saxy

**Files:**
- Modify: `mix.exs`
- Modify: `mix.lock`
- Create: `lib/product_compare_web/seo/sitemap_xml.ex`
- Modify: `lib/product_compare_web/controllers/seo_controller.ex`
- Modify: `test/product_compare_web/controllers/seo_controller_test.exs`

**Interfaces:**
- Produces: `ProductCompareWeb.Seo.SitemapXml.index([String.t()]) :: iodata()`.
- Produces: `ProductCompareWeb.Seo.SitemapXml.url_set([%{path: String.t(), last_modified: DateTime.t() | NaiveDateTime.t()}], String.t()) :: iodata()`.
- Consumes: absolute URLs assembled by the controller and existing `Seo.sitemap_entries/1`; Saxy alone performs XML escaping/encoding.

- [ ] **Step 1: Add Saxy**

  Add `{:saxy, "~> 1.6"}` to runtime dependencies and run `mix deps.get`.

- [ ] **Step 2: Implement XML elements, not XML strings**

  Build `sitemapindex/sitemap/loc` and `urlset/url/loc/lastmod` element tuples with the sitemap namespace, pass them to `Saxy.encode!/2`, and prepend the XML declaration through encoder options or one static declaration constant. Remove `xml_escape/1` and every interpolated XML tag.

- [ ] **Step 3: Preserve controller response behavior**

  Keep the existing routes, four partitions, entry ordering, cache control, and `application/xml; charset=utf-8`. If encoding raises, allow the request to become a logged server error; never send a partial success body.

- [ ] **Step 4: Run GREEN**

  ```bash
  mix format
  mix test test/product_compare_web/controllers/seo_controller_test.exs test/product_compare/seo_test.exs
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add mix.exs mix.lock lib/product_compare_web/seo lib/product_compare_web/controllers/seo_controller.ex test/product_compare_web/controllers/seo_controller_test.exs
  git commit -m "refactor: encode sitemaps with Saxy"
  ```

---

### Task 4: Split router and SSR responsibilities and simplify root fallback

**Files:**
- Create: `assets/src/frontend/ssr/request.ts`
- Create: `assets/src/frontend/ssr/stream.ts`
- Create: `assets/src/frontend/ssr/response.ts`
- Create: `assets/src/frontend/ssr/index.ts`
- Create: `assets/src/routing/shopper-routes.tsx`
- Create: `assets/src/routing/account-routes.tsx`
- Create: `assets/src/routing/operator-routes.tsx`
- Create: `assets/src/routing/lazy-route.tsx`
- Modify: `assets/src/entry.server.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/RootRoute.tsx`
- Modify: `assets/src/routes/RootDestinations.tsx`
- Delete: `assets/src/routes/root-destination-data.ts`
- Delete: `assets/test/routes/root-destination-data.test.ts`
- Modify: `assets/test/entry.server.test.tsx`
- Modify: `assets/test/router.test.tsx`

**Interfaces:**
- Produces: `shopperRoutes`, `accountRoutes`, and `operatorRoutes` as explicit `RouteObject[]`; no group barrel.
- Produces: `withLazyRouteImportRecovery(load)` in `routing/lazy-route.tsx`.
- Produces: `createServerRequest`, `waitForAllReady`, `responseHeadersFromContext`, and `insertDocumentBootstrap` under the SSR leaf barrel.
- Changes: `RootLoaderData` becomes `{ viewer: RootViewer | null; viewerQuery: RootViewerQueryDescriptor | null }`; `null` means the public shell uses the trusted Relay cache fallback, not a vague degraded mode.

- [ ] **Step 1: Move SSR mechanics with characterization green**

  Move one responsibility at a time without changing its implementation. Keep `entry.server.tsx` responsible only for environment/router/head creation, React rendering, and response assembly.

- [ ] **Step 2: Split the registry by audience**

  Move public shopper routes, auth/account routes, and operator-only routes into three explicit arrays. Keep root route creation, root revalidation, hydration data, and route-group composition in `router.tsx`.

- [ ] **Step 3: Remove the root destination projection file**

  Collocate the static navigation arrays and viewer-based selection with `RootDestinations.tsx`. Preserve comparison query continuity, operator visibility, mobile grouping, and focus behavior.

- [ ] **Step 4: Remove the `degraded` state name**

  Preserve the public-shell fallback on viewer-query failure, abort propagation, and cached-viewer behavior. Express the actual nullable query descriptor rather than a status union that implies application degradation.

- [ ] **Step 5: Run GREEN and inspect cycles**

  ```bash
  cd assets && pnpm run typecheck && pnpm run test:unit -- test/entry.server.test.tsx test/entry.server.error-handling.test.tsx test/router.test.tsx test/routes/root-destinations.test.tsx
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add assets/src assets/test
  git commit -m "refactor: separate routing and SSR ownership"
  ```

---

### Task 5: Rename redirect actions after their behavior

**Files:**
- Modify: `lib/product_compare_web/controllers/commerce_redirect_controller.ex`
- Modify: `lib/product_compare_web/router.ex`
- Modify: `test/product_compare_web/controllers/commerce_redirect_controller_test.exs`

**Interfaces:**
- Renames: controller `show/2` to `redirect_tracked_click/2`; `merchant_product/2` to `track_merchant_product_click/2`. Paths stay `/r/:click_id` and `/r/merchant-product`.

- [ ] **Step 1: Rename controller actions and routes**

  Update Phoenix route action atoms and test descriptions. Do not change controller logic, redirect security, click attribution, or response bodies.

- [ ] **Step 2: Run focused verification**

  ```bash
  mix test test/product_compare_web/controllers/commerce_redirect_controller_test.exs
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add lib/product_compare_web/controllers/commerce_redirect_controller.ex lib/product_compare_web/router.ex test/product_compare_web/controllers/commerce_redirect_controller_test.exs
  git commit -m "refactor: clarify commerce redirect actions"
  ```

---

### Task 6: Verify and close the foundation outcome

**Files:**
- Create: `assets/tests/e2e/product-experience-foundations.spec.ts`
- Create/update after inspection: `assets/tests/e2e/product-experience-foundations.spec.ts-snapshots/**`
- Modify: `docs/work/product-experience-foundations.md`

**Interfaces:**
- Produces: deterministic SSR/hydration, metadata, navigation, and no-overflow evidence at 1440×1000, 900×1100, and 390×844.

- [ ] **Step 1: Run browser acceptance without snapshot updates**

  Verify a dynamic product canonical/JSON-LD page, a noindex account page, auth navigation, and one operator route. Inspect all screenshots before updating expected files.

- [ ] **Step 2: Run complete gates**

  ```bash
  cd assets && pnpm run check
  mix format --check-formatted
  mix typecheck
  mix quality
  mix test
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Run anti-slop review and commit**

  Confirm no manual metadata tag builder, XML escape helper, `status: "degraded"`, application selector for `ts-chart-*`, or generic root destination data file remains. Confirm the new barrels are used by multiple consumers and do not increase the client bundle beyond its budget.

  ```bash
  git add assets lib test mix.exs mix.lock docs/work/product-experience-foundations.md
  git commit -m "feat: complete frontend and SEO foundations"
  ```
