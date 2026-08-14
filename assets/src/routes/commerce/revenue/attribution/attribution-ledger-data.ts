export function selectRecentLoadedConversion<T extends { readonly reportedAt: string }>(
  clicks: readonly { readonly matchedConversions: readonly T[] }[],
) {
  let recent: T | null = null;

  for (const click of clicks) {
    for (const conversion of click.matchedConversions) {
      if (recent === null || conversion.reportedAt > recent.reportedAt) {
        recent = conversion;
      }
    }
  }

  return recent;
}

export function buildAttributionOutcome<T>(conversions: readonly T[]) {
  if (conversions.length === 0) {
    return { kind: "none" } as const;
  }

  if (conversions.length === 1) {
    return { kind: "single", conversion: conversions[0] } as const;
  }

  return { kind: "multiple", count: conversions.length } as const;
}
