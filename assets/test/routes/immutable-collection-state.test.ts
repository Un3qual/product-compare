import {
  addSetValue,
  removeMapValue,
  removeSetValue,
  upsertMapValue,
} from "../../src/routes/immutable-collection-state";

test("upsertMapValue appends a new key without changing the source map", () => {
  const source = new Map([
    ["first", 1],
    ["second", 2],
  ]);

  const result = upsertMapValue(source, "third", 3);

  expect(result).not.toBe(source);
  expect([...result]).toEqual([
    ["first", 1],
    ["second", 2],
    ["third", 3],
  ]);
  expect([...source]).toEqual([
    ["first", 1],
    ["second", 2],
  ]);
});

test("upsertMapValue replaces a present key in place and always returns a new map", () => {
  const sameValue = { state: "same" };
  const source = new Map([
    ["first", sameValue],
    ["second", { state: "old" }],
    ["third", { state: "last" }],
  ]);

  const result = upsertMapValue(source, "second", sameValue);

  expect(result).not.toBe(source);
  expect([...result.keys()]).toEqual(["first", "second", "third"]);
  expect(result.get("second")).toBe(sameValue);
  expect(source.get("second")).toEqual({ state: "old" });
});

test("removeMapValue preserves source identity and ordering when the key is absent", () => {
  const source = new Map([
    ["first", 1],
    ["second", 2],
  ]);

  const result = removeMapValue(source, "missing");

  expect(result).toBe(source);
  expect([...result]).toEqual([
    ["first", 1],
    ["second", 2],
  ]);
});

test("removeMapValue removes a present key without changing the source map", () => {
  const source = new Map([
    ["first", 1],
    ["second", 2],
    ["third", 3],
  ]);

  const result = removeMapValue(source, "second");

  expect(result).not.toBe(source);
  expect([...result]).toEqual([
    ["first", 1],
    ["third", 3],
  ]);
  expect([...source]).toEqual([
    ["first", 1],
    ["second", 2],
    ["third", 3],
  ]);
});

test("addSetValue appends a new value without changing the source set", () => {
  const source = new Set(["first", "second"]);

  const result = addSetValue(source, "third");

  expect(result).not.toBe(source);
  expect([...result]).toEqual(["first", "second", "third"]);
  expect([...source]).toEqual(["first", "second"]);
});

test("addSetValue preserves source identity and ordering for an existing value", () => {
  const source = new Set(["first", "second"]);

  const result = addSetValue(source, "second");

  expect(result).toBe(source);
  expect([...result]).toEqual(["first", "second"]);
});

test("removeSetValue preserves source identity and ordering when the value is absent", () => {
  const source = new Set(["first", "second"]);

  const result = removeSetValue(source, "missing");

  expect(result).toBe(source);
  expect([...result]).toEqual(["first", "second"]);
});

test("removeSetValue removes a present value without changing the source set", () => {
  const source = new Set(["first", "second", "third"]);

  const result = removeSetValue(source, "second");

  expect(result).not.toBe(source);
  expect([...result]).toEqual(["first", "third"]);
  expect([...source]).toEqual(["first", "second", "third"]);
});
