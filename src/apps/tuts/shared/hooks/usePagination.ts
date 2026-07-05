// ============================================================
// usePagination — Pagination helper
// ============================================================

import { useState, useCallback } from 'react';

export function usePagination(perPage: number = 12) {
  const [page, setPage] = useState(1);

  const paginated = useCallback(<T,>(items: T[]): T[] => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [page, perPage]);

  const totalPages = useCallback((total: number) => Math.max(1, Math.ceil(total / perPage)), [perPage]);

  const goToPage = useCallback((p: number) => setPage(p), []);

  return { page, setPage, paginated, totalPages, goToPage, perPage };
}
