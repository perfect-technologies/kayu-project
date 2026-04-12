"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Check,
  LucideIcon,
} from "lucide-react";
import {
  RATING_CATEGORIES,
  RatingCategory,
  CategoryRating,
  calculateOverallScore,
  getScoreColor,
  getScoreLabel,
} from "./RatingDisplay";

// Score labels in order (1-5)
const SCORE_LABELS: Record<number, string> = {
  1: "Mauvais",
  2: "Passable",
  3: "Moyen",
  4: "Bon",
  5: "Excellent",
};

export interface RatingInputProps {
  initialRatings?: Partial<Record<RatingCategory, number>>;
  onSubmit?: (ratings: CategoryRating[]) => void | Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
  className?: string;
}

// Single category rating input
interface CategoryRatingInputProps {
  category: RatingCategory;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function CategoryRatingInput({
  category,
  value,
  onChange,
  disabled = false,
}: CategoryRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const categoryInfo = RATING_CATEGORIES[category];
  const Icon: LucideIcon = categoryInfo.icon;

  const displayValue = hoverValue ?? value;

  const handleClick = useCallback(
    (score: number) => {
      if (!disabled) {
        onChange(score);
      }
    },
    [disabled, onChange]
  );

  const handleMouseEnter = useCallback((score: number) => {
    setHoverValue(score);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverValue(null);
  }, []);

  return (
    <div className="space-y-2">
      {/* Category header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors"
            style={{
              backgroundColor: value > 0 ? `${getScoreColor(displayValue || 3)}15` : "#f1f5f9",
            }}
          >
            <Icon
              className="h-4 w-4"
              style={{
                color: value > 0 ? getScoreColor(displayValue || 3) : "#94a3b8",
              }}
            />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">
              {categoryInfo.label}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {categoryInfo.description}
            </p>
          </div>
        </div>
        {/* Current value badge */}
        {value > 0 && (
          <Badge
            variant="outline"
            className="font-semibold text-xs transition-colors"
            style={{
              borderColor: `${getScoreColor(displayValue)}40`,
              color: getScoreColor(displayValue),
              backgroundColor: `${getScoreColor(displayValue)}10`,
            }}
          >
            {displayValue}/5
          </Badge>
        )}
      </div>

      {/* Clickable icons */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((score) => {
          const isActive = score <= (hoverValue ?? value);
          const isHovered = hoverValue === score;
          const scoreColor = getScoreColor(score);

          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(score)}
              onMouseEnter={() => handleMouseEnter(score)}
              onMouseLeave={handleMouseLeave}
              className={`
                relative flex items-center justify-center h-10 w-10 rounded-xl
                transition-all duration-200 ease-out
                ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:scale-110 active:scale-95"
                }
                ${isHovered ? "z-10 shadow-lg" : ""}
              `}
              style={{
                backgroundColor: isActive ? `${scoreColor}20` : "#f1f5f9",
                boxShadow: isActive
                  ? `0 2px 8px ${scoreColor}30`
                  : "0 1px 3px rgba(0,0,0,0.1)",
                border: isActive ? `2px solid ${scoreColor}` : "2px solid transparent",
              }}
            >
              <Icon
                className="h-5 w-5 transition-colors"
                style={{
                  color: isActive ? scoreColor : "#cbd5e1",
                }}
              />
              {/* Score number overlay on hover */}
              {isHovered && (
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: scoreColor,
                    color: "white",
                  }}
                >
                  {SCORE_LABELS[score]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hover label */}
      {hoverValue !== null && (
        <div
          className="text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200"
          style={{ color: getScoreColor(hoverValue) }}
        >
          {SCORE_LABELS[hoverValue]}
        </div>
      )}
    </div>
  );
}

// Main RatingInput component
export function RatingInput({
  initialRatings = {},
  onSubmit,
  submitLabel = "Soumettre l'évaluation",
  disabled = false,
  className = "",
}: RatingInputProps) {
  const [ratings, setRatings] = useState<Record<RatingCategory, number>>(() => {
    const initial: Record<RatingCategory, number> = {
      punctuality: 0,
      quality: 0,
      communication: 0,
      value: 0,
      professionalism: 0,
    };
    Object.entries(initialRatings).forEach(([key, value]) => {
      if (key in initial && typeof value === "number") {
        initial[key as RatingCategory] = value;
      }
    });
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = useCallback(
    (category: RatingCategory, value: number) => {
      setRatings((prev) => ({
        ...prev,
        [category]: value,
      }));
    },
    []
  );

  const handleSubmit = async () => {
    const hasAllRatings = Object.values(ratings).every((r) => r > 0);
    if (!hasAllRatings) {
      return;
    }

    const ratingsArray: CategoryRating[] = Object.entries(ratings).map(
      ([category, score]) => ({
        category: category as RatingCategory,
        score,
      })
    );

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(ratingsArray);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const overallScore = calculateOverallScore(
    Object.entries(ratings)
      .filter(([, score]) => score > 0)
      .map(([category, score]) => ({
        category: category as RatingCategory,
        score,
      }))
  );

  const allRatingsProvided = Object.values(ratings).every((r) => r > 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Évaluez ce prestataire
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Notez chaque aspect de la prestation
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating categories */}
        {(Object.keys(RATING_CATEGORIES) as RatingCategory[]).map((category) => (
          <CategoryRatingInput
            key={category}
            category={category}
            value={ratings[category]}
            onChange={(value) => handleRatingChange(category, value)}
            disabled={disabled || isSubmitting}
          />
        ))}

        {/* Overall score preview */}
        {allRatingsProvided && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">Score global</span>
              <Badge
                className="font-bold text-sm"
                style={{
                  backgroundColor: `${getScoreColor(overallScore)}15`,
                  color: getScoreColor(overallScore),
                }}
              >
                {overallScore.toFixed(1)} / 5 - {getScoreLabel(overallScore)}
              </Badge>
            </div>
          </div>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!allRatingsProvided || disabled || isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {submitLabel}
            </>
          )}
        </Button>

        {!allRatingsProvided && (
          <p className="text-xs text-center text-muted-foreground">
            Veuillez noter tous les critères pour soumettre votre évaluation
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Compact inline rating input for quick ratings
interface QuickRatingInputProps {
  onSubmit?: (ratings: CategoryRating[]) => void | Promise<void>;
  className?: string;
}

export function QuickRatingInput({
  onSubmit,
  className = "",
}: QuickRatingInputProps) {
  const [ratings, setRatings] = useState<Record<RatingCategory, number>>({
    punctuality: 0,
    quality: 0,
    communication: 0,
    value: 0,
    professionalism: 0,
  });

  const handleRatingChange = useCallback(
    (category: RatingCategory, value: number) => {
      setRatings((prev) => {
        const newRatings = {
          ...prev,
          [category]: value,
        };

        const allRated = Object.values(newRatings).every((r) => r > 0);
        if (allRated && onSubmit) {
          const ratingsArray: CategoryRating[] = Object.entries(newRatings).map(
            ([cat, score]) => ({
              category: cat as RatingCategory,
              score,
            })
          );
          onSubmit(ratingsArray);
        }

        return newRatings;
      });
    },
    [onSubmit]
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {(Object.keys(RATING_CATEGORIES) as RatingCategory[]).map((category) => {
        const categoryInfo = RATING_CATEGORIES[category];
        const Icon: LucideIcon = categoryInfo.icon;

        return (
          <div key={category} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 w-28 shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground truncate">
                {categoryInfo.label}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((score) => {
                const isActive = score <= ratings[category];
                const scoreColor = getScoreColor(score);

                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleRatingChange(category, score)}
                    className="flex items-center justify-center h-7 w-7 rounded-lg transition-all hover:scale-110"
                    style={{
                      backgroundColor: isActive ? `${scoreColor}20` : "#f1f5f9",
                      border: isActive ? `1.5px solid ${scoreColor}` : "1.5px solid transparent",
                    }}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{
                        color: isActive ? scoreColor : "#cbd5e1",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
