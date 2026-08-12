const SHORT_CLASS_NAME_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const CSS_IDENTIFIER_CHARACTER = "A-Za-z0-9_-";
const mangledClassSelectorPattern = /\.([a-z]+)(?=[{:[.#])/g;
const stylexRulePattern = /\b(?:ltr|rtl)\s*:\s*(?:`([^`]*)`|"((?:\\.|[^"\\])*)")/g;

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findStylexRules(source: string): Set<string> {
  const rules = new Set<string>();

  for (const match of source.matchAll(stylexRulePattern)) {
    rules.add(match[1] ?? JSON.parse(`"${match[2]}"`));
  }

  return rules;
}

export function findGeneratedStylexClassNames(
  source: string,
  classNamePrefix: string,
): Set<string> {
  const prefix = escapeRegularExpression(classNamePrefix);
  const selectorPattern = new RegExp(
    `\\.(${prefix}(?:0|[1-9a-z][0-9a-z]*))(?![${CSS_IDENTIFIER_CHARACTER}])`,
    "g",
  );
  const classNames = new Set<string>();

  for (const rule of findStylexRules(source)) {
    for (const match of rule.matchAll(selectorPattern)) {
      classNames.add(match[1]!);
    }
  }

  return classNames;
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

export function shortStylexClassName(index: number): string {
  let remainder = index;
  let result = "";

  do {
    result = SHORT_CLASS_NAME_ALPHABET[remainder % SHORT_CLASS_NAME_ALPHABET.length]! + result;
    remainder = Math.floor(remainder / SHORT_CLASS_NAME_ALPHABET.length) - 1;
  } while (remainder >= 0);

  return result;
}
