import { decimalStringToNumber } from "../../src/routes/decimal-values";

test("decimalStringToNumber normalizes finite decimal values", () => {
  expect(decimalStringToNumber(42)).toBe(42);
  expect(decimalStringToNumber("42")).toBe(42);
  expect(decimalStringToNumber(" 42.50 ")).toBe(42.5);
});

test("decimalStringToNumber rejects blank and non-decimal values", () => {
  expect(decimalStringToNumber("")).toBeNull();
  expect(decimalStringToNumber(" ")).toBeNull();
  expect(decimalStringToNumber(null)).toBeNull();
  expect(decimalStringToNumber(undefined)).toBeNull();
  expect(decimalStringToNumber("not-a-price")).toBeNull();
  expect(decimalStringToNumber("123abc")).toBeNull();
});
