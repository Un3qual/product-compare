import { describe, expect, test } from "vitest";
import {
  getRouteErrorViewData,
  type RouteErrorViewDataInput,
} from "../../../src/routes/compare/route-error-view-data";

describe("getRouteErrorViewData", () => {
  test("capitalizes the default unavailable resource copy", () => {
    expect(
      getRouteErrorViewData({ resourceName: "revenue report", error: { kind: "unknown" } }),
    ).toEqual({
      errorMessage: "Revenue report unavailable.",
      retryGuidance: "Please try again later.",
    });
  });

  test.each([
    [
      503,
      "A server error occurred while loading the comparison.",
      "Please try refreshing the page or come back later.",
    ],
    [404, "The requested comparison could not be found.", "Please check the URL and try again."],
    [
      401,
      "You don't have permission to view this comparison.",
      "Please sign in or contact support if you believe this is an error.",
    ],
    [
      403,
      "You don't have permission to view this comparison.",
      "Please sign in or contact support if you believe this is an error.",
    ],
    [422, "An error occurred while loading the comparison.", "Please try refreshing the page."],
  ] as const)(
    "returns exact response copy for status %s",
    (status, errorMessage, retryGuidance) => {
      expect(
        getRouteErrorViewData({ resourceName: "comparison", error: { kind: "response", status } }),
      ).toEqual({ errorMessage, retryGuidance });
    },
  );

  test.each([
    new Error("NETWORK connection failed"),
    new Error("Could not FETCH the route"),
    Object.assign(new Error("connection dropped"), { name: "NetworkError" }),
    new TypeError("Failed to FETCH route data"),
  ])("returns network copy for qualifying error context", (error) => {
    expect(
      getRouteErrorViewData({
        resourceName: "merchant directory",
        error: { kind: "error", error },
      }),
    ).toEqual({
      errorMessage: "A network error occurred while loading the merchant directory.",
      retryGuidance: "Please check your internet connection and try again.",
    });
  });

  test("keeps ordinary TypeErrors on the unexpected-error path", () => {
    expect(
      getRouteErrorViewData({
        resourceName: "comparison",
        error: { kind: "error", error: new TypeError("Cannot read properties of undefined") },
      }),
    ).toEqual({
      errorMessage: "An unexpected error occurred while loading the comparison.",
      retryGuidance: "Please try refreshing the page or come back later.",
    });
  });

  test("returns unexpected-error copy for generic errors", () => {
    expect(
      getRouteErrorViewData({
        resourceName: "comparison",
        error: { kind: "error", error: new Error("Relay read failed") },
      }),
    ).toEqual({
      errorMessage: "An unexpected error occurred while loading the comparison.",
      retryGuidance: "Please try refreshing the page or come back later.",
    });
  });

  test("does not mutate normalized input context", () => {
    const input: RouteErrorViewDataInput = {
      resourceName: "shared comparison",
      error: { kind: "response", status: 503 },
    };
    const original = structuredClone(input);

    getRouteErrorViewData(input);

    expect(input).toEqual(original);
  });
});
