import {
  selectBrowseProductSpecificationHighlights,
  type BrowseProductSpecificationHighlight,
} from "../../../../src/routes/catalog/results/browse-product-list-data";

function highlight(code: string, sortOrder?: number | null): BrowseProductSpecificationHighlight {
  return {
    code,
    displayName: code,
    sortOrder,
    valueText: `${code} value`,
  };
}

test("selectBrowseProductSpecificationHighlights returns no highlights for empty input", () => {
  expect(selectBrowseProductSpecificationHighlights([])).toEqual([]);
});

test("selectBrowseProductSpecificationHighlights orders explicit finite sort orders ascending", () => {
  const third = highlight("third", 30);
  const first = highlight("first", 10);
  const second = highlight("second", 20);

  expect(selectBrowseProductSpecificationHighlights([third, first, second])).toEqual([
    first,
    second,
    third,
  ]);
});

test("selectBrowseProductSpecificationHighlights limits results to three rows", () => {
  const highlights = [
    highlight("one", 1),
    highlight("two", 2),
    highlight("three", 3),
    highlight("four", 4),
  ];

  expect(selectBrowseProductSpecificationHighlights(highlights)).toEqual(highlights.slice(0, 3));
});

test("selectBrowseProductSpecificationHighlights keeps finite extreme orders ahead of nullish and unusable orders", () => {
  const undefinedOrder = highlight("undefined");
  const nullOrder = highlight("null", null);
  const notANumber = highlight("nan", Number.NaN);
  const positiveInfinity = highlight("positive-infinity", Number.POSITIVE_INFINITY);
  const negativeInfinity = highlight("negative-infinity", Number.NEGATIVE_INFINITY);
  const maximumValue = highlight("maximum-value", Number.MAX_VALUE);
  const maximumSafeInteger = highlight("maximum-safe-integer", Number.MAX_SAFE_INTEGER);

  expect(
    selectBrowseProductSpecificationHighlights([
      undefinedOrder,
      nullOrder,
      notANumber,
      positiveInfinity,
      negativeInfinity,
      maximumValue,
      maximumSafeInteger,
    ]),
  ).toEqual([maximumSafeInteger, maximumValue, undefinedOrder]);
});

test("selectBrowseProductSpecificationHighlights keeps unusable orders in source order at the bounded tail", () => {
  const notANumber = highlight("nan", Number.NaN);
  const positiveInfinity = highlight("positive-infinity", Number.POSITIVE_INFINITY);
  const negativeInfinity = highlight("negative-infinity", Number.NEGATIVE_INFINITY);
  const finite = highlight("finite", 10);

  expect(
    selectBrowseProductSpecificationHighlights([
      notANumber,
      positiveInfinity,
      negativeInfinity,
      finite,
    ]),
  ).toEqual([finite, notANumber, positiveInfinity]);

  expect(
    selectBrowseProductSpecificationHighlights([
      finite,
      negativeInfinity,
      notANumber,
      positiveInfinity,
    ]),
  ).toEqual([finite, negativeInfinity, notANumber]);
});

test("selectBrowseProductSpecificationHighlights preserves source order for equal orders", () => {
  const first = highlight("first", 10);
  const second = highlight("second", 10);
  const third = highlight("third", 10);

  expect(selectBrowseProductSpecificationHighlights([first, second, third])).toEqual([
    first,
    second,
    third,
  ]);
});

test("selectBrowseProductSpecificationHighlights leaves the input unchanged", () => {
  const attributes = Object.freeze([
    Object.freeze(highlight("first", 20)),
    Object.freeze(highlight("second", 10)),
  ]);
  const beforeSelection = [
    {
      code: "first",
      displayName: "first",
      sortOrder: 20,
      valueText: "first value",
    },
    {
      code: "second",
      displayName: "second",
      sortOrder: 10,
      valueText: "second value",
    },
  ];

  expect(() => selectBrowseProductSpecificationHighlights(attributes)).not.toThrow();

  expect(attributes).toEqual(beforeSelection);
});
