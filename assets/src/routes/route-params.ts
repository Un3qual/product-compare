export function isCanonicalSlug(value: string) {
  const segments = value.split("-");

  return segments.length > 0 && segments.every((segment) => {
    if (segment === "") return false;

    return Array.from(segment).every((character) => {
      const codePoint = character.codePointAt(0);

      return codePoint !== undefined && (
        (codePoint >= 48 && codePoint <= 57) ||
        (codePoint >= 97 && codePoint <= 122)
      );
    });
  });
}
