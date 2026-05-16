# Settings — Provider Data Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the four provider data sections on `/dashboard/settings` actually editable — Services & tarifs, Profil pro → Présentation publique, Zones d'intervention, Disponibilités toggle — using only existing endpoints.

**Architecture:** All changes are in one file, `apps/web/src/app/dashboard/settings/page.tsx`, replacing four display-only stub components/cards with real editors that follow the page's existing primitives (`SettingsHeader`/`CardSection`/`CardTitle`/`FieldRow`/`TextField`/`Toggle`) and the existing `ProfileSection` save pattern. Reads come from `onboardingApi.getDraft()` (post-publish it returns the live provider's fields) + `categoriesApi.getAll`; writes via `providersApi.updateMe` (partial — each section sends only its fields) and `providersApi.updateAvailability`. No new backend, no new query keys.

**Tech Stack:** Next.js App Router (client component), `@tanstack/react-query`, `@kayu/api` (`onboardingApi`, `providersApi`, `categoriesApi`, `dashboardApi`, `queryKeys`), `@kayu/schemas` (types), `sonner`-backed `useToast`. Constants reused from `apps/web/src/app/pro/onboarding/types.ts`.

**No web test harness exists** (`apps/web` has no vitest/jest; `lint` is a no-op). Per-task verification = `pnpm --filter @kayu/web type-check` (must be 0 errors) + an explicit manual smoke note. This is intentional per the spec.

**Memory note:** No per-task commits — batch into the single commit in the final task. Per-task "Commit" steps are written for tooling consistency; in subagent execution skip them and commit once at the end.

**Reference — exact shapes (verified, do not re-investigate):**
- `onboardingApi(apiClient).getDraft()` → `DraftResponse = { draft: ProviderDraftDto; step: number|null; isComplete: boolean; missingForPublish: string[] }`. Post-publish, `draft` carries the live provider: `profession?`, `description?`, `yearsOfExperience?` (= provider.experience), `hourlyRate?`, `categoryIds?: string[]`, `subcategoryIds?: string[]`, `skills?: {name:string; level:number}[]`, `serviceZones?: {city:string; commune:string|null}[]`, `languages?: string[]`, `firstName?/lastName?/phone?/avatar?`.
- `providersApi(apiClient).updateMe(data)` → `{ success: boolean }`. `data: UpdateProviderDto` = all optional: `profession?: string(min2)`, `description?: string(max1000)|null`, `experience?: int(0..50)|null`, `hourlyRate?: number(>=0)|null`, `isAvailable?: boolean`, `languages?: string[]`, `categoryIds?: string[](max3)`, `subcategoryIds?: string[](max3)`, `skills?: {name:string(min1); level?:int(1..5)}[]`, `serviceZones?: {city:string; commune?:string|null}[]`.
- `providersApi(apiClient).updateAvailability({ isAvailable: boolean })` → `{ success: boolean; isAvailable: boolean }`.
- `categoriesApi(apiClient).getAll({ withSubcategories: true })` → `{ categories: { id:string; slug:string; name:string; subcategories?: { id:string; name:string; slug?:string; categoryId?:string }[] }[] }`.
- `dashboardApi(apiClient).getProviderDashboard()` → `DashboardProviderResponse` with `.availability.isAvailable: boolean`.
- Query keys (existing): `queryKeys.onboarding.draft`, `queryKeys.categories.all`, `queryKeys.dashboard.provider`, `queryKeys.providers.strength`.
- `apps/web/src/app/pro/onboarding/types.ts` exports (pure module, safe to import here): `CITIES` (`[{ name:"Kinshasa"; communes:string[] }]`), `YEARS_OPTIONS` (`readonly ["< 1 an","1–3 ans","4–7 ans","8+ ans"]`), `LANGUAGES` (`string[]`), `SKILL_SUGGESTIONS` (`Partial<Record<CategorySlug,string[]>>`).
- The settings page is `'use client'` and already imports `useMutation` from `@tanstack/react-query`, `useAuth` from `@/contexts/AuthContext`, `apiClient` from `@/lib/api`, `identityApi` from `@kayu/api`, `useToast` from `@/hooks/use-toast`. Existing local primitives in the file: `SettingsHeader`, `CardSection`, `CardTitle`, `FieldRow`, `TextField`, `Toggle`, `ComingLaterChip`. The stub components to replace: `ServicesSection()` (no props), `ZonesSection()` (no props), `AvailabilitySection()` (no props), and the `!isClient` "Présentation publique" `<CardSection>` block inside `ProfileSection({ role })`.

---

### Task 1: Imports + shared local helpers

**Files:**
- Modify: `apps/web/src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Extend the imports**

At the top of `apps/web/src/app/dashboard/settings/page.tsx`:

- Change the react-query import line `import { useMutation } from '@tanstack/react-query';` to:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
```
- Change `import { identityApi } from '@kayu/api';` to:
```ts
import {
  identityApi,
  onboardingApi,
  providersApi,
  categoriesApi,
  dashboardApi,
  queryKeys,
} from '@kayu/api';
```
- Add these imports below the existing import block:
```ts
import {
  CITIES,
  YEARS_OPTIONS,
  LANGUAGES,
  SKILL_SUGGESTIONS,
} from '@/app/pro/onboarding/types';
import type { CategorySlug } from '@kayu/ui';
```

- [ ] **Step 2: Add shared helpers near the other module-level helpers**

Add this block immediately after the `ComingLaterChip` component definition (the function ends with `);\n}` near the "// ───── Profile" comment). Paste exactly:

```ts
// ───── Provider-data editor helpers ─────────────────────────────────────

const YEARS_TO_NUMBER: Record<string, number> = {
  '< 1 an': 0,
  '1–3 ans': 2,
  '4–7 ans': 5,
  '8+ ans': 10,
};

function numberToYearsBucket(value: number | null | undefined): string {
  if (value === undefined || value === null) return '';
  if (value <= 0) return '< 1 an';
  if (value <= 3) return '1–3 ans';
  if (value <= 7) return '4–7 ans';
  return '8+ ans';
}

function ChipButton({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 12px',
        borderRadius: 999,
        border: `1px solid ${selected ? 'var(--k-primary)' : 'var(--k-border)'}`,
        background: selected ? 'var(--k-surface-primary)' : 'var(--k-surface)',
        color: selected ? 'var(--k-primary-hover)' : 'var(--k-text-body)',
        fontSize: 12.5,
        fontWeight: selected ? 700 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SaveBar({
  onSave,
  pending,
  disabled,
  hint,
}: {
  onSave: () => void;
  pending: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex justify-end items-center gap-3">
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--k-text-subtle)' }}>{hint}</span>
      )}
      <button
        onClick={onSave}
        disabled={pending || disabled}
        style={{
          padding: '9px 16px',
          background: 'var(--k-text-primary)',
          color: 'white',
          border: 0,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: pending || disabled ? 'not-allowed' : 'pointer',
          opacity: pending || disabled ? 0.6 : 1,
        }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}

function useProviderDraft() {
  return useQuery({
    queryKey: queryKeys.onboarding.draft,
    queryFn: () => onboardingApi(apiClient).getDraft(),
  });
}

function useProviderDataInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.onboarding.draft });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
    qc.invalidateQueries({ queryKey: queryKeys.providers.strength });
  };
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: 0 errors. (The new imports/helpers are unused until later tasks — TS does not error on unused module-level functions; if the project's tsconfig has `noUnusedLocals`, the helpers are exported-by-use in later tasks within the same file so they are referenced before this plan completes. Confirm 0 errors; if `noUnusedLocals` flags `ChipButton`/`SaveBar`/`useProviderDraft`/`useProviderDataInvalidation`/the maps/imports, that is expected to clear once Tasks 2–5 land — proceed; the final gate Task 6 is the authoritative 0-error check.)

> Note for the executor: if `noUnusedLocals`/`noUnusedParameters` is enabled and Step 3 reports unused-symbol errors ONLY for these new helpers/imports, that is acceptable mid-plan; do not "fix" by deleting them. Tasks 2–5 consume every one. Task 6 verifies true 0-errors at the end.

- [ ] **Step 4: Commit** (batch — see Memory note)

```bash
git add apps/web/src/app/dashboard/settings/page.tsx
git commit -m "chore(settings): imports + shared helpers for provider-data editors"
```

---

### Task 2: Services & tarifs editor

**Files:**
- Modify: `apps/web/src/app/dashboard/settings/page.tsx` (replace `function ServicesSection() { ... }`)

- [ ] **Step 1: Replace the `ServicesSection` stub**

Find the current stub (starts `function ServicesSection() {` and ends at its closing `}` before `function AvailabilitySection()`). Replace the ENTIRE function with exactly:

```tsx
function ServicesSection() {
  const { toast } = useToast();
  const invalidate = useProviderDataInvalidation();
  const draftQ = useProviderDraft();
  const catsQ = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi(apiClient).getAll({ withSubcategories: true }),
  });

  const [profession, setProfession] = useState('');
  const [hourly, setHourly] = useState('');
  const [years, setYears] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !draftQ.data) return;
    const d = draftQ.data.draft;
    setProfession(d.profession ?? '');
    setHourly(d.hourlyRate != null ? String(d.hourlyRate) : '');
    setYears(numberToYearsBucket(d.yearsOfExperience));
    setCategoryIds((d.categoryIds ?? []).slice(0, 3));
    setSubcategoryIds((d.subcategoryIds ?? []).slice(0, 3));
    setSkills((d.skills ?? []).map((s) => s.name));
    setLoaded(true);
  }, [draftQ.data, loaded]);

  const categories = catsQ.data?.categories ?? [];
  const selectedCats = categories.filter((c) => categoryIds.includes(c.id));
  const availableSubcats = selectedCats.flatMap((c) => c.subcategories ?? []);
  const skillSuggestions = Array.from(
    new Set(
      selectedCats.flatMap((c) =>
        SKILL_SUGGESTIONS[c.slug as CategorySlug] ?? [],
      ),
    ),
  ).filter((s) => !skills.includes(s));

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        const stillValid = new Set(
          categories
            .filter((c) => next.includes(c.id))
            .flatMap((c) => (c.subcategories ?? []).map((s) => s.id)),
        );
        setSubcategoryIds((subs) => subs.filter((s) => stillValid.has(s)));
        return next;
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };
  const toggleSub = (id: string) =>
    setSubcategoryIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id],
    );
  const toggleSkill = (name: string) =>
    setSkills((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills((p) => [...p, v]);
    setSkillInput('');
  };

  const mutation = useMutation({
    mutationFn: () =>
      providersApi(apiClient).updateMe({
        profession: profession.trim(),
        hourlyRate: hourly === '' ? null : Math.max(0, Number(hourly)),
        experience: years ? YEARS_TO_NUMBER[years] : null,
        categoryIds,
        subcategoryIds,
        skills: skills.map((name) => ({ name, level: 3 })),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Services mis à jour', description: 'Vos services et tarifs ont été enregistrés.' });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour vos services.' }),
  });

  const canSave = profession.trim().length >= 2 && categoryIds.length >= 1;

  return (
    <div>
      <SettingsHeader
        title="Services & tarifs"
        subtitle="Ce que vous proposez et combien vous facturez."
      />
      <CardSection>
        <CardTitle title="Activité" />
        <FieldRow label="Intitulé d'activité" hint="Ex : Plombier certifié.">
          <TextField value={profession} onChange={setProfession} placeholder="Plombier certifié" />
        </FieldRow>
        <FieldRow label="Prix de départ" hint="Affiché « à partir de … FC ».">
          <TextField value={hourly} onChange={setHourly} type="number" suffix="FC" placeholder="8000" />
        </FieldRow>
        <FieldRow label="Expérience">
          <div className="flex flex-wrap gap-2">
            {YEARS_OPTIONS.map((y) => (
              <ChipButton key={y} selected={years === y} onClick={() => setYears(y)}>
                {y}
              </ChipButton>
            ))}
          </div>
        </FieldRow>
      </CardSection>

      <CardSection>
        <CardTitle title="Catégories" subtitle={`${categoryIds.length}/3 — jusqu'à trois.`} />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const sel = categoryIds.includes(c.id);
            return (
              <ChipButton
                key={c.id}
                selected={sel}
                disabled={!sel && categoryIds.length >= 3}
                onClick={() => toggleCategory(c.id)}
              >
                {c.name}
              </ChipButton>
            );
          })}
        </div>
        {availableSubcats.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--k-text-body)', marginBottom: 8 }}>
              Sous-catégories <span style={{ color: 'var(--k-text-subtle)' }}>({subcategoryIds.length}/3)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSubcats.map((s) => {
                const sel = subcategoryIds.includes(s.id);
                return (
                  <ChipButton
                    key={s.id}
                    selected={sel}
                    disabled={!sel && subcategoryIds.length >= 3}
                    onClick={() => toggleSub(s.id)}
                  >
                    {s.name}
                  </ChipButton>
                );
              })}
            </div>
          </div>
        )}
      </CardSection>

      <CardSection>
        <CardTitle title="Compétences" subtitle="Les clients filtrent par compétence." />
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
          {skills.map((s) => (
            <ChipButton key={s} selected onClick={() => toggleSkill(s)}>
              {s} ✕
            </ChipButton>
          ))}
          {skills.length === 0 && (
            <span style={{ fontSize: 12.5, color: 'var(--k-text-subtle)' }}>
              Aucune compétence ajoutée.
            </span>
          )}
        </div>
        {skillSuggestions.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, color: 'var(--k-text-subtle)', marginBottom: 6 }}>
              Suggestions
            </div>
            <div className="flex flex-wrap gap-2">
              {skillSuggestions.map((s) => (
                <ChipButton key={s} selected={false} onClick={() => toggleSkill(s)}>
                  + {s}
                </ChipButton>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div style={{ flex: 1 }}>
            <TextField
              value={skillInput}
              onChange={setSkillInput}
              placeholder="Ajouter une compétence"
            />
          </div>
          <button
            type="button"
            onClick={addSkill}
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid var(--k-border)',
              background: 'var(--k-surface)',
              color: 'var(--k-text-body)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ajouter
          </button>
        </div>
      </CardSection>

      <SaveBar
        onSave={() => mutation.mutate()}
        pending={mutation.isPending}
        disabled={!canSave}
        hint={!canSave ? 'Intitulé (2+ caractères) et au moins une catégorie requis.' : undefined}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: 0 errors attributable to `page.tsx` (`useEffect`/`useState` are already imported at the top of the file; if `useEffect` is not in the React import, add it to the existing `import { ... } from 'react';` line — verify and fix minimally).

- [ ] **Step 3: Manual smoke note (executor records, human runs later)**

As a published provider: open `/dashboard/settings` → "Services & tarifs". Fields prefill from current data. Edit profession/prix/expérience, toggle categories (cap 3), subcategories filter to chosen categories (cap 3), add/remove skills (chip + suggestions + free input). "Enregistrer" disabled until profession ≥2 chars and ≥1 category. Save → success toast; reload → values persist; provider dashboard / Renforce ton profil reflect the change.

- [ ] **Step 4: Commit** (batch — see Memory note)

```bash
git add apps/web/src/app/dashboard/settings/page.tsx
git commit -m "feat(settings): wire Services & tarifs editor"
```

---

### Task 3: Profil pro → Présentation publique editor

**Files:**
- Modify: `apps/web/src/app/dashboard/settings/page.tsx` (the `!isClient` `<CardSection>` block inside `ProfileSection`)

- [ ] **Step 1: Replace the provider "Présentation publique" stub card**

Inside `function ProfileSection({ role }: { role: Role })`, find the block:

```tsx
      {!isClient && (
        <CardSection>
          <CardTitle
            title="Présentation publique"
            subtitle="Profession, bio et préférences détaillées"
          />
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--k-text-muted)',
              padding: 12,
              background: 'var(--k-surface-muted)',
              borderRadius: 10,
              lineHeight: 1.5,
            }}
          >
            La bio, l’activité principale et les langues parlées s'éditent depuis le parcours
            d'onboarding pro et la fiche prestataire. Une édition rapide depuis les réglages
            arrive dans une prochaine itération.
          </div>
        </CardSection>
      )}
```

Replace it with exactly:

```tsx
      {!isClient && <PresentationPubliqueCard />}
```

- [ ] **Step 2: Add the `PresentationPubliqueCard` component**

Add this new component immediately AFTER the `ProfileSection` function's closing `}` (before `// ───── Language`):

```tsx
function PresentationPubliqueCard() {
  const { toast } = useToast();
  const invalidate = useProviderDataInvalidation();
  const draftQ = useProviderDraft();

  const [description, setDescription] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !draftQ.data) return;
    const d = draftQ.data.draft;
    setDescription(d.description ?? '');
    setLanguages(d.languages ?? []);
    setLoaded(true);
  }, [draftQ.data, loaded]);

  const toggleLang = (l: string) =>
    setLanguages((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );

  const mutation = useMutation({
    mutationFn: () =>
      providersApi(apiClient).updateMe({
        description: description.trim() === '' ? null : description.trim().slice(0, 1000),
        languages,
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Présentation mise à jour', description: 'Votre bio et vos langues ont été enregistrées.' });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour la présentation.' }),
  });

  return (
    <>
      <CardSection>
        <CardTitle title="Présentation publique" subtitle="Bio et langues visibles sur votre fiche." />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--k-text-body)', marginBottom: 6 }}>
            À propos de moi
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            placeholder="Plombier indépendant depuis 2018, spécialisé en chauffe-eau et fuites."
            style={{
              width: '100%',
              minHeight: 110,
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--k-border)',
              background: 'var(--k-surface)',
              fontSize: 13.5,
              lineHeight: 1.5,
              color: 'var(--k-text-primary)',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--k-text-subtle)', textAlign: 'right', marginTop: 4 }}>
            {description.length} / 1000
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--k-text-body)', marginBottom: 6 }}>
            Langues parlées
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <ChipButton key={l} selected={languages.includes(l)} onClick={() => toggleLang(l)}>
                {l}
              </ChipButton>
            ))}
          </div>
        </div>
      </CardSection>
      <SaveBar onSave={() => mutation.mutate()} pending={mutation.isPending} />
    </>
  );
}
```

> Note: `ProfileSection` already renders its own personal-info save button (firstName/lastName/phone/city via `identityApi.completeProfile`). `PresentationPubliqueCard` has its own independent `SaveBar` and writes only `description`/`languages` via `providersApi.updateMe` — the two saves never overlap fields. The page renders `<ProfileSection role={role} />` already; no call-site change beyond Step 1.

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: 0 errors attributable to `page.tsx`.

- [ ] **Step 4: Manual smoke note**

Provider → Settings → "Profil pro". Personal-info card still saves as before (unchanged). New "Présentation publique" card prefills bio + langues; edit, save → toast; reload persists; dashboard/strength reflect (description completion).

- [ ] **Step 5: Commit** (batch)

```bash
git add apps/web/src/app/dashboard/settings/page.tsx
git commit -m "feat(settings): wire Présentation publique (bio + langues) editor"
```

---

### Task 4: Zones d'intervention editor

**Files:**
- Modify: `apps/web/src/app/dashboard/settings/page.tsx` (replace `function ZonesSection() { ... }`)

- [ ] **Step 1: Replace the `ZonesSection` stub**

Replace the entire `function ZonesSection() { ... }` with exactly:

```tsx
function ZonesSection() {
  const { toast } = useToast();
  const invalidate = useProviderDataInvalidation();
  const draftQ = useProviderDraft();

  const [zones, setZones] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !draftQ.data) return;
    const z = draftQ.data.draft.serviceZones ?? [];
    setZones(z.map((s) => `${s.city}|${s.commune ?? ''}`));
    setLoaded(true);
  }, [draftQ.data, loaded]);

  const toggleCommune = (city: string, commune: string) => {
    const key = `${city}|${commune}`;
    setZones((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  };
  const toggleAll = (city: string, communes: string[]) => {
    const keys = communes.map((c) => `${city}|${c}`);
    const allSel = keys.every((k) => zones.includes(k));
    setZones((prev) =>
      allSel
        ? prev.filter((z) => !keys.includes(z))
        : [...prev, ...keys.filter((k) => !prev.includes(k))],
    );
  };

  const mutation = useMutation({
    mutationFn: () =>
      providersApi(apiClient).updateMe({
        serviceZones: zones
          .map((k) => {
            const [city, commune] = k.split('|');
            if (!city) return null;
            return { city, commune: commune || null };
          })
          .filter((x): x is { city: string; commune: string | null } => x !== null),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Zones mises à jour', description: 'Vos communes desservies ont été enregistrées.' });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour vos zones.' }),
  });

  return (
    <div>
      <SettingsHeader
        title="Zones d'intervention"
        subtitle="Où acceptez-vous de vous déplacer ?"
      />
      <CardSection>
        {CITIES.map((city) => {
          const allSel = city.communes.every((c) => zones.includes(`${city.name}|${c}`));
          return (
            <div key={city.name} style={{ marginBottom: 8 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <CardTitle title={`Communes — ${city.name}`} />
                <button
                  type="button"
                  onClick={() => toggleAll(city.name, city.communes)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: '4px 4px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--k-primary-hover)',
                    cursor: 'pointer',
                  }}
                >
                  {allSel ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {city.communes.map((c) => (
                  <ChipButton
                    key={c}
                    selected={zones.includes(`${city.name}|${c}`)}
                    onClick={() => toggleCommune(city.name, c)}
                  >
                    {c}
                  </ChipButton>
                ))}
              </div>
            </div>
          );
        })}
      </CardSection>
      <SaveBar
        onSave={() => mutation.mutate()}
        pending={mutation.isPending}
        disabled={zones.length === 0}
        hint={zones.length === 0 ? 'Sélectionnez au moins une commune.' : undefined}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: 0 errors attributable to `page.tsx`.

- [ ] **Step 3: Manual smoke note**

Provider → Settings → "Zones d'intervention". Communes prefill from current zones; toggle individual communes; "Tout sélectionner/désélectionner" works; save disabled at zero zones with hint; save → toast; reload persists; dashboard reflects.

- [ ] **Step 4: Commit** (batch)

```bash
git add apps/web/src/app/dashboard/settings/page.tsx
git commit -m "feat(settings): wire Zones d'intervention editor"
```

---

### Task 5: Disponibilités toggle

**Files:**
- Modify: `apps/web/src/app/dashboard/settings/page.tsx` (replace `function AvailabilitySection() { ... }`)

- [ ] **Step 1: Replace the `AvailabilitySection` stub**

Replace the entire `function AvailabilitySection() { ... }` with exactly (keep the weekly-schedule deferred stub card — out of scope per spec):

```tsx
function AvailabilitySection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const dashQ = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
  });
  const current = dashQ.data?.availability?.isAvailable ?? true;

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      providersApi(apiClient).updateAvailability({ isAvailable: next }),
    onSuccess: (_res, next) => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      qc.invalidateQueries({ queryKey: queryKeys.providers.strength });
      toast({
        title: next ? 'Disponible' : 'Indisponible',
        description: next
          ? 'Vous recevez de nouvelles demandes.'
          : "Vous n'apparaissez plus dans les nouvelles recherches.",
      });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour la disponibilité.' }),
  });

  return (
    <div>
      <SettingsHeader
        title="Disponibilités"
        subtitle="Indiquez si vous acceptez de nouvelles demandes."
      />
      <CardSection>
        <CardTitle title="Statut actuel" />
        <Toggle
          on={current}
          disabled={dashQ.isLoading || mutation.isPending}
          onChange={(v) => mutation.mutate(v)}
          label="Disponible aux nouvelles demandes"
          hint={
            current
              ? 'Les clients peuvent vous trouver et vous solliciter.'
              : 'Vous restez invisible aux nouvelles demandes jusqu’à réactivation.'
          }
        />
      </CardSection>
      <CardSection>
        <CardTitle title="Horaires hebdomadaires" action={<ComingLaterChip />} />
        <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)', lineHeight: 1.5 }}>
          Le calendrier hebdomadaire détaillé sera disponible plus tard. En attendant,
          activez ou désactivez votre disponibilité ci-dessus.
        </div>
      </CardSection>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: 0 errors. (`Toggle`'s `onChange` is typed `(v: boolean) => void` and `on`/`disabled` exist per the existing `Toggle` primitive in this file — verified against the file. If `dashboardApi`'s response type does not expose `.availability.isAvailable` as `boolean`, narrow with `Boolean(dashQ.data?.availability?.isAvailable)` — but per the verified shape it is `boolean`.)

- [ ] **Step 3: Manual smoke note**

Provider → Settings → "Disponibilités". Toggle reflects current `isAvailable` (from dashboard). Flip it → toast → the pro dashboard availability + Renforce ton profil update (shared `queryKeys.dashboard.provider`). Weekly-schedule card remains the deferred stub.

- [ ] **Step 4: Commit** (batch)

```bash
git add apps/web/src/app/dashboard/settings/page.tsx
git commit -m "feat(settings): wire Disponibilités toggle"
```

---

### Task 6: Verification gate

**Files:** none

- [ ] **Step 1: Web type-check is fully green**

Run: `pnpm --filter @kayu/web type-check`
Expected: exit 0, **0** `error TS`. (Run `pnpm --filter @kayu/web type-check 2>&1 | grep -cE "error TS"` → `0`.) If `noUnusedLocals` flagged helpers in Task 1, they must now all be referenced (Tasks 2–5 use `ChipButton`, `SaveBar`, `useProviderDraft`, `useProviderDataInvalidation`, `YEARS_TO_NUMBER`, `numberToYearsBucket`, and every new import) — confirm zero errors.

- [ ] **Step 2: Confirm the four stubs are gone and informational sections untouched**

Run: `grep -nE "Édition à venir|Édition rapide à venir|arrive dans une prochaine itération|Géré depuis votre tableau de bord pro" apps/web/src/app/dashboard/settings/page.tsx`
Expected: NO matches for the four wired pieces' old stub strings. (The deferred "Horaires hebdomadaires" `ComingLaterChip`, plus Notifications/Language/Payment/Support/Sécurité/Danger/client-Privacy `ComingLaterChip`s, intentionally REMAIN — do not remove them.)

Run: `grep -c "ComingLaterChip" apps/web/src/app/dashboard/settings/page.tsx`
Expected: a non-zero count (the out-of-scope/informational chips are preserved). Visually confirm none of the remaining chips are on Services/Zones/Disponibilités-toggle/Présentation-publique.

- [ ] **Step 3: No backend/schema/api changes**

Run: `git status --porcelain`
Expected: only `apps/web/src/app/dashboard/settings/page.tsx` modified (plus the pre-existing unrelated `apps/web/next-env.d.ts` artifact). No `packages/**` or `apps/backend/**` changes (this plan adds no endpoints).

---

### Task 7: Single feature commit

**Files:** `apps/web/src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Review the diff**

Run: `git diff --stat -- apps/web/src/app/dashboard/settings/page.tsx`
Expected: one file changed; the four stub bodies replaced + imports/helpers added; informational sections untouched.

- [ ] **Step 2: One commit** (replaces the per-task commits — Memory note)

> If you committed per task during execution, this is a no-op; otherwise:

```bash
git add apps/web/src/app/dashboard/settings/page.tsx
git commit -m "feat(settings): make provider data sections editable

Wire Services & tarifs, Profil pro Présentation publique (bio + langues),
Zones d'intervention, and the Disponibilités toggle to the existing
providersApi.updateMe / updateAvailability + onboardingApi.getDraft, using
the settings page's existing primitives. No new backend. Out-of-scope and
informational sections (Notifications, Language, Payment, Support, Sécurité,
Danger, weekly schedule, client Privacy) left unchanged."
```

---

## Self-Review

Spec coverage:
- Services & tarifs full (profession/prix/expérience/catégories≤3/sous-catégories≤3/compétences) → Task 2. ✓
- Profil pro → Présentation publique (description≤1000 + languages), independent save, no field overlap with personal-info save → Task 3. ✓
- Zones (CITIES, "Tout sélectionner", ≥1 guard) → Task 4. ✓
- Disponibilités `isAvailable` toggle via `updateAvailability`, reads `dashboard.provider`, weekly-schedule stays deferred stub → Task 5. ✓
- Read via `onboardingApi.getDraft()` + `categoriesApi.getAll`; writes via `providersApi.updateMe`/`updateAvailability`; invalidate onboarding.draft + dashboard.provider + providers.strength → Tasks 1–5 (`useProviderDraft`, `useProviderDataInvalidation`). ✓
- 400-avoidance UI constraints (profession≥2, ≥1 category, cat/subcat ≤3, hourlyRate≥0, block empty zones) → Task 2 `canSave`, Task 4 `disabled`. ✓
- Existing primitives/design language reused; out-of-scope/informational sections untouched → Task 6 grep gate. ✓
- Testing = type-check + manual smoke (no web harness; backend unchanged) → each task Step 2/3, Task 6. ✓

Placeholder scan: every step has complete code or an exact command + expected result; the only conditionals (Task 1 `noUnusedLocals`, Task 5 type narrowing) are fully specified both ways. No TBD/TODO.

Type consistency: `useProviderDraft()` returns the `getDraft()` query; `.data.draft` fields (`profession`, `hourlyRate`, `yearsOfExperience`, `categoryIds`, `subcategoryIds`, `skills[].name`, `serviceZones[].city/commune`, `description`, `languages`) are read consistently across Tasks 2–4. `providersApi.updateMe` payload fields match `UpdateProviderDto`. `ChipButton`/`SaveBar`/`useProviderDraft`/`useProviderDataInvalidation`/`YEARS_TO_NUMBER`/`numberToYearsBucket` are defined once in Task 1 and consumed with identical signatures in Tasks 2–5. `Toggle` props (`on`/`onChange`/`label`/`hint`/`disabled`) match the existing primitive. No new query keys introduced.
