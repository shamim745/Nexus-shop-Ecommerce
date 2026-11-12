import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageMeta } from "~/types";

export function Pagination({
  meta,
  onChange,
}: {
  meta: PageMeta;
  onChange: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  const pages = buildPages(meta.page, meta.totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 pt-6" aria-label="Pagination">
      <button
        type="button"
        className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        disabled={meta.page <= 1}
        onClick={() => onChange(meta.page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === meta.page ? "page" : undefined}
            className={`min-w-9 rounded-lg border px-3 py-1.5 text-sm ${
              p === meta.page
                ? "border-indigo-600 bg-indigo-600 font-semibold text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onChange(meta.page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

function buildPages(current: number, total: number): Array<number | "..."> {
  const pages = new Set<number>([1, total, current]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i > 1 && i < total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "..."> = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("...");
    out.push(p);
    prev = p;
  }
  return out;
}
