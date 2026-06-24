import React, { useState } from 'react';

// ============================================================
// Pagination — کامپوننت صفحه‌بندی با نمایش هوشمند و پرش به صفحه
// ============================================================

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

/** Convert English digits to Persian */
function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

/** Convert Persian digits to English */
function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.toString().replace(/[۰-۹]/g, function (d) {
    return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  });
}

export default function Pagination({ currentPage, totalItems, perPage, onPageChange }: PaginationProps) {
  const [jumpInput, setJumpInput] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  if (totalPages <= 1) return null;

  /**
   * Build a smart list of page numbers to display.
   * - Always show first and last pages.
   * - Show up to 5 pages around the current page.
   * - Insert ellipsis (...) when there are gaps.
   */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7; // max page buttons before truncation

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      // Calculate window around current page
      const windowStart = Math.max(2, safePage - 2);
      const windowEnd = Math.min(totalPages - 1, safePage + 2);

      // Ellipsis after first page if needed
      if (windowStart > 2) pages.push('ellipsis');

      // Add window pages
      for (let i = windowStart; i <= windowEnd; i++) pages.push(i);

      // Ellipsis before last page if needed
      if (windowEnd < totalPages - 1) pages.push('ellipsis');

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(toEnglishDigits(jumpInput), 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpInput('');
    }
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-1.5 pt-4 border-t border-gray-50 dark:border-gray-850">
      {/* Previous button */}
      <button
        disabled={safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
        className="h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-colors text-xs"
        title="صفحه قبل"
      >
        &gt;
      </button>

      {/* Page numbers */}
      {pageNumbers.map((page, idx) =>
        page === 'ellipsis' ? (
          <span
            key={`e-${idx}`}
            className="h-8 w-8 flex items-center justify-center text-xs text-gray-400 dark:text-gray-600 select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`h-8 w-8 rounded-lg border font-bold transition-all cursor-pointer flex items-center justify-center text-xs ${
              page === safePage
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-55'
            }`}
          >
            {toPersianDigits(page)}
          </button>
        )
      )}

      {/* Next button */}
      <button
        disabled={safePage >= totalPages}
        onClick={() => onPageChange(safePage + 1)}
        className="h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-colors text-xs"
        title="صفحه بعد"
      >
        &lt;
      </button>

      {/* Jump to page input */}
      <form onSubmit={handleJump} className="flex items-center gap-1.5 mr-3 pr-3 border-r border-gray-200 dark:border-gray-700">
        <span className="text-[10px] text-gray-400 hidden sm:inline">رفتن به</span>
        <input
          type="text"
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value)}
          placeholder="صفحه"
          className="w-14 h-8 text-center text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          inputMode="numeric"
        />
        <button
          type="submit"
          className="h-8 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold cursor-pointer transition-all disabled:opacity-40"
          disabled={!jumpInput.trim()}
        >
          برو
        </button>
      </form>

      {/* Info text */}
      <span className="text-[10px] text-gray-400 mr-2 hidden sm:inline">
        {toPersianDigits(totalPages)} صفحه
      </span>
    </div>
  );
}
