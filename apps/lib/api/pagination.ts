export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export function toCursorSearchParams(pagination?: CursorPaginationParams): URLSearchParams {
  const params = new URLSearchParams();

  if (!pagination) {
    return params;
  }

  if (pagination.cursor) {
    params.set("cursor", pagination.cursor);
  }

  if (typeof pagination.limit === "number") {
    params.set("limit", String(pagination.limit));
  }

  return params;
}
