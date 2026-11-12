export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListResponse<T> {
  items: T[];
  meta: PageMeta;
}
