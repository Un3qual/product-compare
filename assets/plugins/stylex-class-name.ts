const SHORT_CLASS_NAME_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
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

const mangledClassSelectorPattern = /\.([a-z]+)(?=[{:[.#])/g;
const stylexRulePattern = /\b(?:ltr|rtl)\s*:\s*(?:`([^`]*)`|"((?:\\.|[^"\\])*)")/g;

function isStylexConstKey(source: string, classNameOffset: number): boolean {
  return /\bconstKey\s*:\s*["'`]$/.test(
    source.slice(Math.max(0, classNameOffset - 32), classNameOffset),
  );
}

export function shortStylexClassName(index: number): string {
  let remainder = index;
  let result = "";

  do {
    result = SHORT_CLASS_NAME_ALPHABET[remainder % SHORT_CLASS_NAME_ALPHABET.length]! + result;
    remainder = Math.floor(remainder / SHORT_CLASS_NAME_ALPHABET.length) - 1;
  } while (remainder >= 0);

  return result;
}

export function mangleStylexClassName(
  className: string,
  classNamePrefix: string,
  classNames: Map<string, string>,
): string | null {
  if (!classNamePrefix || !className.startsWith(classNamePrefix)) {
    return null;
  }

  const hash = className.slice(classNamePrefix.length);

  if (!/^(?:0|[1-9a-z][0-9a-z]*)$/.test(hash)) {
    return null;
  }

  const existing = classNames.get(className);

  if (existing !== undefined) {
    return existing;
  }

  const mangled = shortStylexClassName(classNames.size);
  classNames.set(className, mangled);
  return mangled;
}

export function findStylexClassNames(source: string, classNamePrefix: string): Set<string> {
  const classNames = new Set<string>();

  if (!classNamePrefix) {
    return classNames;
  }

  for (const match of source.matchAll(atomicClassPattern(classNamePrefix))) {
    const classNameOffset = match.index + match[1]!.length;

    if (!isStylexConstKey(source, classNameOffset)) {
      classNames.add(match[2]!);
    }
  }

  return classNames;
}

export function findStylexRules(source: string): Set<string> {
  const rules = new Set<string>();

  for (const match of source.matchAll(stylexRulePattern)) {
    rules.add(match[1] ?? JSON.parse(`"${match[2]}"`));
  }

  return rules;
}

export function findMangledStylexClassNames(source: string): Set<string> {
  const classNames = new Set<string>();

  for (const rule of findStylexRules(source)) {
    for (const match of rule.matchAll(mangledClassSelectorPattern)) {
      classNames.add(match[1]!);
    }
  }

  return classNames;
}

export function rewriteStylexClassNames(
  source: string,
  classNamePrefix: string,
  classNames: Map<string, string>,
): StylexRewriteResult {
  if (!classNamePrefix) {
    return { changed: false, code: source };
  }

  let changed = false;
  const code = source.replace(
    atomicClassPattern(classNamePrefix),
    (match, boundary: string, className: string, offset: number) => {
      const classNameOffset = offset + boundary.length;

      if (isStylexConstKey(source, classNameOffset)) {
        return match;
      }

      const mangled = mangleStylexClassName(className, classNamePrefix, classNames);

      if (mangled === null) {
        return match;
      }

      changed = true;
      return `${boundary}${mangled}`;
    },
  );

  return { changed, code };
}
