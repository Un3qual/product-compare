import { describe, expect, test } from "vitest";
import { buildSavedComparisonName } from "../../../src/routes/compare/saved-comparison-name-data";

describe("buildSavedComparisonName", () => {
  test("uses the fallback copy for empty input", () => {
    expect(buildSavedComparisonName([])).toBe("Saved comparison");
  });

  test("uses the fallback copy when every name is whitespace", () => {
    expect(buildSavedComparisonName([{ name: "  " }, { name: "\t\n" }])).toBe("Saved comparison");
  });

  test("trims leading and trailing whitespace from product names", () => {
    expect(buildSavedComparisonName([{ name: "  Travel camera  " }])).toBe(
      "Travel camera comparison",
    );
  });

  test("uses singular comparison copy for one non-empty product", () => {
    expect(buildSavedComparisonName([{ name: "Travel camera" }])).toBe("Travel camera comparison");
  });

  test("joins multiple product names in caller-provided order", () => {
    expect(
      buildSavedComparisonName([{ name: "Camera" }, { name: "Tripod" }, { name: "Memory card" }]),
    ).toBe("Camera vs Tripod vs Memory card");
  });

  test("omits empty names between products", () => {
    expect(buildSavedComparisonName([{ name: "Camera" }, { name: " " }, { name: "Tripod" }])).toBe(
      "Camera vs Tripod",
    );
  });

  test("preserves duplicate product names", () => {
    expect(buildSavedComparisonName([{ name: "Camera" }, { name: "Camera" }])).toBe(
      "Camera vs Camera",
    );
  });

  test("does not mutate the input array or its records", () => {
    const products = [
      { name: "  Camera  ", metadata: { source: "catalog" } },
      { name: " ", metadata: { source: "catalog" } },
    ];
    const original = structuredClone(products);

    buildSavedComparisonName(products);

    expect(products).toEqual(original);
  });
});
