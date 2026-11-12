import { useState } from "react";
import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminDeleteReviewMutation, useAdminReviewsQuery } from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { Pagination } from "~/components";
import { RatingStars } from "~/components";
import { AdminPageHeader } from "./layout";
import { errorMessage, formatDateTime } from "~/utils/format";

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const { data, isLoading } = useAdminReviewsQuery({ page, limit: 20 });
  const [deleteReview] = useAdminDeleteReviewMutation();

  const remove = async (id: string) => {
    try {
      await deleteReview(id).unwrap();
      toast.success("Review deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Reviews"
        description={data ? `${data.meta.total} review(s)` : undefined}
      />

      {isLoading ? (
        <PageLoader label="Loading reviews..." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No reviews yet" description="Customer reviews will appear here." />
      ) : (
        <>
          <ul className="space-y-3">
            {data.items.map((review) => (
              <li key={review.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingStars value={review.rating} />
                      <span className="text-sm font-medium">{review.user.name}</span>
                      <span className="text-xs text-gray-400">{review.user.email}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      {review.comment || (
                        <span className="italic text-gray-400">No comment provided.</span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <Link
                        to={`/products/${review.product.slug}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {review.product.name}
                      </Link>
                      <span>{formatDateTime(review.createdAt)}</span>
                    </div>
                  </div>
                  {pendingDelete === review.id ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => remove(review.id)}
                        className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(null)}
                        className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(review.id)}
                      className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete review"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination meta={data.meta} onChange={setPage} />
        </>
      )}
    </div>
  );
}
