const BASE_36_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
const BASE_62_DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CSS_IDENTIFIER_CHARACTER = "A-Za-z0-9_-";

export type StylexRewriteResult = {
  changed: boolean;
  code: string;
};

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function atomicClassPattern(classNamePrefix: string): RegExp {
  const prefix = escapeRegularExpression(classNamePrefix);

  return new RegExp(
    `(^|[^${CSS_IDENTIFIER_CHARACTER}])(${prefix}(?:0|[1-9a-z][0-9a-z]*))(?![${CSS_IDENTIFIER_CHARACTER}])`,
    "g",
  );
}

function parseBase36(value: string): bigint {
  let result = 0n;

  for (const character of value) {
    result = result * 36n + BigInt(BASE_36_DIGITS.indexOf(character.toLowerCase()));
  }

  return result;
}

function encodeBase62(value: bigint): string {
  if (value === 0n) {
    return BASE_62_DIGITS[0]!;
  }

  let remainder = value;
  let result = "";

  while (remainder > 0n) {
    result = BASE_62_DIGITS[Number(remainder % 62n)]! + result;
    remainder /= 62n;
  }

  return result;
}

export function mangleStylexClassName(className: string, classNamePrefix: string): string | null {
  if (!classNamePrefix || !className.startsWith(classNamePrefix)) {
    return null;
  }

  const hash = className.slice(classNamePrefix.length);

  if (!/^(?:0|[1-9a-z][0-9a-z]*)$/.test(hash)) {
    return null;
  }

  return `_${encodeBase62(parseBase36(hash))}`;
}

export function findStylexClassNames(source: string, classNamePrefix: string): Set<string> {
  const classNames = new Set<string>();

  if (!classNamePrefix) {
    return classNames;
  }

  for (const match of source.matchAll(atomicClassPattern(classNamePrefix))) {
    classNames.add(match[2]!);
  }

  return classNames;
}

export function rewriteStylexClassNames(
  source: string,
  classNamePrefix: string,
): StylexRewriteResult {
  if (!classNamePrefix) {
    return { changed: false, code: source };
  }

  let changed = false;
  const code = source.replace(
    atomicClassPattern(classNamePrefix),
    (match, boundary: string, className: string) => {
      const mangled = mangleStylexClassName(className, classNamePrefix);

      if (mangled === null) {
        return match;
      }

      changed = true;
      return `${boundary}${mangled}`;
    },
  );

  return { changed, code };
}
