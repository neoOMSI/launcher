export const LONG_LIST = 8;

export const needle = (query: string) => query.trim().toLowerCase();

export function filterBy<T>(
  items: readonly T[],
  query: string,
  fields: (item: T) => readonly (string | null | undefined)[],
): T[] {
  const q = needle(query);
  if (!q) return [...items];
  return items.filter((item) => fields(item).some((f) => f?.toLowerCase().includes(q)));
}
