export type PageQuery = { page: number; limit: number };

export type Page<T> = { items: T[]; total: number; page: number; limit: number };

export function pageArgs(query: PageQuery): { skip: number; take: number } {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}

export function toPage<T>(items: T[], total: number, query: PageQuery): Page<T> {
  return { items, total, page: query.page, limit: query.limit };
}

export function slicePage<T>(all: T[], query: PageQuery): Page<T> {
  const { skip, take } = pageArgs(query);
  return toPage(all.slice(skip, skip + take), all.length, query);
}
