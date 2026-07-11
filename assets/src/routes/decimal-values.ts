const DECIMAL_STRING_PATTERN = /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;

type ExactDecimalParts = {
  digits: string;
  magnitude: number;
  sign: -1 | 1;
};

export function decimalStringToNumber(value?: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  if (!DECIMAL_STRING_PATTERN.test(trimmedValue)) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function canComparePriceCurrencies(currencies: ReadonlyArray<string | null>) {
  return new Set(currencies).size <= 1;
}

export function compareDecimalStrings(left: string, right: string): -1 | 0 | 1 | null {
  const leftParts = exactDecimalParts(left);
  const rightParts = exactDecimalParts(right);

  if (!leftParts || !rightParts) {
    return null;
  }

  if (leftParts.sign !== rightParts.sign) {
    return leftParts.sign < rightParts.sign ? -1 : 1;
  }

  const absoluteComparison = compareAbsoluteExactDecimals(leftParts, rightParts);

  return leftParts.sign === -1 ? invertComparison(absoluteComparison) : absoluteComparison;
}

function exactDecimalParts(value: string): ExactDecimalParts | null {
  const trimmedValue = value.trim();

  if (!DECIMAL_STRING_PATTERN.test(trimmedValue)) {
    return null;
  }

  const sign: -1 | 1 = trimmedValue.startsWith("-") ? -1 : 1;
  const unsignedValue =
    trimmedValue.startsWith("-") || trimmedValue.startsWith("+")
      ? trimmedValue.slice(1)
      : trimmedValue;
  const [coefficient, rawExponent = "0"] = unsignedValue.split(/[eE]/);
  const exponent = Number.parseInt(rawExponent, 10);

  if (!Number.isSafeInteger(exponent)) {
    return null;
  }

  const [rawInteger, rawFraction = ""] = coefficient.split(".");
  const digits = `${rawInteger}${rawFraction}`;
  const firstSignificantIndex = digits.search(/[1-9]/);

  if (firstSignificantIndex === -1) {
    return { digits: "0", magnitude: 1, sign: 1 };
  }

  const magnitude = rawInteger.length + exponent - firstSignificantIndex;

  if (!Number.isSafeInteger(magnitude)) {
    return null;
  }

  return {
    digits: digits.slice(firstSignificantIndex).replace(/0+$/, ""),
    magnitude,
    sign
  };
}

function compareAbsoluteExactDecimals(
  left: ExactDecimalParts,
  right: ExactDecimalParts
): -1 | 0 | 1 {
  if (left.digits === "0" || right.digits === "0") {
    return left.digits === right.digits ? 0 : left.digits === "0" ? -1 : 1;
  }

  if (left.magnitude !== right.magnitude) {
    return left.magnitude < right.magnitude ? -1 : 1;
  }

  const digitLength = Math.max(left.digits.length, right.digits.length);
  const leftDigits = left.digits.padEnd(digitLength, "0");
  const rightDigits = right.digits.padEnd(digitLength, "0");

  return leftDigits === rightDigits ? 0 : leftDigits < rightDigits ? -1 : 1;
}

function invertComparison(comparison: -1 | 0 | 1): -1 | 0 | 1 {
  return comparison === 0 ? 0 : comparison === -1 ? 1 : -1;
}
