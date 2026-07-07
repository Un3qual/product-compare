import { canComparePriceCurrencies, decimalStringToNumber } from "../../src/routes/decimal-values";

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
