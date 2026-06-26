/** Parse "S, M, L" or "Black, White" into a deduplicated trimmed array. */
export function parseCommaSeparatedList(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}
