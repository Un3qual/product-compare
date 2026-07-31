import {
  canComparePriceCurrencies,
  compareDecimalStrings,
  decimalStringToNumber,
} from "../../src/routes/decimal-values";

test("decimalStringToNumber normalizes finite decimal values", () => {
  expect(decimalStringToNumber(42)).toBe(42);
  expect(decimalStringToNumber("42")).toBe(42);
  expect(decimalStringToNumber(" 42.50 ")).toBe(42.5);
  expect(decimalStringToNumber(".75")).toBe(0.75);
});

test("decimalStringToNumber normalizes finite scientific decimal strings", () => {
  expect(decimalStringToNumber("1.23E+3")).toBe(1230);
  expect(decimalStringToNumber("1e3")).toBe(1000);
  expect(decimalStringToNumber("-4.5e-2")).toBeCloseTo(-0.045);
});

test("decimalStringToNumber rejects blank and non-decimal values", () => {
  expect(decimalStringToNumber("")).toBeNull();
  expect(decimalStringToNumber(" ")).toBeNull();
  expect(decimalStringToNumber(null)).toBeNull();
  expect(decimalStringToNumber()).toBeNull();
  expect(decimalStringToNumber("not-a-price")).toBeNull();
  expect(decimalStringToNumber("123abc")).toBeNull();
  expect(decimalStringToNumber("1e")).toBeNull();
  expect(decimalStringToNumber("1e+")).toBeNull();
  expect(decimalStringToNumber("e3")).toBeNull();
  expect(decimalStringToNumber("0x10")).toBeNull();
  expect(decimalStringToNumber("Infinity")).toBeNull();
});

test("canComparePriceCurrencies allows price comparisons only within one currency bucket", () => {
  expect(canComparePriceCurrencies([])).toBe(true);
  expect(canComparePriceCurrencies(["USD"])).toBe(true);
  expect(canComparePriceCurrencies(["USD", "USD"])).toBe(true);
  expect(canComparePriceCurrencies(["USD", "EUR"])).toBe(false);
  expect(canComparePriceCurrencies(["USD", null])).toBe(false);
});

test.each([
  ["9007199254740993.00", "9007199254740992.00", 1],
  ["1E+3", "1000", 0],
  ["1E-20", "0.00000000000000000001", 0],
  ["0", "1E-20", -1],
  ["1E-20", "0", 1],
  [".75", "0.7500", 0],
  ["-4.5e-2", "-0.04", -1],
  ["-0", "+0.000", 0],
] as const)("compareDecimalStrings compares %s and %s exactly", (left, right, expected) => {
  expect(compareDecimalStrings(left, right)).toBe(expected);
});

test("compareDecimalStrings rejects malformed or unsafe decimal strings", () => {
  expect(compareDecimalStrings("not-a-price", "1")).toBeNull();
  expect(compareDecimalStrings("1", "Infinity")).toBeNull();
  expect(compareDecimalStrings("1e999999999999999999999", "1")).toBeNull();
});
