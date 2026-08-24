export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Parse ?page= / ?per= searchParams safely (server-side). */
export function parsePagination(sp: { page?: string; per?: string }): {
  page: number;
  perPage: number;
  skip: number;
} {
  const perRaw = Number(sp.per);
  const perPage = (PAGE_SIZE_OPTIONS as readonly number[]).includes(perRaw)
    ? perRaw
    : DEFAULT_PAGE_SIZE;
  const pageRaw = Number(sp.page);
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  return { page, perPage, skip: (page - 1) * perPage };
}
