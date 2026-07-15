import {
  selectBrowseProductSpecificationHighlights,
  type BrowseProductSpecificationHighlight
} from "../../../src/routes/catalog/browse-product-list-data";

function highlight(
  code: string,
  sortOrder?: number | null
): BrowseProductSpecificationHighlight {
  return {
    code,
    displayName: code,
    sortOrder,
    valueText: `${code} value`
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
    third
  ]);
});

test("selectBrowseProductSpecificationHighlights limits results to three rows", () => {
  const highlights = [
    highlight("one", 1),
    highlight("two", 2),
    highlight("three", 3),
    highlight("four", 4)
  ];

  expect(selectBrowseProductSpecificationHighlights(highlights)).toEqual(highlights.slice(0, 3));
});

test("selectBrowseProductSpecificationHighlights puts unspecified orders after finite orders", () => {
  const unspecified = highlight("unspecified");
  const nullOrder = highlight("null", null);
  const infiniteOrder = highlight("infinite", Number.POSITIVE_INFINITY);
  const explicit = highlight("explicit", 10);

  expect(
    selectBrowseProductSpecificationHighlights([unspecified, nullOrder, infiniteOrder, explicit])
  ).toEqual([explicit, unspecified, nullOrder]);
});

test("selectBrowseProductSpecificationHighlights preserves source order for equal orders", () => {
  const first = highlight("first", 10);
  const second = highlight("second", 10);
  const third = highlight("third", 10);

  expect(selectBrowseProductSpecificationHighlights([first, second, third])).toEqual([
    first,
    second,
    third
  ]);
});

test("selectBrowseProductSpecificationHighlights leaves the input unchanged", () => {
  const first = highlight("first", 20);
  const second = highlight("second", 10);
  const attributes = [first, second];
  const beforeSelection = [...attributes];

  selectBrowseProductSpecificationHighlights(attributes);

  expect(attributes).toEqual(beforeSelection);
});
