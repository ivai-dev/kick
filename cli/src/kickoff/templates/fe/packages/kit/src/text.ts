/** Lower-case and strip diacritics: "Đơn hàng" -> "don hang". */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
}

/** Every whitespace-separated term of `query` occurs in `text` (diacritic-insensitive). */
export function matchesQuery(text: string, query: string): boolean {
  const haystack = foldText(text);
  return foldText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
