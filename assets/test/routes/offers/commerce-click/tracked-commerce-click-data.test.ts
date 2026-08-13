import {
  resolveTrackedCommerceClickMutationOutcome,
  resolveTrackedCommerceRedirectUrl,
  shouldTrackCommerceClick,
  trackedMerchantProductHref,
} from "../../../../src/routes/offers/commerce-click/TrackedCommerceClickAction";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../../src/routes/route-errors";

const API_ENDPOINT = "http://localhost:4000/api/graphql";
const SCRIPT_SCHEME_REDIRECT = ["java", "script:alert(1)"].join("");
const MUTATION_ERROR = {
  code: "NOT_FOUND",
  field: "merchantProductId",
  message: "Offer unavailable.",
};
const GRAPHQL_ERROR = { message: "Transport-level GraphQL error" };

test("qualifies only unmodified primary commerce clicks without changing the input", () => {
  const primaryClick = {
    button: 0,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  };
  const originalClick = { ...primaryClick };

  expect(shouldTrackCommerceClick(primaryClick)).toBe(true);
  expect(primaryClick).toEqual(originalClick);

  for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const) {
    expect(shouldTrackCommerceClick({ ...primaryClick, [modifier]: true })).toBe(false);
  }

  expect(shouldTrackCommerceClick({ ...primaryClick, button: 1 })).toBe(false);
});

test("builds an API-origin merchant-product tracking href with an encoded ID", () => {
  expect(trackedMerchantProductHref("merchant product/with?symbols", API_ENDPOINT)).toBe(
    "http://localhost:4000/r/merchant-product?merchantProductId=merchant+product%2Fwith%3Fsymbols",
  );
});

test("resolves API-origin relative and absolute tracked redirects", () => {
  expect(
    resolveTrackedCommerceRedirectUrl(
      "/r/click-123?merchantProductId=merchant-product-1",
      API_ENDPOINT,
    ),
  ).toBe("http://localhost:4000/r/click-123?merchantProductId=merchant-product-1");
  expect(resolveTrackedCommerceRedirectUrl("http://localhost:4000/r/click-123", API_ENDPOINT)).toBe(
    "http://localhost:4000/r/click-123",
  );
});

test("rejects a redirect with the same host and port but a different scheme", () => {
  expect(() =>
    resolveTrackedCommerceRedirectUrl("https://localhost:4000/r/click-123", API_ENDPOINT),
  ).toThrow("Tracked commerce redirect must resolve to the same origin");
});

test("requires an explicit endpoint instead of reading environment state", () => {
  expect(() => trackedMerchantProductHref("merchant-product-1", undefined as never)).toThrow();
  expect(() => resolveTrackedCommerceRedirectUrl("/r/click-123", undefined as never)).toThrow();
});

test("rejects unsafe redirects", () => {
  for (const redirectPath of [
    "https://attacker.example/r/click-123",
    "//attacker.example/r/click-123",
    "http://attacker.example:4000/r/click-123",
    "http://localhost:4001/r/click-123",
    "blob:http://localhost:4000/click-123",
    SCRIPT_SCHEME_REDIRECT,
  ]) {
    expect(() => resolveTrackedCommerceRedirectUrl(redirectPath, API_ENDPOINT)).toThrow(
      "Tracked commerce redirect must resolve to the same origin",
    );
  }
});

test("tracked-click completion resolves an API-origin redirect without mutating inputs", () => {
  const payload = Object.freeze({
    redirectPath: "/r/click-123?merchantProductId=merchant-product-1",
    errors: Object.freeze([]),
  });
  const graphQLErrors = Object.freeze([]);

  expect(resolveTrackedCommerceClickMutationOutcome(payload, API_ENDPOINT, graphQLErrors)).toEqual({
    error: null,
    redirectUrl: "http://localhost:4000/r/click-123?merchantProductId=merchant-product-1",
  });
  expect(payload).toEqual({
    redirectPath: "/r/click-123?merchantProductId=merchant-product-1",
    errors: [],
  });
  expect(graphQLErrors).toEqual([]);
});

test.each([
  ["missing payload", undefined, [], DEFAULT_ROUTE_ERROR_MESSAGE],
  ["null payload", null, [], DEFAULT_ROUTE_ERROR_MESSAGE],
  ["null redirect path", { redirectPath: null, errors: [] }, [], DEFAULT_ROUTE_ERROR_MESSAGE],
  ["empty redirect path", { redirectPath: "", errors: [] }, [], DEFAULT_ROUTE_ERROR_MESSAGE],
  [
    "payload error",
    { redirectPath: "/r/click-123", errors: [MUTATION_ERROR] },
    [],
    MUTATION_ERROR.message,
  ],
  [
    "top-level GraphQL error",
    { redirectPath: "/r/click-123", errors: [] },
    [GRAPHQL_ERROR],
    DEFAULT_ROUTE_ERROR_MESSAGE,
  ],
  [
    "unsafe redirect path",
    { redirectPath: "https://attacker.example/r/click-123", errors: [] },
    [],
    DEFAULT_ROUTE_ERROR_MESSAGE,
  ],
] as const)(
  "tracked-click completion handles %s as an error",
  (_case, payload, graphQLErrors, error) => {
    expect(
      resolveTrackedCommerceClickMutationOutcome(payload, API_ENDPOINT, graphQLErrors),
    ).toEqual({ error, redirectUrl: null });
  },
);
