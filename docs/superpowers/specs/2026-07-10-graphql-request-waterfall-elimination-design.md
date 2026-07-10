# GraphQL Request Waterfall Elimination Design

## Goal

Reduce every audited frontend route to one GraphQL request for its initial route data, while preserving the existing route states, mutation behavior, abort handling, and safe partial degradation.

## Confirmed Problems

The comparison route currently scales its initial request count with the number of selected products. For two products, the loader sends two product-detail requests, waits for their IDs, sends two offer-context requests, and then the rendered product picker sends a fifth request. The existing focused test confirms four loader requests; the picker query accounts for the fifth browser request.

The same audit found four adjacent problems:

- Product detail waits for a product request before it can request offers.
- Catalog browse sends separate product and filter-metadata operations.
- Saved comparisons follows every cursor during route loading.
- API token management follows every cursor during route loading.

The root viewer operation is not part of this work. React Router can run the root and child loaders concurrently, and the child route does not depend on the viewer response.

## Chosen Approach

Each route will own one GraphQL document containing all data needed for its initial render. Backend schema additions will expose relationships and ordered comparison selection directly enough that Relay does not need dependent client requests.

This is preferable to transport-level batching because it removes data dependencies instead of merely hiding them inside one HTTP envelope. It is preferable to cache or prefetch tuning because the browser request count and backend work become deterministic.

## GraphQL Contract

### Ordered comparison products

Add a `comparisonProducts(slugs: [String!]!)` query field. It will:

- accept one to three unique, non-blank slugs;
- preserve the caller's slug order;
- return a nullable product entry for each requested slug so the frontend can preserve its existing `not_found` state;
- reject more than three slugs and invalid blank or duplicate input with deterministic GraphQL errors.

The result type will be a non-null list whose entries may be null. This preserves positional correspondence without inventing placeholder product records.

### Product-scoped merchant products

Add a `merchantProducts` field to `Product` with the existing active, merchant, cursor, and page-size controls, except that `productId` comes from the parent product. The resolver will reuse the existing pricing query and connection behavior rather than create a second offer implementation.

Top-level `merchantProducts(input:)` remains unchanged for offer discovery and other existing callers.

## Route Data Flow

### Comparison

Replace the per-product detail queries, per-product offer queries, and initial lazy picker query with one `CompareRouteQuery` containing:

- `comparisonProducts(slugs:)` with product identity, brand, attributes, and bounded product-scoped merchant products;
- `products(first: 24)` for the initial picker page.

The loader performs one route query. It summarizes products and offer context from that response and returns one retained Relay query descriptor. The rendered picker consumes the preloaded initial picker data. User-triggered `Show more products` remains a separate later request and is not an initial-load waterfall.

Missing or malformed offer context should not remove otherwise valid product specifications. If a product-scoped offer field cannot be summarized safely, that product receives the existing `unavailable` offer state. An aborted route request still aborts the complete operation. Because the data now travels in one HTTP operation, a transport failure affects the whole route instead of one product's offer request; this is the unavoidable shared failure domain of removing the request waterfall.

### Product detail

Extend `ProductDetailRouteQuery` to include the bounded product-scoped merchant-product connection. The loader sends one request and returns one descriptor. The route keeps its existing missing-product, missing-offer-data, pagination, coupon, and price-history presentation. A transport failure follows the existing route-level error state because product and offer data share one operation.

Changing `offersAfter` causes one new combined route request. It does not first refetch the product and then issue a dependent offer request.

### Catalog browse

Merge `productFilterMetadata(filters:)` into `BrowseProductsRouteQuery`. The loader sends one request and returns one descriptor. The route reads both products and metadata from the same retained query.

### Saved comparisons

The loader reads at most one page per navigation. It accepts an optional `after` URL parameter, returns the current page summary plus `hasNextPage` and `endCursor`, and exposes `First saved comparisons` and `Next saved comparisons` links when applicable.

Client-side filtering and sorting apply only to the visible page. The labels and status copy will say so explicitly. Delete behavior remains local and mutation-driven.

### API tokens

The loader reads at most one page per navigation. It accepts the existing status filter plus an optional `after` URL parameter, returns page metadata, and exposes `First API tokens` and `Next API tokens` links while preserving the selected status.

Create, rotate, and revoke behavior remains unchanged. Newly created records remain visible through existing local state on the current page.

## Error Handling and Resource Lifetime

- Every route request continues to receive the React Router abort signal.
- A failed combined route operation follows the route's existing error or degraded state.
- Retained Relay query references are disposed through the existing route-preload lease mechanism.
- Removed multi-page and multi-query paths will also remove their manual arrays of descriptors and partial-page disposal loops.
- Comparison preserves ordered missing-product detection and degrades missing or malformed offer context without discarding valid product specifications.
- Pagination never auto-follows a returned cursor.

## Testing

Implementation will be test-driven.

Backend GraphQL tests will cover ordered comparison results, positional nulls, input validation, product-scoped merchant-product filtering, pagination, and compatibility of the existing top-level pricing field.

Frontend loader tests will first assert the desired one-call behavior for comparison, product detail, and catalog. Saved-comparison and API-token tests will assert one page per navigation and correct cursor URLs. Route tests will cover visible-page filtering copy, first/next links, retained mutation behavior, and comparison picker behavior.

Final verification will include:

- focused backend GraphQL tests;
- focused frontend route and loader tests;
- Relay artifact generation;
- frontend type checking and the full unit suite;
- backend test suite and type checks;
- `git diff --check`;
- a browser network check when the local application and database can be started safely.

## Non-Goals

- No HTTP GraphQL batching transport.
- No change to browser authentication or the root viewer contract.
- No backward Relay pagination contract.
- No automatic loading of every saved comparison or API token.
- No unrelated visual redesign.
