# Mobile Dynamic Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the web-side category dynamism (commits in this session) to the Expo/React Native mobile app — so the mobile home strip, search filter, and provider cards all use admin-managed category names/icons/colors from the API instead of the static 9-slug portfolio enum.

**Architecture:** Mirror the web pattern that's already in place: (1) widen the typed slug from `CategorySlug` to plain `string` where API data flows through, (2) add a `resolveLucideIcon` + `FallbackCategoryIcon` helper in mobile Icon.tsx using `lucide-react-native`, (3) extend mobile `providerAdapter` with `buildCategoryLookup` and an optional second arg on `providerToCardData` that enriches cards with `categoryName/IconName/Color/secondaryCategories`, (4) update each mobile card variant (`FeaturedProviderCard`, `WideProviderCard`, `NearbyRow`) to consume these fields with a portfolio fallback, (5) switch screens from `getAll()` → `getHierarchy()` and remove the `FALLBACK_STRIP` and `DEFAULT_CATEGORIES` constants, (6) add a Spécialité (subcategory) section to `MobileFilterSheet`.

**Tech Stack:** TypeScript, React Native (Expo), `@kayu/ui`, `@kayu/api`, `lucide-react-native`, React Query.

**Out of scope:** Other cards using `tokens.portfolio` from non-discovery flows (`BookingCard`, `InboundRequestCard`, `OnboardingSteps`, `QuoteComposeClient`, `PhotoTile`'s ambient hatch on web). Mobile equivalents of those are also out of scope here.

**Verification strategy:** No UI component tests exist in this codebase. Each task ends with `pnpm --filter @kayu/ui build` and/or `pnpm --filter @kayu/mobile type-check` (or `tsc --noEmit` for mobile if no script). Final task runs the Expo dev server and manually verifies the home/search screens against real API data.

---

## Task 1: Baseline green build

**Files:** none modified.

- [ ] **Step 1: Confirm UI lib builds clean.**

Run: `pnpm --filter @kayu/ui build`
Expected: exits 0, no TS errors.

- [ ] **Step 2: Confirm mobile type-check is green.**

Run: `pnpm --filter @kayu/mobile type-check` (if the script doesn't exist, run `cd apps/mobile && pnpm exec tsc -p tsconfig.json --noEmit`)
Expected: exits 0.

- [ ] **Step 3: If either fails, STOP and report. The baseline must be green before changes start.**

---

## Task 2: Add `resolveLucideIcon` + `FallbackCategoryIcon` to mobile Icon

**Files:**
- Modify: `packages/ui/src/mobile/Icon.tsx` (add helper + fallback at end of file)
- Modify: `packages/ui/src/mobile/index.ts` (export new symbols)

- [ ] **Step 1: Edit `packages/ui/src/mobile/Icon.tsx` — add the wildcard import and Tag icon at the top of the imports block.**

Add to the named import from `"lucide-react-native"` (around line 4-72): add `Tag,` to the list. Also add this new wildcard import directly below the existing `lucide-react-native` import block:

```tsx
import * as LucideAll from "lucide-react-native";
```

- [ ] **Step 2: Append the resolver helpers at the end of `packages/ui/src/mobile/Icon.tsx` (after the existing `I` dictionary export).**

Append:

```tsx
export function resolveLucideIcon(
  name: string | null | undefined,
): React.FC<IconProps> | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  if (trimmed in I) {
    return I[trimmed as IconName] as React.FC<IconProps>;
  }

  const direct = (LucideAll as Record<string, unknown>)[trimmed];
  if (isLucideComponent(direct)) {
    return wrap(direct as Lucide);
  }
  // lucide-react-native ships some icons only under an "Icon"-suffixed alias.
  const aliased = (LucideAll as Record<string, unknown>)[`${trimmed}Icon`];
  if (isLucideComponent(aliased)) {
    return wrap(aliased as Lucide);
  }
  return null;
}

function isLucideComponent(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (
    typeof value === "object" &&
    value !== null &&
    "$$typeof" in (value as Record<string, unknown>)
  ) {
    return true;
  }
  return false;
}

export const FallbackCategoryIcon: React.FC<IconProps> = wrap(Tag);
```

- [ ] **Step 3: Edit `packages/ui/src/mobile/index.ts` — update the Icon export line.**

Replace:

```ts
export { Icon, I } from "./Icon.js";
```

with:

```ts
export { I, FallbackCategoryIcon, resolveLucideIcon } from "./Icon.js";
```

(The original `Icon` named export does not exist in mobile Icon.tsx — only `I`. Keep the export list aligned with what's actually exported.)

- [ ] **Step 4: Rebuild + type-check.**

Run: `pnpm --filter @kayu/ui build`
Expected: exits 0.

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/src/mobile/Icon.tsx packages/ui/src/mobile/index.ts
git commit -m "feat(ui/mobile): add resolveLucideIcon + FallbackCategoryIcon helpers"
```

---

## Task 3: Widen `CategoryStrip` to accept dynamic icon name + color

**Files:**
- Modify: `packages/ui/src/mobile/CategoryStrip.tsx` (full rewrite of props + render)

- [ ] **Step 1: Replace the entire file content.**

```tsx
import * as React from "react";
import { Pressable, ScrollView, Text, type ViewStyle } from "react-native";
import { tokens, type CategorySlug } from "../tokens.js";
import {
  FallbackCategoryIcon,
  I,
  resolveLucideIcon,
  type IconName,
} from "./Icon.js";

export type CategoryStripItem = {
  slug: string;
  label?: string;
  iconName?: string;
  color?: string;
};

export type CategoryStripProps = {
  items: CategoryStripItem[];
  active?: string;
  onSelect?: (slug: string) => void;
  style?: ViewStyle;
};

const FONTS = {
  body: "Inter-Regular",
  bodyMed: "Inter-Medium",
  bodySemi: "Inter-SemiBold",
};

export const CategoryStrip: React.FC<CategoryStripProps> = ({
  items,
  active,
  onSelect,
  style,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={style}
    contentContainerStyle={{
      gap: 28,
      paddingHorizontal: 20,
      paddingBottom: 12,
    }}
  >
    {items.map((item) => {
      const portfolio =
        item.slug in tokens.portfolio
          ? tokens.portfolio[item.slug as CategorySlug]
          : undefined;
      const Icon =
        resolveLucideIcon(item.iconName) ??
        (portfolio ? I[portfolio.iconName as IconName] : null) ??
        FallbackCategoryIcon;
      const label = item.label ?? portfolio?.label ?? item.slug;
      const isActive = active === item.slug;
      const iconColor = item.color ?? tokens.color.textPrimary;
      return (
        <Pressable
          key={item.slug}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
          onPress={onSelect ? () => onSelect(item.slug) : undefined}
          style={{
            minWidth: 52,
            alignItems: "center",
            paddingTop: 10,
            paddingBottom: 8,
            borderBottomWidth: 2,
            borderBottomColor: isActive
              ? tokens.color.textPrimary
              : "transparent",
            opacity: isActive ? 1 : 0.64,
          }}
        >
          <Icon size={22} color={iconColor} strokeWidth={1.75} />
          <Text
            style={{
              fontFamily: isActive ? FONTS.bodySemi : FONTS.bodyMed,
              fontSize: 11,
              color: tokens.color.textPrimary,
              marginTop: 6,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);
```

- [ ] **Step 2: Build the UI lib.**

Run: `pnpm --filter @kayu/ui build`
Expected: exits 0.

(There will be type errors in `apps/mobile` consumers because `slug` widened from `CategorySlug` to `string`. We fix those in later tasks. The lib alone must compile.)

- [ ] **Step 3: Commit.**

```bash
git add packages/ui/src/mobile/CategoryStrip.tsx
git commit -m "feat(ui/mobile): CategoryStrip accepts dynamic slug/icon/color from API"
```

---

## Task 4: Widen `PhotoTile` to accept dynamic accent + iconName

**Files:**
- Modify: `packages/ui/src/mobile/PhotoTile.tsx`

PhotoTile is used by all three mobile card variants. It currently hardcodes `category: CategorySlug` and pulls accent/icon from `tokens.portfolio[category]`. We'll keep the `category` prop as a fallback but add `accent` and `iconName` props that, when present, win.

- [ ] **Step 1: Update the props type at the top of the file (replace the existing `PhotoTileProps` block).**

```tsx
export type PhotoTileProps = {
  category?: CategorySlug;
  accent?: string;
  iconName?: string;
  aspect?: PhotoAspect;
  radius?: number;
  showAmbient?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
};
```

- [ ] **Step 2: Replace the component body so dynamic accent/iconName win over the portfolio lookup.**

Replace the existing component (from `export const PhotoTile` through the closing `};`) with:

```tsx
export const PhotoTile: React.FC<PhotoTileProps> = ({
  category,
  accent: accentProp,
  iconName,
  aspect = "4/5",
  radius,
  showAmbient = true,
  accessibilityLabel,
  style,
  children,
}) => {
  const portfolio = category ? tokens.portfolio[category] : undefined;
  const accent = accentProp ?? portfolio?.accent ?? tokens.color.textBody;
  const bg = portfolio?.bg ?? tokens.color.surfaceMuted;
  const AmbientIcon =
    resolveLucideIcon(iconName) ??
    (portfolio ? I[portfolio.iconName as IconName] : null) ??
    FallbackCategoryIcon;
  const gradientId = category ?? "dyn";

  return (
    <View
      accessibilityRole={accessibilityLabel ? "image" : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          position: "relative",
          aspectRatio: ASPECT_RATIO[aspect],
          backgroundColor: bg,
          borderRadius: radius,
          overflow: "hidden",
          width: "100%",
        },
        style,
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Defs>
          <RadialGradient id={`pt-${gradientId}-tl`} cx="20%" cy="15%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.15} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`pt-${gradientId}-br`} cx="80%" cy="85%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <Pattern
            id={`pt-${gradientId}-hatch`}
            patternUnits="userSpaceOnUse"
            width={19}
            height={19}
            patternTransform="rotate(135)"
          >
            <Line
              x1={0}
              y1={0}
              x2={0}
              y2={19}
              stroke={accent}
              strokeOpacity={0.08}
              strokeWidth={1}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#pt-${gradientId}-hatch)`} />
        <Rect width="100%" height="100%" fill={`url(#pt-${gradientId}-tl)`} />
        <Rect width="100%" height="100%" fill={`url(#pt-${gradientId}-br)`} />
      </Svg>

      {showAmbient ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.12,
          }}
        >
          <AmbientIcon size={36} color={accent} strokeWidth={1.5} />
        </View>
      ) : null}

      {children}
    </View>
  );
};
```

- [ ] **Step 3: Update the `import` at the top of the file to pull in the new helpers.**

Replace:

```tsx
import { I, type IconName } from "./Icon.js";
```

with:

```tsx
import {
  FallbackCategoryIcon,
  I,
  resolveLucideIcon,
  type IconName,
} from "./Icon.js";
```

- [ ] **Step 4: Build + commit.**

Run: `pnpm --filter @kayu/ui build`
Expected: exits 0.

```bash
git add packages/ui/src/mobile/PhotoTile.tsx
git commit -m "feat(ui/mobile): PhotoTile accepts dynamic accent + iconName"
```

---

## Task 5: Update mobile `FeaturedProviderCard` (SpecialtyTag + secondary chips)

**Files:**
- Modify: `packages/ui/src/mobile/FeaturedProviderCard.tsx`

This card has the in-file `SpecialtyTag` helper. We update both the main card (to pass dynamic props to `PhotoTile` and `SpecialtyTag`) and `SpecialtyTag` itself (to accept a dynamic iconName via `resolveLucideIcon`). We also add a secondary-categories chip row in the card body.

- [ ] **Step 1: Update the imports at the top of the file.**

Replace:

```tsx
import { I, type IconName } from "./Icon.js";
```

with:

```tsx
import {
  FallbackCategoryIcon,
  I,
  resolveLucideIcon,
  type IconName,
} from "./Icon.js";
```

- [ ] **Step 2: Replace the body of the `FeaturedProviderCard` component (the entire `return ( ... )` of the component).**

Replace the `<PhotoTile category={slug} aspect="4/5">` block + everything below it inside the outer `<Pressable>` with:

```tsx
      <PhotoTile
        category={slug}
        accent={provider.categoryColor}
        iconName={provider.categoryIconName}
        aspect="4/5"
      >
        <SpecialtyTag
          accent={provider.categoryColor ?? portfolio.accent}
          label={provider.categoryName ?? portfolio.label}
          iconName={provider.categoryIconName ?? portfolio.iconName}
        />
        {onFavorite ? (
          <HeartButton
            favorited={favorited}
            onPress={() => onFavorite(provider.id)}
          />
        ) : null}
        {provider.topRated ? <TopRatedPill /> : null}
        <View style={{ position: "absolute", right: 12, bottom: 12 }}>
          <Avatar
            name={`${provider.firstName} ${provider.lastName}`}
            initials={provider.initials}
            bg={provider.avatarBg}
            src={provider.avatarUrl}
            size={42}
            online={provider.online}
          />
        </View>
      </PhotoTile>

      <View style={{ padding: 14, paddingBottom: 16 }}>
        <CardMetaRow1 provider={provider} showReviewCount={false} />
        <Text
          numberOfLines={1}
          style={{
            color: tokens.color.textMuted,
            fontFamily: FONTS.bodyMed,
            fontSize: 14,
            marginTop: 1,
          }}
        >
          {provider.profession}
          {provider.commune ? ` · ${provider.commune}` : ""}
        </Text>
        <SecondaryCategoryRow categories={provider.secondaryCategories} />
        <ResponseLine response={provider.response} />
        <PriceLine hourly={provider.hourly} />
      </View>
```

- [ ] **Step 3: Replace the `SpecialtyTag` sub-component (lines around 116-151 in the original).**

Replace the existing `SpecialtyTag` declaration with:

```tsx
const SpecialtyTag: React.FC<{
  accent: string;
  label: string;
  iconName: string;
}> = ({ accent, label, iconName }) => {
  const Icon =
    resolveLucideIcon(iconName) ??
    (iconName in I
      ? (I[iconName as IconName] as React.FC<{
          size?: number;
          color?: string;
          strokeWidth?: number;
        }>)
      : null) ??
    FallbackCategoryIcon;
  return (
    <View
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Icon size={11} color={accent} strokeWidth={1.75} />
      <Text
        style={{
          fontFamily: FONTS.mono,
          fontSize: 10,
          fontWeight: "600",
          color: accent,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
    </View>
  );
};
```

- [ ] **Step 4: Add a new `SecondaryCategoryRow` sub-component just below `SpecialtyTag` (and before `HeartButton`).**

```tsx
const SecondaryCategoryRow: React.FC<{
  categories?: ProviderCardData["secondaryCategories"];
}> = ({ categories }) => {
  if (!categories || categories.length === 0) return null;
  const visible = categories.slice(0, 2);
  const overflow = categories.length - visible.length;
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 6,
      }}
    >
      {visible.map((cat) => {
        const ChipIcon =
          resolveLucideIcon(cat.iconName) ?? FallbackCategoryIcon;
        return (
          <View
            key={cat.name}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: tokens.color.surfaceMuted,
            }}
          >
            <ChipIcon
              size={10}
              color={cat.color ?? tokens.color.textBody}
              strokeWidth={1.75}
            />
            <Text
              style={{
                fontFamily: FONTS.bodyMed,
                fontSize: 11,
                color: tokens.color.textBody,
              }}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
          </View>
        );
      })}
      {overflow > 0 ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: tokens.color.surfaceMuted,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyMed,
              fontSize: 11,
              color: tokens.color.textBody,
            }}
          >
            +{overflow}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
```

- [ ] **Step 5: Export `SecondaryCategoryRow` from `_featuredInternals` so `WideProviderCard` can reuse it.**

Update the existing exports block at the bottom:

```tsx
export const _featuredInternals = {
  SpecialtyTag,
  HeartButton,
  TopRatedPill,
  CardMetaRow1,
  ResponseLine,
  PriceLine,
  SecondaryCategoryRow,
};
```

- [ ] **Step 6: Build + commit.**

Run: `pnpm --filter @kayu/ui build`
Expected: exits 0.

```bash
git add packages/ui/src/mobile/FeaturedProviderCard.tsx
git commit -m "feat(ui/mobile): FeaturedProviderCard uses API category + secondary chips"
```

---

## Task 6: Update mobile `WideProviderCard`

**Files:**
- Modify: `packages/ui/src/mobile/WideProviderCard.tsx`

- [ ] **Step 1: Update the destructure at the top of the file to include `SecondaryCategoryRow`.**

Replace:

```tsx
const { SpecialtyTag, HeartButton, TopRatedPill, CardMetaRow1, ResponseLine, PriceLine } =
  _featuredInternals;
```

with:

```tsx
const {
  SpecialtyTag,
  HeartButton,
  TopRatedPill,
  CardMetaRow1,
  ResponseLine,
  PriceLine,
  SecondaryCategoryRow,
} = _featuredInternals;
```

- [ ] **Step 2: Update the `PhotoTile` + `SpecialtyTag` call and add the secondary chip row in the body.**

Replace the existing `return (` body's `<PhotoTile category={slug} aspect="16/11">` block and the body `<View>` below it with:

```tsx
      <PhotoTile
        category={slug}
        accent={provider.categoryColor}
        iconName={provider.categoryIconName}
        aspect="16/11"
      >
        <SpecialtyTag
          accent={provider.categoryColor ?? portfolio.accent}
          label={provider.categoryName ?? portfolio.label}
          iconName={provider.categoryIconName ?? portfolio.iconName}
        />
        {onFavorite ? (
          <HeartButton
            favorited={favorited}
            onPress={() => onFavorite(provider.id)}
          />
        ) : null}
        {provider.topRated ? <TopRatedPill /> : null}
        <View style={{ position: "absolute", right: 12, bottom: 12 }}>
          <Avatar
            name={`${provider.firstName} ${provider.lastName}`}
            initials={provider.initials}
            bg={provider.avatarBg}
            src={provider.avatarUrl}
            size={44}
            online={provider.online}
          />
        </View>
      </PhotoTile>

      <View style={{ padding: 14, paddingBottom: 16 }}>
        <CardMetaRow1 provider={provider} showReviewCount />
        <Text
          numberOfLines={1}
          style={{
            color: tokens.color.textMuted,
            fontFamily: FONTS.bodyMed,
            fontSize: 14,
            marginTop: 1,
          }}
        >
          {provider.profession}
          {provider.commune ? ` · ${provider.commune}` : ""}
          {provider.distance != null ? ` · ${provider.distance} km` : ""}
        </Text>
        <SecondaryCategoryRow categories={provider.secondaryCategories} />
        <ResponseLine response={provider.response} />
        <PriceLine hourly={provider.hourly} />
      </View>
```

- [ ] **Step 3: Build + commit.**

Run: `pnpm --filter @kayu/ui build`
Expected: exits 0.

```bash
git add packages/ui/src/mobile/WideProviderCard.tsx
git commit -m "feat(ui/mobile): WideProviderCard uses API category + secondary chips"
```

---

## Task 7: Update mobile `NearbyRow`

**Files:**
- Modify: `packages/ui/src/mobile/NearbyCard.tsx`

This row is too compact for a chip row. We only update the 84×84 mini tile to use the API category color/icon, with portfolio fallback.

- [ ] **Step 1: Update the imports.**

Replace:

```tsx
import { I, type IconName } from "./Icon.js";
```

with:

```tsx
import {
  FallbackCategoryIcon,
  I,
  resolveLucideIcon,
  type IconName,
} from "./Icon.js";
```

- [ ] **Step 2: Replace the head of `NearbyRow` (the `const slug`/`const portfolio`/`const TileIcon` lines and the `<PhotoTile ...>` block) with:**

```tsx
  const slug = portfolioSlug(provider.categories);
  const portfolio = tokens.portfolio[slug];
  const tileAccent = provider.categoryColor ?? portfolio.accent;
  const TileIcon =
    resolveLucideIcon(provider.categoryIconName) ??
    (I[portfolio.iconName as IconName] ?? FallbackCategoryIcon);
```

Then update the `<PhotoTile ...>` JSX inside the same component:

```tsx
        <PhotoTile
          category={slug}
          accent={provider.categoryColor}
          iconName={provider.categoryIconName}
          aspect="1/1"
          radius={14}
          showAmbient={false}
        >
          <View style={{ position: "absolute", left: 6, top: 6 }}>
            <TileIcon size={14} color={tileAccent} strokeWidth={1.75} />
          </View>
          <View style={{ position: "absolute", right: 6, bottom: 6 }}>
            <Avatar
              name={`${provider.firstName} ${provider.lastName}`}
              initials={provider.initials}
              bg={provider.avatarBg}
              src={provider.avatarUrl}
              size={28}
            />
          </View>
        </PhotoTile>
```

- [ ] **Step 3: Build + commit.**

Run: `pnpm --filter @kayu/ui build`
Expected: exits 0.

```bash
git add packages/ui/src/mobile/NearbyCard.tsx
git commit -m "feat(ui/mobile): NearbyRow uses API category accent/icon with portfolio fallback"
```

---

## Task 8: Extend mobile `providerAdapter` with `buildCategoryLookup` + enrichment

**Files:**
- Modify: `apps/mobile/src/lib/providerAdapter.ts`

- [ ] **Step 1: Replace the entire file content.**

```ts
import type { ProviderCardData } from '@kayu/ui';
import type { CategorySlug } from '@kayu/ui';

const PORTFOLIO_SLUGS = new Set<CategorySlug>([
  'plomberie',
  'electricite',
  'peinture',
  'coiffure',
  'informatique',
  'menage',
  'jardinage',
  'transport',
  'menuiserie',
]);

export function toCategorySlug(raw: string | undefined): CategorySlug {
  if (!raw) return 'plomberie';
  const normalized = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (PORTFOLIO_SLUGS.has(normalized as CategorySlug)) {
    return normalized as CategorySlug;
  }
  return 'plomberie';
}

export type CategoryDisplay = {
  name: string;
  icon: string | null;
  color: string | null;
};

export type CategoryLookup = Map<string, CategoryDisplay>;

export function buildCategoryLookup(
  categories: Array<{
    slug?: string | null;
    name?: string | null;
    icon?: string | null;
    color?: string | null;
  }>,
): CategoryLookup {
  const map: CategoryLookup = new Map();
  for (const cat of categories) {
    if (!cat?.slug) continue;
    map.set(cat.slug, {
      name: cat.name ?? '',
      icon: cat.icon ?? null,
      color: cat.color ?? null,
    });
  }
  return map;
}

function formatResponse(minutes: number | undefined): string {
  if (minutes == null || minutes <= 0) return 'À confirmer';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function computeInitials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName ?? '').trim();
  const l = (lastName ?? '').trim();
  const i = `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  return i || '·';
}

type ProviderCardSource = {
  id?: string;
  profession?: string;
  responseTime?: number | null;
  hourlyRate?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  verificationStatus?: string | null;
  isAvailable?: boolean | null;
  categories?: Array<{ slug?: string | null; name?: string | null } | null> | null;
  serviceZones?: Array<{ city?: string | null; commune?: string | null } | null> | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    city?: string | null;
  } | null;
};

export function providerToCardData(
  provider: ProviderCardSource,
  lookup?: CategoryLookup,
): ProviderCardData {
  const validCategories = (provider.categories ?? []).filter(
    (c): c is { slug?: string | null; name?: string | null } =>
      !!c && typeof c.slug === 'string' && c.slug.length > 0,
  );
  const primaryRaw = validCategories[0];
  const primarySlug = primaryRaw?.slug ?? null;
  const primaryDisplay = primarySlug ? lookup?.get(primarySlug) : undefined;

  type SecondaryCategory = { name: string; iconName?: string; color?: string };
  const secondaryCategories: SecondaryCategory[] = [];
  for (const c of validCategories.slice(1)) {
    const slug = c.slug ?? null;
    const disp = slug ? lookup?.get(slug) : undefined;
    const name = disp?.name || c.name || '';
    if (!name) continue;
    secondaryCategories.push({
      name,
      iconName: disp?.icon ?? undefined,
      color: disp?.color ?? undefined,
    });
  }

  const firstZone = provider.serviceZones?.[0];

  return {
    id: provider.id ?? '',
    firstName: provider.user?.firstName ?? '',
    lastName: provider.user?.lastName ?? '',
    initials: computeInitials(provider.user?.firstName, provider.user?.lastName),
    profession: provider.profession ?? 'Professionnel',
    city: provider.user?.city ?? firstZone?.city ?? undefined,
    commune: firstZone?.commune ?? provider.user?.city ?? firstZone?.city ?? undefined,
    categories: [toCategorySlug(primarySlug ?? undefined)],
    categoryName: primaryDisplay?.name ?? primaryRaw?.name ?? undefined,
    categoryIconName: primaryDisplay?.icon ?? undefined,
    categoryColor: primaryDisplay?.color ?? undefined,
    secondaryCategories:
      secondaryCategories.length > 0 ? secondaryCategories : undefined,
    avatarUrl: provider.user?.avatar ?? undefined,
    rating: provider.rating ?? 0,
    reviews: provider.totalReviews ?? 0,
    response: formatResponse(provider.responseTime ?? undefined),
    hourly: provider.hourlyRate ?? 0,
    distance: undefined,
    verified: provider.verificationStatus === 'VERIFIED',
    topRated: (provider.rating ?? 0) >= 4.7 && (provider.totalReviews ?? 0) >= 5,
    online: !!provider.isAvailable,
  };
}
```

- [ ] **Step 2: Type-check mobile.**

Run: `cd apps/mobile && pnpm exec tsc -p tsconfig.json --noEmit`
Expected: errors only in `HomeScreen.tsx` / `SearchScreen.tsx` / `MobileFilterSheet.tsx` (consumers that we update in later tasks). The adapter file itself must compile.

- [ ] **Step 3: Commit.**

```bash
git add apps/mobile/src/lib/providerAdapter.ts
git commit -m "feat(mobile): buildCategoryLookup + providerToCardData enrichment"
```

---

## Task 9: Widen `MobileFilterSheet` to dynamic categories + add Spécialité section

**Files:**
- Modify: `apps/mobile/src/screens/search/components/MobileFilterSheet.tsx`

This task widens `MobileFilters.category` from `CategorySlug | null` to `string | null`, adds a `subcategory: string | null` field, accepts the full category tree (`{ slug, name, icon, color, subcategories }`) instead of slugged label pairs, deletes `DEFAULT_CATEGORIES`, and renders a subcategory section when a category is selected.

- [ ] **Step 1: Replace the imports at the top of the file.**

Replace:

```tsx
import { I } from '@kayu/ui/mobile';
import { tokens, type CategorySlug } from '@kayu/ui';
```

with:

```tsx
import { FallbackCategoryIcon, I, resolveLucideIcon } from '@kayu/ui/mobile';
import { tokens } from '@kayu/ui';
```

- [ ] **Step 2: Replace the `MobileFilters` type + `EMPTY_FILTERS` constant.**

```tsx
export type MobileFilters = {
  category: string | null;
  subcategory: string | null;
  q: string;
  city: string;
  available: boolean;
  verified: boolean;
  minRating: number | null;
  minPrice: string;
  maxPrice: string;
  sort: MobileSortOption;
};

export const EMPTY_FILTERS: MobileFilters = {
  category: null,
  subcategory: null,
  q: '',
  city: '',
  available: false,
  verified: false,
  minRating: null,
  minPrice: '',
  maxPrice: '',
  sort: 'recommended',
};
```

- [ ] **Step 3: Replace `MobileFilterSheetProps` and delete `DEFAULT_CATEGORIES`.**

```tsx
export type MobileFilterCategory = {
  slug: string;
  label: string;
  icon?: string | null;
  color?: string | null;
  count?: number;
  subcategories?: Array<{ slug: string; label: string }>;
};

type MobileFilterSheetProps = {
  open: boolean;
  initial: MobileFilters;
  onApply: (next: MobileFilters) => void;
  onClose: () => void;
  categoriesAvailable: MobileFilterCategory[];
  categoriesLoading?: boolean;
};
```

Delete the entire `const DEFAULT_CATEGORIES = [ ... ];` block.

- [ ] **Step 4: Update the `MobileFilterSheet` function signature + the category-related blocks.**

Replace the function start:

```tsx
export function MobileFilterSheet({
  open,
  initial,
  onApply,
  onClose,
  categoriesAvailable,
  categoriesLoading = false,
}: MobileFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = React.useState<MobileFilters>(initial);

  React.useEffect(() => {
    if (open) setLocal(initial);
  }, [open, initial]);

  const categories = categoriesAvailable;
  const selectedCategory = local.category
    ? categories.find((c) => c.slug === local.category)
    : undefined;
  const subcategories = selectedCategory?.subcategories ?? [];

  const toggleCategory = (slug: string) =>
    setLocal((f) => ({
      ...f,
      category: f.category === slug ? null : slug,
      subcategory: f.category === slug ? null : null,
    }));

  const toggleSubcategory = (slug: string) =>
    setLocal((f) => ({
      ...f,
      subcategory: f.subcategory === slug ? null : slug,
    }));

  const reset = () => setLocal(EMPTY_FILTERS);
```

- [ ] **Step 5: Replace the `<FilterSection title="Catégorie">` block (and add a new Spécialité section directly after it).**

```tsx
          <FilterSection title="Catégorie">
            <View style={{ gap: 2 }}>
              {categoriesLoading && categories.length === 0 ? (
                <Text style={styles.catLabel}>Chargement…</Text>
              ) : categories.length === 0 ? (
                <Text style={styles.catLabel}>Aucune catégorie disponible.</Text>
              ) : (
                categories.map((c) => {
                  const selected = local.category === c.slug;
                  const Icon =
                    resolveLucideIcon(c.icon ?? undefined) ?? FallbackCategoryIcon;
                  const accent = c.color ?? tokens.color.textBody;
                  return (
                    <Pressable
                      key={c.slug}
                      style={styles.catRow}
                      onPress={() => toggleCategory(c.slug)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                        {selected ? (
                          <I.check size={13} color={theme.colors.textInverse} />
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.catTint,
                          { backgroundColor: `${accent}20` },
                        ]}
                      >
                        <Icon size={14} color={accent} strokeWidth={1.75} />
                      </View>
                      <Text style={styles.catLabel}>{c.label}</Text>
                      {c.count != null ? (
                        <Text style={styles.catCount}>{c.count}</Text>
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          </FilterSection>

          {subcategories.length > 0 ? (
            <FilterSection title="Spécialité">
              <View style={{ gap: 2 }}>
                {subcategories.map((sub) => {
                  const selected = local.subcategory === sub.slug;
                  return (
                    <Pressable
                      key={sub.slug}
                      style={styles.catRow}
                      onPress={() => toggleSubcategory(sub.slug)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                        {selected ? (
                          <I.check size={13} color={theme.colors.textInverse} />
                        ) : null}
                      </View>
                      <Text style={styles.catLabel}>{sub.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </FilterSection>
          ) : null}
```

- [ ] **Step 6: Update the `catDot` style — replace the `catDot` View with the Lucide icon (already done in Step 5 via `<Icon size={14} ... />` inside `catTint`). Delete the unused `catDot` style entry to avoid linter warnings.**

Find and delete this style block:

```tsx
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
```

- [ ] **Step 7: Type-check.**

Run: `cd apps/mobile && pnpm exec tsc -p tsconfig.json --noEmit`
Expected: errors only in `HomeScreen.tsx` and `SearchScreen.tsx` (consumers of MobileFilterSheet that we update next).

- [ ] **Step 8: Commit.**

```bash
git add apps/mobile/src/screens/search/components/MobileFilterSheet.tsx
git commit -m "feat(mobile): MobileFilterSheet uses dynamic categories + subcategory section"
```

---

## Task 10: Switch `HomeScreen` to `getHierarchy()` + dynamic data

**Files:**
- Modify: `apps/mobile/src/screens/home/HomeScreen.tsx`
- Modify: `apps/mobile/src/navigation/AppNavigator.tsx` (widen route param type)

- [ ] **Step 1: Widen the navigation param type so categories from the API (not just `CategorySlug`) can be passed.**

Open `apps/mobile/src/navigation/AppNavigator.tsx`, find the type definition for the Search stack (or wherever `SearchMain`'s `category` param type lives). It currently uses `CategorySlug`. Replace with `string`.

If the file contains something like:

```ts
SearchMain: { category?: CategorySlug } | undefined;
```

change it to:

```ts
SearchMain: { category?: string } | undefined;
```

(If the actual key path differs, search for `category?: CategorySlug` across `apps/mobile/src/navigation/` and adjust those declarations.)

- [ ] **Step 2: Replace the `HomeScreen` imports and the `FALLBACK_STRIP` constant.**

Replace the import block (lines 15-30) with:

```tsx
import {
  CategoryStrip,
  FeaturedProviderCard,
  FeaturedProviderCardSkeleton,
  I,
  NearbyCard,
  NearbyCardSkeleton,
  type CategoryStripItem,
} from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import { useShrinkOnScroll } from '@/hooks/useShrinkOnScroll';
import { ShrinkingSearchHeader } from '@/components/shell';
import {
  buildCategoryLookup,
  providerToCardData,
} from '@/lib/providerAdapter';
import type { MainTabParamList } from '@/navigation/AppNavigator';
```

(Removes the `toCategorySlug` import + `CategorySlug` type import.)

Delete the entire `FALLBACK_STRIP` constant block.

- [ ] **Step 3: Replace the data-fetching + memos at the top of `HomeScreen()`.**

Replace from `const { data: categoriesData } = useQuery({...})` through `const cards = useMemo(...)` with:

```tsx
  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.hierarchy,
    queryFn: () => api.categories.getHierarchy(),
    staleTime: 5 * 60 * 1000,
  });

  const apiCategories = React.useMemo(() => {
    const arr = Array.isArray(categoriesData)
      ? categoriesData
      : ((categoriesData as { categories?: unknown[] })?.categories ?? []);
    return (arr as Array<Record<string, unknown>>).map((cat) => ({
      slug: (cat.slug as string) ?? '',
      name: (cat.name as string) ?? '',
      icon: (cat.icon as string | null) ?? null,
      color: (cat.color as string | null) ?? null,
    }));
  }, [categoriesData]);

  const categoryLookup = React.useMemo(
    () => buildCategoryLookup(apiCategories),
    [apiCategories],
  );

  const stripItems: CategoryStripItem[] = React.useMemo(
    () =>
      apiCategories
        .filter((c) => c.slug.length > 0)
        .slice(0, 8)
        .map((c) => ({
          slug: c.slug,
          label: c.name,
          iconName: c.icon ?? undefined,
          color: c.color ?? undefined,
        })),
    [apiCategories],
  );

  const {
    data: providersData,
    isLoading: providersLoading,
    refetch: refetchProviders,
  } = useQuery({
    queryKey: queryKeys.providers.search({ limit: 10 }),
    queryFn: () => api.providers.search({ limit: 10 }),
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchProviders();
    setRefreshing(false);
  };

  const providers = providersData?.providers ?? [];
  const cards = useMemo(
    () => providers.map((p) => providerToCardData(p, categoryLookup)),
    [providers, categoryLookup],
  );
```

- [ ] **Step 4: Widen `goToSearch` to accept a `string` slug.**

Replace:

```tsx
  const goToSearch = (category?: CategorySlug) => {
    navigation.navigate('Search', { screen: 'SearchMain', params: { category } } as never);
  };
```

with:

```tsx
  const goToSearch = (category?: string) => {
    navigation.navigate('Search', { screen: 'SearchMain', params: { category } } as never);
  };
```

- [ ] **Step 5: Type-check.**

Run: `cd apps/mobile && pnpm exec tsc -p tsconfig.json --noEmit`
Expected: errors only in `SearchScreen.tsx`.

- [ ] **Step 6: Commit.**

```bash
git add apps/mobile/src/screens/home/HomeScreen.tsx apps/mobile/src/navigation/AppNavigator.tsx
git commit -m "feat(mobile): HomeScreen dynamic categories from getHierarchy()"
```

---

## Task 11: Switch `SearchScreen` to `getHierarchy()` + subcategory wiring

**Files:**
- Modify: `apps/mobile/src/screens/search/SearchScreen.tsx`

- [ ] **Step 1: Replace the imports block.**

Replace (around lines 17-30) with:

```tsx
import {
  CategoryStrip,
  I,
  WideProviderCard,
  WideProviderCardSkeleton,
  type CategoryStripItem,
} from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import { FloatingBackButton, IconButton } from '@/components/shell';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  buildCategoryLookup,
  providerToCardData,
} from '@/lib/providerAdapter';
import {
  MobileFilterSheet,
  MOBILE_SORT_LABELS,
  EMPTY_FILTERS,
  type MobileFilters,
} from './components/MobileFilterSheet';
import type { SearchStackParamList } from '@/navigation/AppNavigator';
```

(Removes `tokens`, `CategorySlug`, `toCategorySlug` imports.)

- [ ] **Step 2: Delete the `FALLBACK_STRIP` constant.**

- [ ] **Step 3: Replace the `initialCategory` derivation + the `useState<MobileFilters>` init.**

Replace:

```tsx
  const initialCategory = route.params?.category
    ? toCategorySlug(route.params.category)
    : null;

  const [filters, setFilters] = useState<MobileFilters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
  });
```

with:

```tsx
  const initialCategory = route.params?.category ?? null;

  const [filters, setFilters] = useState<MobileFilters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
  });
```

- [ ] **Step 4: Replace the route-param `useEffect`.**

Replace:

```tsx
  useEffect(() => {
    if (route.params?.category) {
      setFilters((f) => ({ ...f, category: toCategorySlug(route.params!.category!) }));
    }
  }, [route.params?.category]);
```

with:

```tsx
  useEffect(() => {
    if (route.params?.category) {
      setFilters((f) => ({ ...f, category: route.params!.category!, subcategory: null }));
    }
  }, [route.params?.category]);
```

- [ ] **Step 5: Add `subcategory` to the `ProviderSearchParams` mapping inside the `searchParams` useMemo.**

Replace the existing `searchParams` useMemo body with:

```tsx
  const searchParams = useMemo<Partial<ProviderSearchParams>>(
    () => ({
      category: filters.category ?? undefined,
      subcategory: filters.subcategory ?? undefined,
      q: filters.q.trim() || undefined,
      city: filters.city.trim() || undefined,
      available: filters.available || undefined,
      verified: filters.verified || undefined,
      minRating: filters.minRating ?? undefined,
      minPrice: parseFilterNumber(filters.minPrice),
      maxPrice: parseFilterNumber(filters.maxPrice),
      sortBy:
        filters.sort === 'newest'
          ? 'createdAt'
          : filters.sort === 'price_low' || filters.sort === 'price_high'
            ? 'hourlyRate'
            : 'recommended',
      sortOrder:
        filters.sort === 'price_high'
          ? 'desc'
          : filters.sort === 'price_low'
            ? 'asc'
            : undefined,
      limit: 30,
    }),
    [filters],
  );
```

- [ ] **Step 6: Switch the categories query to `getHierarchy` and build the lookup + filter-category structure.**

Replace the `const { data: categoriesData } = useQuery(...)` block + the `stripItems` useMemo + the `rawProviders`/`rawCards`/`cards` block with:

```tsx
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories.hierarchy,
    queryFn: () => api.categories.getHierarchy(),
    staleTime: 5 * 60 * 1000,
  });

  const apiCategories = useMemo(() => {
    const arr = Array.isArray(categoriesData)
      ? categoriesData
      : ((categoriesData as { categories?: unknown[] })?.categories ?? []);
    return (arr as Array<Record<string, unknown>>).map((cat) => ({
      slug: (cat.slug as string) ?? '',
      name: (cat.name as string) ?? '',
      icon: (cat.icon as string | null) ?? null,
      color: (cat.color as string | null) ?? null,
      subcategories: Array.isArray(cat.subcategories)
        ? (cat.subcategories as Array<Record<string, unknown>>).map((sub) => ({
            slug: (sub.slug as string) ?? '',
            name: (sub.name as string) ?? '',
          }))
        : [],
    }));
  }, [categoriesData]);

  const categoryLookup = useMemo(
    () => buildCategoryLookup(apiCategories),
    [apiCategories],
  );

  const stripItems: CategoryStripItem[] = useMemo(
    () =>
      apiCategories
        .filter((c) => c.slug.length > 0)
        .slice(0, 8)
        .map((c) => ({
          slug: c.slug,
          label: c.name,
          iconName: c.icon ?? undefined,
          color: c.color ?? undefined,
        })),
    [apiCategories],
  );

  const filterCategories = useMemo(
    () =>
      apiCategories
        .filter((c) => c.slug.length > 0)
        .map((c) => ({
          slug: c.slug,
          label: c.name,
          icon: c.icon,
          color: c.color,
          subcategories: c.subcategories
            .filter((s) => s.slug.length > 0)
            .map((s) => ({ slug: s.slug, label: s.name })),
        })),
    [apiCategories],
  );

  const {
    data: providersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.providers.search(searchParams),
    queryFn: () => api.providers.search(searchParams),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const rawProviders = providersData?.providers ?? [];
  const cards = useMemo(
    () => rawProviders.map((p) => providerToCardData(p, categoryLookup)),
    [rawProviders, categoryLookup],
  );
  const totalResults = providersData?.pagination.total ?? cards.length;
  const locationLabel = filters.city.trim() || 'Toutes zones';
```

- [ ] **Step 7: Update `queryLabel` to no longer depend on `stripItems`'s shape (now plain `string` slugs).**

Replace:

```tsx
  const queryLabel =
    filters.q.trim() ||
    (filters.category
      ? (stripItems.find((s) => s.slug === filters.category)?.label ??
        filters.category)
      : 'Trouver un pro');
```

with:

```tsx
  const queryLabel =
    filters.q.trim() ||
    (filters.category
      ? (apiCategories.find((c) => c.slug === filters.category)?.name ??
        filters.category)
      : 'Trouver un pro');
```

- [ ] **Step 8: Update the `<CategoryStrip>` onSelect to clear the subcategory when category changes, and update `MobileFilterSheet`'s `categoriesAvailable` prop.**

Update the `<CategoryStrip>` JSX:

```tsx
          <CategoryStrip
            items={stripItems}
            active={filters.category ?? undefined}
            onSelect={(slug) =>
              setFilters((f) => ({
                ...f,
                category: f.category === slug ? null : slug,
                subcategory: null,
              }))
            }
          />
```

Update the `<MobileFilterSheet>` JSX at the bottom of the component:

```tsx
      <MobileFilterSheet
        open={sheetOpen}
        initial={filters}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
        categoriesAvailable={filterCategories}
        categoriesLoading={categoriesLoading}
      />
```

- [ ] **Step 9: Type-check.**

Run: `cd apps/mobile && pnpm exec tsc -p tsconfig.json --noEmit`
Expected: exits 0.

- [ ] **Step 10: Commit.**

```bash
git add apps/mobile/src/screens/search/SearchScreen.tsx
git commit -m "feat(mobile): SearchScreen dynamic categories + subcategory filter"
```

---

## Task 12: Final type-check + Expo smoke test

**Files:** none.

- [ ] **Step 1: Run the full type-check across the workspace.**

Run from repo root:

```bash
pnpm --filter @kayu/ui type-check
pnpm --filter @kayu/web type-check
cd apps/mobile && pnpm exec tsc -p tsconfig.json --noEmit && cd -
```

Expected: all three exit 0. If any fail, the previous task left a regression — fix it before continuing.

- [ ] **Step 2: Start the Expo dev server.**

Run: `cd apps/mobile && pnpm start` (or `pnpm exec expo start`)
Open on a simulator/device.

- [ ] **Step 3: Verify Home screen.**

- [ ] Category strip shows real admin-created categories (names + icons + colors), not the static portfolio set.
- [ ] Tapping a category navigates to Search with that category preselected.
- [ ] Featured carousel cards show: dynamic SpecialtyTag (category name + icon + color from API), avatar in bottom-right, and a secondary-chips row in the body when the provider has 2+ categories.
- [ ] NearbyCard rows show dynamic colored mini tile with the correct category icon.

- [ ] **Step 4: Verify Search screen.**

- [ ] Category strip is dynamic (same data as home).
- [ ] Opening the filter sheet shows full admin category list with icon swatches in the category colors.
- [ ] Selecting a category reveals a "Spécialité" section listing its subcategories from the API.
- [ ] Tapping a subcategory passes `subcategory` to the providers search.
- [ ] WideProviderCard results show dynamic SpecialtyTag + secondary chips with category icons tinted in their colors.

- [ ] **Step 5: Verify no avatar regressions.**

- [ ] Providers without an `avatarUrl` still show initials inside the bottom-right circle on Featured/Wide cards.
- [ ] Providers with an `avatarUrl` show the photo cropped to a circle.

- [ ] **Step 6: Commit anything that was tweaked during smoke testing (if applicable).**

```bash
git status
# if changes:
git add -A
git commit -m "fix(mobile): smoke-test follow-ups"
```

---

## Self-Review (run after the plan is complete)

### Spec coverage

- ✅ Dynamic category strip on home → Task 10
- ✅ Dynamic category list + subcategories on search filter → Tasks 9 + 11
- ✅ Dynamic icon/color on provider card tiles → Tasks 5, 6, 7
- ✅ Secondary category chips with icons → Tasks 5, 6 (with reusable SecondaryCategoryRow)
- ✅ NearbyRow dynamic icon/color (no chips, deliberately) → Task 7
- ✅ `resolveLucideIcon` + `FallbackCategoryIcon` parity with web → Task 2
- ✅ `buildCategoryLookup` + enriched `providerToCardData` parity with web → Task 8
- ✅ Drop `FALLBACK_STRIP` and `DEFAULT_CATEGORIES` constants → Tasks 9, 10, 11
- ✅ Widen `CategorySlug` → `string` where API data flows → Tasks 3, 9, 10
- ✅ Switch from `getAll()` → `getHierarchy()` → Tasks 10, 11

### Placeholder scan

- No "TBD", "TODO", or vague steps. Every code-touching step has a complete code block.
- One soft spot: Task 10 Step 1 says "if the actual key path differs, search for `category?: CategorySlug`". This is an acceptable fallback because the param's exact location depends on the navigation file's layout, but the action is concrete (grep + replace).

### Type consistency

- `CategoryStripItem.slug` is `string` (Task 3), consumed as `string` in HomeScreen + SearchScreen (Tasks 10, 11).
- `MobileFilters.category` is `string | null` (Task 9), consumed as `string` for navigation params (Task 10 widens that too).
- `MobileFilterCategory` from Task 9 matches the `filterCategories` shape built in Task 11 Step 6.
- `secondaryCategories` shape on `ProviderCardData` is the one we already shipped to web in this session (`packages/ui/src/cards.ts`) — mobile picks it up for free.

No issues found.
