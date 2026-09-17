"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { providerCopy } from "@/copy/provider";
import { cn } from "@/lib/utils";

export type StarRatingProps = {
  value: number;
  size?: 14 | 18 | 22;
  /** When set, the row becomes a keyboard-operable radio group. */
  onChange?: (value: number) => void;
  label?: string;
  className?: string;
};

const STARS = [1, 2, 3, 4, 5] as const;

/** Read-only amber row, or an interactive `role="radiogroup"` with arrow keys. */
export function StarRating({ value, size = 14, onChange, label, className }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const display = onChange ? hover || value : value;

  if (!onChange) {
    return (
      <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={providerCopy.review.star(Math.round(value))}>
        {STARS.map((star) => (
          <Star
            key={star}
            aria-hidden
            size={size}
            className={star <= Math.round(display) ? "fill-amber-400 text-amber-400" : "fill-border text-border"}
            strokeWidth={0}
          />
        ))}
      </span>
    );
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(Math.min(5, value + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(Math.max(1, value - 1));
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(0)}
      className={cn("inline-flex items-center gap-1", className)}
    >
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={providerCopy.review.star(star)}
          tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
          onMouseEnter={() => setHover(star)}
          onClick={() => onChange(star)}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-full"
        >
          <Star
            aria-hidden
            size={size}
            className={star <= display ? "fill-amber-400 text-amber-400" : "fill-border text-border"}
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  );
}
