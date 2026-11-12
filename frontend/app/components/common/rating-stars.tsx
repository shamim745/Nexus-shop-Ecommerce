import { Star } from "lucide-react";

export function RatingStars({
  value,
  count,
  size = 14,
}: {
  value: number;
  count?: number;
  size?: number;
}) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1" title={`${value} out of 5`}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              i <= rounded ? "fill-amber-400 text-amber-400" : "text-gray-300"
            }
          />
        ))}
      </span>
      <span className="text-xs text-gray-500">
        {value > 0 ? value.toFixed(1) : "New"}
        {typeof count === "number" && count > 0 && ` (${count})`}
      </span>
    </span>
  );
}
