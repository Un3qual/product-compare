import {
  catalogPathForSpecSelections,
  readSpecFilterDraft,
  writeSpecFilterDraft,
  type SpecFilterSelection,
} from "../../../../src/routes/products/specifications/spec-filter-selection";

const selections: SpecFilterSelection[] = [
  {
    attributeId: "attribute-panel",
    code: "panel-technology",
    displayName: "Panel technology",
    kind: "enum",
    mode: "same",
    value: "enum-oled",
  },
  {
    attributeId: "attribute-refresh",
    code: "refresh-rate",
    displayName: "Refresh rate",
    kind: "numeric",
    mode: "at_least",
    unitSymbol: "Hz",
    value: "120",
  },
];

beforeEach(() => sessionStorage.clear());

test("persists a versioned multi-spec draft only for its product", () => {
  writeSpecFilterDraft(sessionStorage, "product-a", selections);

  expect(readSpecFilterDraft(sessionStorage, "product-a")).toEqual(selections);
  expect(readSpecFilterDraft(sessionStorage, "product-b")).toEqual([]);
});

test("recovers from invalid browser storage at the storage boundary", () => {
  writeSpecFilterDraft(sessionStorage, "product-a", selections);
  const storageKey = sessionStorage.key(0);

  expect(storageKey).not.toBeNull();
  if (storageKey) sessionStorage.setItem(storageKey, '{"version":1,"selections":"invalid"}');

  expect(readSpecFilterDraft(sessionStorage, "product-a")).toEqual([]);
});

test("falls back when browser storage reads or writes throw", () => {
  const unavailableStorage = new Proxy(sessionStorage, {
    get(target, property) {
      if (property === "getItem" || property === "setItem") {
        return () => {
          throw new DOMException("Storage is unavailable", "SecurityError");
        };
      }

      return Reflect.get(target, property, target);
    },
  });

  expect(readSpecFilterDraft(unavailableStorage, "product-a")).toEqual([]);
  expect(() => writeSpecFilterDraft(unavailableStorage, "product-a", selections)).not.toThrow();
});

test("maps multiple exact and numeric modes into one shareable catalog URL", () => {
  const path = catalogPathForSpecSelections(
    [
      ...selections,
      {
        attributeId: "attribute-depth",
        code: "depth",
        displayName: "Depth",
        kind: "numeric",
        mode: "at_most",
        unitSymbol: "mm",
        value: "42.5",
      },
      {
        attributeId: "attribute-hdr",
        code: "hdr",
        displayName: "HDR",
        kind: "boolean",
        mode: "same",
        value: true,
      },
    ],
    ["first-product", "second-product"],
  );
  const url = new URL(path, "https://app.example.com");

  expect(url.pathname).toBe("/products");
  expect(url.searchParams.get("enum.attribute-panel")).toBe("enum-oled");
  expect(url.searchParams.get("numeric.attribute-refresh.min")).toBe("120");
  expect(url.searchParams.has("numeric.attribute-refresh.max")).toBe(false);
  expect(url.searchParams.get("numeric.attribute-depth.max")).toBe("42.5");
  expect(url.searchParams.get("boolean.attribute-hdr")).toBe("true");
  expect(url.searchParams.getAll("slug")).toEqual(["first-product", "second-product"]);
});

test("maps Same numeric selection to both inclusive bounds", () => {
  const path = catalogPathForSpecSelections(
    [
      {
        attributeId: "attribute-weight",
        code: "weight",
        displayName: "Weight",
        kind: "numeric",
        mode: "same",
        unitSymbol: "kg",
        value: "2.5",
      },
    ],
    [],
  );
  const search = new URL(path, "https://app.example.com").searchParams;

  expect(search.get("numeric.attribute-weight.min")).toBe("2.5");
  expect(search.get("numeric.attribute-weight.max")).toBe("2.5");
});
