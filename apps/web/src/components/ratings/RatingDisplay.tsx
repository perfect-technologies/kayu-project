"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Wrench,
  MessageCircle,
  Coins,
  Award,
  LucideIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Rating categories with their icons and labels
export const RATING_CATEGORIES = {
  punctuality: {
    icon: Clock,
    label: "Ponctualité",
    description: "Respect des horaires",
  },
  quality: {
    icon: Wrench,
    label: "Qualité",
    description: "Qualité du travail",
  },
  communication: {
    icon: MessageCircle,
    label: "Communication",
    description: "Réactivité et clarté",
  },
  value: {
    icon: Coins,
    label: "Rapport qualité/prix",
    description: "Valeur pour l'argent",
  },
  professionalism: {
    icon: Award,
    label: "Professionnalisme",
    description: "Comportement professionnel",
  },
} as const;

export type RatingCategory = keyof typeof RATING_CATEGORIES;

export interface CategoryRating {
  category: RatingCategory;
  score: number; // 1-5
}

export interface RatingDisplayProps {
  ratings: CategoryRating[];
  showOverall?: boolean;
  compact?: boolean;
  className?: string;
}

// Helper function to get color based on score
function getScoreColor(score: number): string {
  if (score >= 4) return "#22C55E"; // green for high
  if (score >= 3) return "#F59E0B"; // amber for medium
  return "#EF4444"; // red for low
}

// Helper function to get color classes based on score
function getScoreColorClasses(score: number): {
  bg: string;
  text: string;
  border: string;
  progress: string;
} {
  if (score >= 4) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      progress: "[&>div]:bg-emerald-500",
    };
  }
  if (score >= 3) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      progress: "[&>div]:bg-amber-500",
    };
  }
  return {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    progress: "[&>div]:bg-red-500",
  };
}

// Helper function to get score label
function getScoreLabel(score: number): string {
  const labels: Record<number, string> = {
    1: "Mauvais",
    2: "Passable",
    3: "Moyen",
    4: "Bon",
    5: "Excellent",
  };
  return labels[Math.round(score)] || "Non noté";
}

// Calculate overall score from ratings
export function calculateOverallScore(ratings: CategoryRating[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, r) => sum + r.score, 0);
  return total / ratings.length;
}

// Single category rating display
interface CategoryRatingDisplayProps {
  category: RatingCategory;
  score: number;
  compact?: boolean;
}

function CategoryRatingDisplay({
  category,
  score,
  compact = false,
}: CategoryRatingDisplayProps) {
  const categoryInfo = RATING_CATEGORIES[category];
  const Icon: LucideIcon = categoryInfo.icon;
  const colors = getScoreColorClasses(score);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center justify-center h-7 w-7 rounded-lg ${colors.bg} ${colors.border} border`}
        >
          <Icon
            className="h-4 w-4"
            style={{ color: getScoreColor(score) }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <Progress
            value={(score / 5) * 100}
            className={`h-2 ${colors.progress}`}
          />
          <span className={`text-xs font-semibold ${colors.text} min-w-[18px]`}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl ${colors.bg} ${colors.border} border transition-all hover:shadow-sm`}
    >
      <div
        className={`flex items-center justify-center h-10 w-10 rounded-xl ${colors.bg} shadow-sm`}
        style={{
          boxShadow: `0 2px 8px ${getScoreColor(score)}20`
        }}
      >
        <Icon
          className="h-5 w-5"
          style={{ color: getScoreColor(score) }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm text-foreground truncate">
            {categoryInfo.label}
          </span>
          <Badge
            variant="outline"
            className={`${colors.bg} ${colors.text} ${colors.border} font-semibold text-xs`}
          >
            {score.toFixed(1)} / 5
          </Badge>
        </div>
        <Progress
          value={(score / 5) * 100}
          className={`h-2 ${colors.progress}`}
        />
        <p className="text-[10px] text-muted-foreground mt-1 truncate">
          {categoryInfo.description}
        </p>
      </div>
    </div>
  );
}

// Overall score display
interface OverallScoreDisplayProps {
  score: number;
  totalReviews?: number;
}

function OverallScoreDisplay({ score, totalReviews }: OverallScoreDisplayProps) {
  const Icon = Award;

  return (
    <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
      <div
        className="flex items-center justify-center h-14 w-14 rounded-2xl shadow-lg"
        style={{
          backgroundColor: `${getScoreColor(score)}15`,
          boxShadow: `0 4px 12px ${getScoreColor(score)}25`
        }}
      >
        <Icon
          className="h-7 w-7"
          style={{ color: getScoreColor(score) }}
        />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl font-bold"
            style={{ color: getScoreColor(score) }}
          >
            {score.toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground font-medium">/ 5</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {totalReviews !== undefined
            ? `${totalReviews} avis`
            : "Score moyen"}
        </p>
      </div>
    </div>
  );
}

// Main RatingDisplay component
export function RatingDisplay({
  ratings,
  showOverall = true,
  compact = false,
  className = "",
}: RatingDisplayProps) {
  const overallScore = calculateOverallScore(ratings);

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {ratings.map((rating) => (
          <CategoryRatingDisplay
            key={rating.category}
            category={rating.category}
            score={rating.score}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        {showOverall && (
          <div className="mb-4">
            <OverallScoreDisplay score={overallScore} />
          </div>
        )}
        <div className="space-y-2">
          {ratings.map((rating) => (
            <CategoryRatingDisplay
              key={rating.category}
              category={rating.category}
              score={rating.score}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline rating display for cards
interface InlineRatingDisplayProps {
  ratings: CategoryRating[];
  className?: string;
}

export function InlineRatingDisplay({
  ratings,
  className = "",
}: InlineRatingDisplayProps) {
  const overallScore = calculateOverallScore(ratings);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {ratings.slice(0, 4).map((rating) => {
        const Icon = RATING_CATEGORIES[rating.category].icon;
        const scoreColor = getScoreColor(rating.score);
        return (
          <div
            key={rating.category}
            className="flex items-center justify-center h-6 w-6 rounded-md transition-transform hover:scale-110"
            style={{ backgroundColor: `${scoreColor}15` }}
            title={`${RATING_CATEGORIES[rating.category].label}: ${rating.score.toFixed(1)}`}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: scoreColor }} />
          </div>
        );
      })}
      <Badge
        variant="outline"
        className="ml-1 text-xs font-semibold"
        style={{
          borderColor: `${getScoreColor(overallScore)}40`,
          color: getScoreColor(overallScore),
          backgroundColor: `${getScoreColor(overallScore)}10`
        }}
      >
        {overallScore.toFixed(1)}
      </Badge>
    </div>
  );
}

// Export helper functions and utilities
export { getScoreColor, getScoreColorClasses, getScoreLabel };
