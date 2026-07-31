import {
  buildProductAttributeListData,
  type ProductAttributeListItem,
} from "../../../src/routes/products/product-attribute-list-data";

function attribute(code: string, groupLabel?: string | null): ProductAttributeListItem {
  return {
    code,
    displayName: code,
    groupLabel,
    valueText: `${code} value`,
  };
}

test("buildProductAttributeListData returns empty partitions for empty input", () => {
  expect(buildProductAttributeListData([])).toEqual({
    groupedAttributes: [],
    ungroupedAttributes: [],
  });
});

test("buildProductAttributeListData preserves every ungrouped attribute", () => {
  const attributes = [
    attribute("missing"),
    attribute("null", null),
    attribute("empty", ""),
    attribute("blank", "   "),
  ];

  const result = buildProductAttributeListData(attributes);

  expect(result.groupedAttributes).toEqual([]);
  expect(result.ungroupedAttributes).toEqual(attributes);
});

test("buildProductAttributeListData trims labels and groups case-insensitively", () => {
  const first = attribute("refresh-rate", "  Performance  ");
  const second = attribute("response-time", "performance");
  const third = attribute("hdr", "PERFORMANCE");

  expect(buildProductAttributeListData([first, second, third])).toEqual({
    groupedAttributes: [
      {
        label: "Performance",
        attributes: [first, second, third],
      },
    ],
    ungroupedAttributes: [],
  });
});

test("buildProductAttributeListData preserves first-seen group and attribute order", () => {
  const capabilityFirst = attribute("hdr", "Capabilities");
  const performanceFirst = attribute("refresh-rate", "Performance");
  const capabilitySecond = attribute("local-dimming", "capabilities");
  const performanceSecond = attribute("response-time", "performance");

  expect(
    buildProductAttributeListData([
      capabilityFirst,
      performanceFirst,
      capabilitySecond,
      performanceSecond,
    ]).groupedAttributes,
  ).toEqual([
    {
      label: "Capabilities",
      attributes: [capabilityFirst, capabilitySecond],
    },
    {
      label: "Performance",
      attributes: [performanceFirst, performanceSecond],
    },
  ]);
});

test("buildProductAttributeListData retains ungrouped attributes as an ordered tail", () => {
  const ungroupedFirst = attribute("release-year", null);
  const grouped = attribute("refresh-rate", "Performance");
  const ungroupedSecond = attribute("model", " ");

  const result = buildProductAttributeListData([ungroupedFirst, grouped, ungroupedSecond]);

  expect(result.groupedAttributes).toEqual([{ label: "Performance", attributes: [grouped] }]);
  expect(result.ungroupedAttributes).toEqual([ungroupedFirst, ungroupedSecond]);
});
