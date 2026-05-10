// Shared types and helpers for D03 photo-forward cards.
// Consumed by both apps/web and apps/mobile via the platform card components.

import type { CategorySlug } from "./tokens.js";

// Minimum data shape every D03 card consumes. Real provider records will be a
// superset; the cards only read these fields.
export type ProviderCardData = {
  id: string;
  firstName: string;
  lastName: string;
  initials?: string;
  profession: string;
  commune?: string;
  city?: string;
  categories: CategorySlug[];
  avatarBg?: string;
  avatarUrl?: string;
  rating: number;
  reviews: number;
  /** "15 min" | "1h" | "3h" — the bare time string. */
  response: string;
  /** Provider starting price in FC (fixed base price, not hourly). Field kept as `hourly` while DB column rename is deferred. */
  hourly: number;
  /** Distance in km. Omit on cards that don't show it. */
  distance?: number;
  verified?: boolean;
  topRated?: boolean;
  online?: boolean;
  /** Years of experience, used as a trust chip on the showcase card. */
  experienceYears?: number;
  /** Short verbatim review used as a quote on the showcase card. */
  testimonial?: string;
};

// Resolve the portfolio category for a provider, defaulting to plomberie when
// the provider has no categories (mirrors the prototype's defensive fallback).
export const portfolioSlug = (
  categories: readonly CategorySlug[] | undefined,
): CategorySlug => categories?.[0] ?? "plomberie";

// Format a price in Congolese francs — "15 000 FC" with French thousand
// separators (NBSP), separator handled by Intl.
export const formatMoneyFc = (amount: number): string =>
  `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FC`;

// Format a starting price for the wide/featured card meta — "15 000" with
// French thousand separators (NBSP), separator handled by Intl.
// Function name kept as `formatHourly` to avoid widespread call-site churn;
// semantically this is the provider starting price.
export const formatHourly = (hourly: number): string =>
  hourly.toLocaleString("fr-FR");

// Compact form for nearby rows — "15k FC".
export const formatHourlyCompact = (hourly: number): string =>
  `${Math.round(hourly / 1000)}k FC`;
