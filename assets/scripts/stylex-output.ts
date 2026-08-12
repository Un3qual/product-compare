const SHORT_CLASS_NAME_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const stylexClassSelectorPattern = /\.([_A-Za-z][_A-Za-z0-9-]*)(?=[{:[.#])/g;
const mangledClassSelectorPattern = /\.([a-z]+)(?=[{:[.#])/g;
const stylexRulePattern = /\b(?:ltr|rtl)\s*:\s*(?:`([^`]*)`|"((?:\\.|[^"\\])*)")/g;
const stylexHashPattern = /^(?:0|[1-9a-z][0-9a-z]*)$/;

export function findStylexRules(source: string): Set<string> {
  const rules = new Set<string>();

  for (const match of source.matchAll(stylexRulePattern)) {
    const templateRule = match[1];
    const quotedRule = match[2];

    if (templateRule !== undefined) {
      rules.add(templateRule);
    } else if (quotedRule !== undefined) {
      rules.add(JSON.parse(`"${quotedRule}"`));
    }
  }

  return rules;
}

export function findGeneratedStylexClassNames(
  source: string,
  classNamePrefix: string,
): Set<string> {
  const classNames = new Set<string>();

  for (const rule of findStylexRules(source)) {
    for (const match of rule.matchAll(stylexClassSelectorPattern)) {
      const className = match[1];
      if (className && isGeneratedStylexClassName(className, classNamePrefix)) {
        classNames.add(className);
      }
    }
  }

  return classNames;
}

export function findMangledStylexClassNames(source: string): Set<string> {
  const classNames = new Set<string>();

  for (const rule of findStylexRules(source)) {
    for (const match of rule.matchAll(mangledClassSelectorPattern)) {
      const className = match[1];
      if (className) {
        classNames.add(className);
      }
    }
  }

  return classNames;
}

export function shortStylexClassName(index: number): string {
  if (!Number.isSafeInteger(index) || index < 0) {
    throw new RangeError("StyleX class-name sequence index must be a non-negative integer");
  }

  let remainder = index;
  let result = "";

  do {
    result =
      SHORT_CLASS_NAME_ALPHABET.charAt(remainder % SHORT_CLASS_NAME_ALPHABET.length) + result;
    remainder = Math.floor(remainder / SHORT_CLASS_NAME_ALPHABET.length) - 1;
  } while (remainder >= 0);

  return result;
}

export function isGeneratedStylexClassName(className: string, classNamePrefix: string): boolean {
  return (
    className.startsWith(classNamePrefix) &&
    stylexHashPattern.test(className.slice(classNamePrefix.length))
  );
}
