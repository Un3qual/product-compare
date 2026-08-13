import {
  selectBrowseProductSpecificationHighlights,
  type BrowseProductSpecificationHighlight,
} from "../../../../src/routes/catalog/results/browse-product-list-data";

function highlight(
  code: string,
  sortOrder: number | null = null,
): BrowseProductSpecificationHighlight {
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

test("selectBrowseProductSpecificationHighlights keeps sorted orders ahead of null orders", () => {
  const firstNullOrder = highlight("first-null");
  const nullOrder = highlight("null", null);
  const maximumValue = highlight("maximum-value", Number.MAX_VALUE);
  const maximumSafeInteger = highlight("maximum-safe-integer", Number.MAX_SAFE_INTEGER);

  expect(
    selectBrowseProductSpecificationHighlights([
      firstNullOrder,
      nullOrder,
      maximumValue,
      maximumSafeInteger,
    ]),
  ).toEqual([maximumSafeInteger, maximumValue, firstNullOrder]);
});

test("selectBrowseProductSpecificationHighlights keeps null orders in source order at the bounded tail", () => {
  const first = highlight("first");
  const second = highlight("second");
  const third = highlight("third");
  const finite = highlight("finite", 10);

  expect(selectBrowseProductSpecificationHighlights([first, second, third, finite])).toEqual([
    finite,
    first,
    second,
  ]);

  expect(selectBrowseProductSpecificationHighlights([finite, third, first, second])).toEqual([
    finite,
    third,
    first,
  ]);
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
