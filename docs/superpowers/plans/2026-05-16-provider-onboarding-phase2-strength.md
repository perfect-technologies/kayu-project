# Provider Onboarding — Plan 3: Phase 2 Strength Module + Editors (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
>
> **Depends on Plan 1 (backend: `providersApi.getStrength`, `mediaApi`, portfolio CRUD, verification real-storage) AND Plan 2 (Phase 1 wizard) being merged.** Run `pnpm --filter @kayu/schemas build && pnpm --filter @kayu/api build` before starting.

**Goal:** Add the post-publish "Renforce ton profil" module to the pro dashboard (honest tiers, live preview, task list) and the four scaffolded editors it links to — photo, portfolio (guided chantier), bio (tap-to-build), and verification (real upload wired into the existing `/pro/verify`).

**Architecture:** A shared upload helper (`lib/upload.ts`) does sign→upload via the existing browser Supabase client. `RenforceTonProfil` is a dashboard component fed by `providersApi.getStrength` and inserted into `ProviderDashboardClient`. The `deriveProfileGaps` TodoStrip duplication is removed (the module owns enrichment). Editors are AppShell-wrapped routes under `apps/web/src/app/pro/profile/*` (photo, portfolio, portfolio/new, presentation). Verification reuses the existing `/pro/verify` flow with `VerifyWizard` modified to upload the real file. Styling: sanctioned `var(--k-*)` + `.k-*` classes + `@kayu/ui/web` (`I`, `InlineAlert`, `Chip`).

**Tech Stack:** Next.js App Router, `@tanstack/react-query`, `@kayu/api` (`providersApi`, `mediaApi`, `verificationApi`, `dashboardApi`), `@supabase/ssr` browser client (`uploadToSignedUrl`, confirmed at `@supabase/storage-js@2.103.0`), `@kayu/ui/web`, `sonner`.

**No web test harness** — verification = `pnpm --filter @kayu/web type-check` + explicit manual smoke. **Memory note:** batch all work into the single commit in the final task.

**Dev servers:** `pnpm --filter @kayu/backend start:dev` + `pnpm --filter @kayu/web dev`. Test as a PUBLISHED provider (complete Plan 2's wizard first, or use a seeded provider account).

---

### Task 1: Shared upload helper

**Files:**
- Create: `apps/web/src/lib/upload.ts`

- [ ] **Step 1: Implement the helper**

Create `apps/web/src/lib/upload.ts`:

```ts
import { createClient } from "@/lib/supabase";
import { apiClient } from "@/lib/api";
import { mediaApi } from "@kayu/api";

export type UploadPurpose = "avatar" | "portfolio" | "verification";

/**
 * Sign + upload a file to Supabase Storage and return the stored object path.
 * The backend `mediaApi.sign` issues a signed upload URL+token; the browser
 * Supabase client uploads the bytes directly (no file goes through NestJS).
 */
export async function uploadFile(
  purpose: UploadPurpose,
  file: File,
): Promise<{ path: string }> {
  const signed = await mediaApi(apiClient).sign({
    purpose,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, file);
  if (error) {
    throw new Error(error.message || "Téléversement impossible");
  }
  return { path: signed.path };
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS — `mediaApi` resolves from the Plan 1-built `@kayu/api`; `createClient().storage.from(...).uploadToSignedUrl` exists at the installed `@supabase/storage-js@2.103.0`.

---

### Task 2: `RenforceTonProfil` dashboard module

**Files:**
- Create: `apps/web/src/components/dashboard/provider/RenforceTonProfil.tsx`

- [ ] **Step 1: Implement the module**

Create `apps/web/src/components/dashboard/provider/RenforceTonProfil.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";

const TASK_HREF: Record<string, string> = {
  photo: "/pro/profile/photo",
  portfolio: "/pro/profile/portfolio",
  description: "/pro/profile/presentation",
  verification: "/pro/verify",
  depth: "/pro/profile/presentation",
};

const TASK_CTA: Record<string, string> = {
  photo: "Ajouter",
  portfolio: "Commencer",
  description: "Rédiger",
  verification: "Envoyer",
  depth: "Compléter",
};

const TASK_REASON: Record<string, string> = {
  photo: "Les clients réservent les visages qu'ils voient.",
  portfolio: "Tes photos avant/après transforment une visite en demande.",
  description: "Une bonne présentation rassure et convertit.",
  verification: "Débloque le badge « Vérifié » — un signal de confiance fort.",
  depth: "Plus de langues, compétences et zones = plus de visibilité.",
};

const TIER_LABEL: Record<string, string> = {
  base: "Profil de base",
  solide: "Profil solide",
  remarquable: "Profil remarquable",
};

export function RenforceTonProfil({ firstName }: { firstName: string }) {
  const { data } = useQuery({
    queryKey: queryKeys.providers.strength,
    queryFn: () => providersApi(apiClient).getStrength(),
  });

  if (!data) return null;
  if (data.tier === "remarquable") {
    return (
      <section
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          padding: 14,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--k-success)",
          fontWeight: 600,
          fontSize: 13.5,
        }}
      >
        <I.checkCircle size={18} strokeColor="var(--k-success)" /> Profil remarquable ✓
      </section>
    );
  }

  const todo = data.items.filter((i) => !i.done);

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 16,
        marginBottom: 14,
        boxShadow: "var(--k-e2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 15,
            color: "var(--k-text-primary)",
          }}
        >
          Renforce ton profil
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--k-primary-hover)",
            background: "var(--k-surface-primary)",
            border: "1px solid var(--k-border)",
            borderRadius: "var(--k-r-pill)",
            padding: "3px 10px",
          }}
        >
          {TIER_LABEL[data.tier]}
        </span>
      </div>

      <div
        style={{
          height: 9,
          borderRadius: "var(--k-r-pill)",
          background: "var(--k-surface-muted)",
          overflow: "hidden",
          margin: "2px 0 4px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${data.score}%`,
            background: "var(--k-primary)",
            borderRadius: "var(--k-r-pill)",
            transition: "width 240ms var(--k-ease-std)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--k-text-subtle)",
          marginBottom: 12,
        }}
      >
        <span>Base</span>
        <span>Solide</span>
        <span>Remarquable</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 0",
          borderBottom: "1px solid var(--k-border-subtle)",
          color: "var(--k-text-body)",
          fontSize: 13,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--k-success-subtle)",
            color: "var(--k-success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <I.check size={13} />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "var(--k-text-primary)" }}>
            Tes essentiels sont en ligne
          </div>
          <div style={{ fontSize: 11.5, color: "var(--k-text-muted)" }}>
            Métier, zone et prix — tu es visible dans les recherches.
          </div>
        </div>
      </div>

      {todo.map((item, idx) => (
        <div
          key={item.key}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 11,
            padding: "11px 0",
            borderBottom:
              idx === todo.length - 1
                ? "none"
                : "1px solid var(--k-border-subtle)",
          }}
        >
          <div
            style={{
              width: 25,
              height: 25,
              borderRadius: "50%",
              background: "var(--k-surface-muted)",
              color: "var(--k-text-muted)",
              border: "1px solid var(--k-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {idx + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--k-text-primary)",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                marginTop: 2,
                lineHeight: 1.45,
              }}
            >
              {TASK_REASON[item.key]}
            </div>
          </div>
          <Link
            href={TASK_HREF[item.key]}
            style={{
              alignSelf: "center",
              flexShrink: 0,
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--k-primary)",
              textDecoration: "none",
            }}
          >
            {TASK_CTA[item.key]} ›
          </Link>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS — `providersApi(apiClient).getStrength()` and `queryKeys.providers.strength` come from Plan 1's built `@kayu/api`.

---

### Task 3: Insert the module + remove TodoStrip profile-gap duplication

**Files:**
- Modify: `apps/web/src/app/pro/ProviderDashboardClient.tsx`

- [ ] **Step 1: Import the module**

In `apps/web/src/app/pro/ProviderDashboardClient.tsx`, add after the `TodoStrip` import (line 13):

```tsx
import { RenforceTonProfil } from "@/components/dashboard/provider/RenforceTonProfil";
```

- [ ] **Step 2: Render it after the hero**

In the `return (...)` block, insert the module between `<DashboardHero data={data} />` (line 204) and the `{todos.length > 0 && <TodoStrip items={todos} />}` line (line 206). The result is exactly:

```tsx
      <DashboardHero data={data} />

      {variant !== "onboarding" && <RenforceTonProfil firstName={firstName} />}

      {todos.length > 0 && <TodoStrip items={todos} />}
```

(`firstName` is already in scope at line 157. The module self-hides when strength is unavailable; it only fetches when rendered. `variant !== "onboarding"` ensures it shows only for published providers — `pickHeroVariant` returns `"onboarding"` while `!data.onboarding.isComplete`.)

- [ ] **Step 3: Remove the profile-gap rows from the TodoStrip (the module owns enrichment now)**

The `todos` `useMemo` (lines 45–135) pushes `profile_gap` rows via `deriveProfileGaps(...)`. Remove that duplication: delete the profile-gap loop (lines ~110–132 — the block that starts with `const gaps = deriveProfileGaps(` ... and the `for (const gap of gaps) { ... items.push({ ... kind: "profile_gap" ... }) }`). Concretely:

Open `ProviderDashboardClient.tsx`, find the block inside the `todos` `useMemo` that calls `deriveProfileGaps` and pushes `profile_gap` items, and delete that entire block (the `const gaps = deriveProfileGaps(...)` line through the end of its `for` loop). Then remove the now-unused `deriveProfileGaps` from the import on line 21 (keep `formatRelativeShort`, `pickHeroBookingId`, `pickHeroVariant`).

> Verification that you removed exactly the right thing (Step 6 grep) confirms no `profile_gap` / `deriveProfileGaps` reference remains in this file.

- [ ] **Step 4: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS — no unused `deriveProfileGaps` import, `TodoRowItem` union still satisfied (the `profile_gap` kind may still exist in `TodoRow.tsx`; leaving the type variant unused is fine and not an error).

- [ ] **Step 5: Manual smoke**

With a PUBLISHED provider on `/pro`: the "Renforce ton profil" module appears right under the hero with the tier chip, progress bar, the green "essentiels" row, and the remaining task rows linking to `/pro/profile/photo`, `/pro/profile/portfolio`, `/pro/profile/presentation`, `/pro/verify`. The TodoStrip no longer shows duplicate "Ajoute une photo / description / portfolio" rows. When strength tier is `remarquable`, the module collapses to the "Profil remarquable ✓" badge.

- [ ] **Step 6: Grep**

Run: `grep -n "deriveProfileGaps\|profile_gap" apps/web/src/app/pro/ProviderDashboardClient.tsx`
Expected: no matches.

---

### Task 4: Photo editor

**Files:**
- Create: `apps/web/src/app/pro/profile/photo/page.tsx`
- Create: `apps/web/src/app/pro/profile/photo/PhotoEditorClient.tsx`

- [ ] **Step 1: Page wrapper**

Create `apps/web/src/app/pro/profile/photo/page.tsx`:

```tsx
import { PhotoEditorClient } from "./PhotoEditorClient";

export default function Page() {
  return <PhotoEditorClient />;
}
```

- [ ] **Step 2: Client**

Create `apps/web/src/app/pro/profile/photo/PhotoEditorClient.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { mediaApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { useAuth } from "@/contexts/AuthContext";

export function PhotoEditorClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(user?.avatar ?? null);
  const [file, setFile] = useState<File | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choisis une photo");
      const { path } = await uploadFile("avatar", file);
      return mediaApi(apiClient).setAvatar({ path });
    },
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.strength });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      toast.success("Photo enregistrée.");
      router.push("/pro");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement"),
  });

  const initials = `${(user?.firstName?.[0] ?? "").toUpperCase()}${(
    user?.lastName?.[0] ?? ""
  ).toUpperCase()}` || "?";

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 96px" }}>
      <button
        type="button"
        onClick={() => router.push("/pro")}
        className="k-btn k-btn-ghost k-btn-sm"
        style={{ marginBottom: 14 }}
      >
        <I.arrowLeft size={15} /> Retour
      </button>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          margin: "0 0 16px",
          color: "var(--k-text-primary)",
        }}
      >
        Ta photo de profil
      </h1>

      <div className="k-card" style={{ padding: 18, textAlign: "center" }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            margin: "0 auto 12px",
            background: "#F5F2E9",
            color: "var(--k-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 28,
            overflow: "hidden",
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Aperçu"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setFile(f);
            setPreview(URL.createObjectURL(f));
          }}
        />
        <button
          type="button"
          className="k-btn k-btn-secondary"
          onClick={() => inputRef.current?.click()}
        >
          <I.camera size={16} /> Choisir une photo
        </button>
        <div
          style={{
            marginTop: 12,
            fontSize: 11.5,
            color: "var(--k-text-muted)",
            lineHeight: 1.45,
          }}
        >
          Visage net et bien éclairé, sans lunettes de soleil. Les profils avec
          une vraie photo inspirent confiance.
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          marginTop: 16,
          display: "flex",
          gap: 10,
        }}
      >
        <button
          type="button"
          className="k-btn k-btn-ghost"
          onClick={() => router.push("/pro")}
        >
          Plus tard
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="k-btn k-btn-primary"
          disabled={!file || saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + manual smoke**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS.

Manual: as a published provider go to `/pro/profile/photo` (or click "Ajouter" on the module). Pick an image → preview shows it → "Enregistrer" → success toast, redirect to `/pro`, the dashboard module's photo task is now done and the live preview shows the photo.

---

### Task 5: Bio tap-to-build editor

**Files:**
- Create: `apps/web/src/app/pro/profile/presentation/page.tsx`
- Create: `apps/web/src/app/pro/profile/presentation/PresentationEditorClient.tsx`

- [ ] **Step 1: Page wrapper**

Create `apps/web/src/app/pro/profile/presentation/page.tsx`:

```tsx
import { PresentationEditorClient } from "./PresentationEditorClient";

export default function Page() {
  return <PresentationEditorClient />;
}
```

- [ ] **Step 2: Client**

Create `apps/web/src/app/pro/profile/presentation/PresentationEditorClient.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { dashboardApi, providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";

type Tone = "direct" | "chaleureux" | "expert";

const TONES: { key: Tone; label: string }[] = [
  { key: "direct", label: "Direct & rassurant" },
  { key: "chaleureux", label: "Chaleureux" },
  { key: "expert", label: "Expert" },
];

function buildBio(
  tone: Tone,
  title: string,
  city: string,
  years: string,
  skills: string,
): string {
  const s = skills || "mon métier";
  if (tone === "chaleureux") {
    return `Bonjour, je suis ${title} basé à ${city}. ${years} à votre service. Spécialisé en ${s}. À l'écoute et soigneux, je m'engage sur chaque chantier.`;
  }
  if (tone === "expert") {
    return `${title}, ${years} d'expérience à ${city}. Expertise : ${s}. Travail rigoureux, conforme aux règles de l'art et garanti.`;
  }
  return `${title} à ${city} avec ${years} d'expérience. Spécialisé en ${s}. Je réponds vite, je travaille propre et je garantis mes interventions.`;
}

function yearsLabel(experience: number | null | undefined): string {
  if (experience == null) return "plusieurs années";
  if (experience <= 0) return "moins d'un an";
  if (experience <= 3) return "1 à 3 ans";
  if (experience <= 7) return "4 à 7 ans";
  return "plus de 8 ans";
}

export function PresentationEditorClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
  });

  const provider = data?.provider;
  const title = provider?.profession || "Prestataire";
  const city = data?.availability.zoneCity || "Kinshasa";
  const years = yearsLabel(
    (provider as { experience?: number | null } | undefined)?.experience,
  );
  const skills = (
    (provider as { categories?: string[] } | undefined)?.categories ?? []
  ).join(", ");

  const [tone, setTone] = useState<Tone>("direct");
  const suggested = useMemo(
    () => buildBio(tone, title, city, years, skills),
    [tone, title, city, years, skills],
  );
  const [text, setText] = useState<string | null>(null);
  const value = text ?? suggested;

  const saveMut = useMutation({
    mutationFn: () =>
      providersApi(apiClient).updateMe({ description: value.slice(0, 1000) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.strength });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      toast.success("Présentation enregistrée.");
      router.push("/pro");
    },
    onError: () => toast.error("Échec de l'enregistrement"),
  });

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 96px" }}>
      <button
        type="button"
        onClick={() => router.push("/pro")}
        className="k-btn k-btn-ghost k-btn-sm"
        style={{ marginBottom: 14 }}
      >
        <I.arrowLeft size={15} /> Retour
      </button>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          margin: "0 0 4px",
          color: "var(--k-text-primary)",
        }}
      >
        Ta présentation
      </h1>
      <p style={{ fontSize: 13, color: "var(--k-text-muted)", margin: "0 0 16px" }}>
        Choisis un ton, on le remplit avec tes infos. Ajuste librement.
      </p>

      <div className="k-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {TONES.map((t) => {
            const sel = tone === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTone(t.key);
                  setText(null);
                }}
                className={sel ? "k-chip k-chip-primary" : "k-chip"}
                style={{ cursor: "pointer" }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={value}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          style={{
            width: "100%",
            minHeight: 130,
            padding: 14,
            borderRadius: "var(--k-r-md)",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            fontFamily: "inherit",
            fontSize: 14.5,
            lineHeight: 1.5,
            outline: "none",
            resize: "vertical",
          }}
        />
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 4,
            textAlign: "right",
            fontFamily: "var(--font-mono)",
          }}
        >
          {value.length} / 1000 · tu peux tout modifier
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button
          type="button"
          className="k-btn k-btn-ghost"
          onClick={() => router.push("/pro")}
        >
          Plus tard
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="k-btn k-btn-primary"
          disabled={saveMut.isPending || value.trim().length < 10}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + manual smoke**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS. (`providersApi(apiClient).updateMe({ description })` exists; `UpdateProviderDto.description` is `string.max(1000).nullable().optional()`.)

Manual: `/pro/profile/presentation` → pick a tone → the textarea fills with the slotted bio → edit → Enregistrer → success, redirect, the module's "Soigne ta présentation" task completes.

---

### Task 6: Portfolio editor (list + guided "add chantier")

**Files:**
- Create: `apps/web/src/app/pro/profile/portfolio/page.tsx`
- Create: `apps/web/src/app/pro/profile/portfolio/PortfolioListClient.tsx`
- Create: `apps/web/src/app/pro/profile/portfolio/new/page.tsx`
- Create: `apps/web/src/app/pro/profile/portfolio/new/AddChantierClient.tsx`

- [ ] **Step 1: List page + client**

Create `apps/web/src/app/pro/profile/portfolio/page.tsx`:

```tsx
import { PortfolioListClient } from "./PortfolioListClient";

export default function Page() {
  return <PortfolioListClient />;
}
```

Create `apps/web/src/app/pro/profile/portfolio/PortfolioListClient.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { I } from "@kayu/ui/web";
import { providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";

export function PortfolioListClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.providers.portfolio,
    queryFn: () => providersApi(apiClient).listPortfolio(),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => providersApi(apiClient).deletePortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.portfolio });
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.strength });
      toast.success("Chantier supprimé.");
    },
  });

  const projects = data?.projects ?? [];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 96px" }}>
      <button
        type="button"
        onClick={() => router.push("/pro")}
        className="k-btn k-btn-ghost k-btn-sm"
        style={{ marginBottom: 14 }}
      >
        <I.arrowLeft size={15} /> Retour
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            margin: 0,
            color: "var(--k-text-primary)",
          }}
        >
          Ton portfolio
        </h1>
        <Link href="/pro/profile/portfolio/new" className="k-btn k-btn-primary k-btn-sm">
          <I.plus size={15} /> Ajouter un chantier
        </Link>
      </div>

      {isLoading ? (
        <div className="k-card" style={{ padding: 24, textAlign: "center", color: "var(--k-text-muted)" }}>
          Chargement…
        </div>
      ) : projects.length === 0 ? (
        <div className="k-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--k-text-primary)" }}>
            Montre ton travail
          </div>
          <div style={{ fontSize: 13, color: "var(--k-text-muted)", lineHeight: 1.5, marginBottom: 14 }}>
            Un bon chantier : une photo avant, une photo après, une description
            courte. 3 chantiers avec photos avant/après → profil remarquable.
          </div>
          <Link href="/pro/profile/portfolio/new" className="k-btn k-btn-primary">
            Ajoute ton premier chantier
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {projects.map((p) => (
            <div key={p.id} className="k-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 4,
                    width: 132,
                    flexShrink: 0,
                  }}
                >
                  {p.images.slice(0, 3).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.imageUrl}
                      alt={p.title}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: 6,
                        background: "var(--k-surface-muted)",
                      }}
                    />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--k-text-primary)" }}>
                    {p.title}
                  </div>
                  {p.description && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--k-text-muted)",
                        marginTop: 3,
                        lineHeight: 1.45,
                      }}
                    >
                      {p.description}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => delMut.mutate(p.id)}
                    disabled={delMut.isPending}
                    className="k-btn k-btn-ghost k-btn-sm"
                    style={{ marginTop: 8, color: "var(--k-danger)" }}
                  >
                    <I.trash size={14} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: "Add chantier" page + client**

Create `apps/web/src/app/pro/profile/portfolio/new/page.tsx`:

```tsx
import { AddChantierClient } from "./AddChantierClient";

export default function Page() {
  return <AddChantierClient />;
}
```

Create `apps/web/src/app/pro/profile/portfolio/new/AddChantierClient.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { uploadFile } from "@/lib/upload";

type Slot = "BEFORE" | "DURING" | "AFTER";
type SlotState = { file: File; preview: string } | null;

const WHAT = ["Réparation", "Installation", "Pose", "Rénovation", "Entretien", "Dépannage"];
const WHERE = ["Cuisine", "Salle de bain", "Salon", "Chambre", "Extérieur", "Toiture", "Bureau"];
const RESULT = [
  "Travail garanti",
  "Intervention propre",
  "Terminé dans les délais",
  "Client satisfait",
];
const DURATION = ["½ journée", "1 jour", "2–3 jours", "+ d'une semaine"];

export function AddChantierClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<Record<Slot, SlotState>>({
    BEFORE: null,
    DURING: null,
    AFTER: null,
  });
  const refs = {
    BEFORE: useRef<HTMLInputElement>(null),
    DURING: useRef<HTMLInputElement>(null),
    AFTER: useRef<HTMLInputElement>(null),
  };
  const [what, setWhat] = useState<string>("");
  const [where, setWhere] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  const description = [
    [what, where].filter(Boolean).join(" · "),
    result,
  ]
    .filter(Boolean)
    .join(". ");

  const canSave = Boolean(slots.BEFORE) && what && where;

  const saveMut = useMutation({
    mutationFn: async () => {
      const order: Slot[] = ["BEFORE", "DURING", "AFTER"];
      const images: Array<{
        imageType: Slot;
        path: string;
        displayOrder: number;
      }> = [];
      for (let i = 0; i < order.length; i++) {
        const s = slots[order[i]];
        if (!s) continue;
        const { path } = await uploadFile("portfolio", s.file);
        images.push({ imageType: order[i], path, displayOrder: i });
      }
      return providersApi(apiClient).createPortfolio({
        title: [what, where].filter(Boolean).join(" — ") || "Chantier",
        description: description || undefined,
        images,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.portfolio });
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.strength });
      toast.success("Chantier ajouté.");
      router.push("/pro/profile/portfolio");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Échec de l'ajout"),
  });

  const slotMeta: Record<Slot, { label: string; req: string }> = {
    BEFORE: { label: "Avant", req: "obligatoire" },
    DURING: { label: "Pendant", req: "optionnel" },
    AFTER: { label: "Après", req: "recommandé" },
  };

  const chip = (active: boolean): string =>
    active ? "k-chip k-chip-primary" : "k-chip";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 96px" }}>
      <button
        type="button"
        onClick={() => router.push("/pro/profile/portfolio")}
        className="k-btn k-btn-ghost k-btn-sm"
        style={{ marginBottom: 14 }}
      >
        <I.arrowLeft size={15} /> Retour
      </button>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          margin: "0 0 16px",
          color: "var(--k-text-primary)",
        }}
      >
        Nouveau chantier
      </h1>

      <div className="k-card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: "var(--k-text-primary)" }}>
          Photos du chantier
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          {(["BEFORE", "DURING", "AFTER"] as Slot[]).map((slot) => {
            const s = slots[slot];
            return (
              <div key={slot} style={{ flex: 1 }}>
                <input
                  ref={refs[slot]}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setSlots((prev) => ({
                      ...prev,
                      [slot]: { file: f, preview: URL.createObjectURL(f) },
                    }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => refs[slot].current?.click()}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 10,
                    border: s
                      ? "1.5px solid var(--k-primary)"
                      : "1.5px dashed var(--k-border-strong)",
                    background: s ? "transparent" : "var(--k-surface-muted)",
                    color: "var(--k-text-muted)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                  }}
                >
                  {s ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.preview}
                      alt={slotMeta[slot].label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <>
                      <I.camera size={16} />
                      {slotMeta[slot].label}
                      <span style={{ fontWeight: 400, fontSize: 9.5 }}>
                        {slotMeta[slot].req}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <div
          style={{
            background: "var(--k-warning-subtle)",
            border: "1px solid #FDE68A",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 11.5,
            color: "#92400E",
            lineHeight: 1.45,
            marginBottom: 16,
          }}
        >
          Photo nette, en pleine lumière, cadre tout le travail. Évite le flou.
        </div>

        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: "var(--k-text-primary)" }}>
          Décris en tapant
        </div>
        {[
          { label: "Quoi ?", opts: WHAT, val: what, set: setWhat },
          { label: "Où ?", opts: WHERE, val: where, set: setWhere },
          { label: "Résultat ?", opts: RESULT, val: result, set: setResult },
        ].map((row) => (
          <div key={row.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginBottom: 5 }}>
              {row.label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {row.opts.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => row.set(row.val === o ? "" : o)}
                  className={chip(row.val === o)}
                  style={{ cursor: "pointer" }}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: "var(--k-surface-muted)",
            borderRadius: "var(--k-r-md)",
            fontSize: 12.5,
            color: "var(--k-text-body)",
            minHeight: 38,
          }}
        >
          {description || "La description s'assemble ici…"}
        </div>

        <div style={{ fontWeight: 700, fontSize: 13.5, margin: "16px 0 8px", color: "var(--k-text-primary)" }}>
          Durée <span style={{ fontWeight: 400, color: "var(--k-text-subtle)" }}>· optionnel</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {DURATION.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(duration === d ? "" : d)}
              className={chip(duration === d)}
              style={{ cursor: "pointer" }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button
          type="button"
          className="k-btn k-btn-ghost"
          onClick={() => router.push("/pro/profile/portfolio")}
        >
          Annuler
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="k-btn k-btn-primary"
          disabled={!canSave || saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? "Ajout…" : "Ajouter ce chantier"}
        </button>
      </div>
    </div>
  );
}
```

> `duration` is collected for UX parity with the mockup but not sent (the backend `PortfolioProjectInputDto.duration` is an int "hours" and the chips are coarse bands; sending a misleading number is worse than omitting — leave it out of the `createPortfolio` payload, as written). If a future iteration wants it, map bands→hours explicitly then.

- [ ] **Step 3: Type-check + manual smoke**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS — `providersApi(apiClient).listPortfolio/createPortfolio/deletePortfolio` come from Plan 1's `@kayu/api`; `PortfolioProjectInputDtoType.images[].imageType` accepts `"BEFORE"|"DURING"|"AFTER"`.

Manual: `/pro/profile/portfolio` → empty state with example copy + "Ajoute ton premier chantier" → `/pro/profile/portfolio/new` → add a BEFORE photo (required), tap Quoi/Où chips (description assembles live) → "Ajouter ce chantier" → uploads to Supabase, project created, back to list showing the chantier with thumbnails. The dashboard module's portfolio task progresses; at 3 projects strength reaches the portfolio max.

---

### Task 7: Wire real upload into the existing verification flow

**Files:**
- Modify: `apps/web/src/app/pro/verify/VerifyWizard.tsx`

Plan 1 already (a) added `path` to `UploadVerificationDocDto` and (b) made the backend store the real Supabase URL. The web side currently sends metadata only — `VerifyWizard` must upload the file and pass `path`.

- [ ] **Step 1: Read the current upload seam**

Open `apps/web/src/app/pro/verify/VerifyWizard.tsx`. Locate:
- `handleUpload` (≈ lines 75–85): currently calls `onUpload({ kind, fileName, fileSize, mimeType })`.
- The file `<input>` `onChange` (≈ lines 281–293): currently calls `onUpload(kind, { fileName: file.name, fileSize: file.size, mimeType: file.type })` and discards the binary.

The `onUpload` prop is typed against `UploadVerificationDocDtoType` upstream (in `ProVerificationClient.tsx`'s `uploadMut`). After Plan 1, that type has a required `path`.

- [ ] **Step 2: Upload the real file before calling `onUpload`**

In `VerifyWizard.tsx`, add the import:

```tsx
import { uploadFile } from "@/lib/upload";
```

Change the file `<input>` `onChange` handler (the ≈ lines 281–293 block) so it uploads first and passes `path`. Replace its body with exactly:

```tsx
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file || isUploading) {
            return;
          }
          try {
            const { path } = await uploadFile("verification", file);
            await onUpload(kind, {
              path,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || undefined,
            });
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Téléversement impossible",
            );
          }
          event.target.value = "";
        }}
```

> If `toast` is not already imported in `VerifyWizard.tsx`, add `import { toast } from "sonner";`. If `onUpload`'s signature in this file is `(kind, meta) => ...` keep that arity (as above); if it is `(data) => ...` (single arg, see `handleUpload`), instead call `await onUpload({ kind, path, fileName: file.name, fileSize: file.size, mimeType: file.type || undefined })`. Match the EXACT existing `onUpload` prop signature in this file — read it first (Step 1) and mirror it; only add the `path` field.

- [ ] **Step 3: Update `handleUpload` if it is the seam instead**

If `VerifyWizard` routes uploads through `handleUpload(kind, { fileName, fileSize, mimeType })` (≈ lines 75–85) rather than inline in `onChange`, change its signature to also receive the `File`, upload it, and forward `path`:

```tsx
  const handleUpload = async (
    kind: VerificationDocKind,
    file: File,
  ) => {
    const { path } = await uploadFile("verification", file);
    await onUpload({
      kind,
      path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || undefined,
    });
  };
```

and update its single call site to pass the real `File` object. Pick Step 2 OR Step 3 depending on which is the actual seam in the current file — do not apply both; the goal is exactly one place that uploads then sends `path`.

- [ ] **Step 4: Type-check + manual smoke**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS — `onUpload` payload now includes the required `path` (Plan 1's `UploadVerificationDocDto`).

Manual: as a published provider, `/pro/verify` (or the module's "Fais-toi vérifier ›") → upload an ID image for a required kind → it actually uploads to the private `verification-docs` bucket → the doc appears with `storage://verification-docs/...` (visible via the backend `GET /pro/verification/state` response, or just confirm no error + the doc card shows uploaded). Submit when all required kinds present → status → UNDER_REVIEW. The dashboard module's "Fais-toi vérifier" completes only once an admin marks it VERIFIED (existing admin flow, unchanged).

---

### Task 8: Full verification gate

**Files:** none

- [ ] **Step 1: Web type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS — zero errors across the new module, helper, four editors, and the verify change.

- [ ] **Step 2: End-to-end manual run**

As a freshly published provider (run Plan 2's wizard first):
1. `/pro` shows "Renforce ton profil" under the hero: tier "Profil de base/solide", progress bar, essentials row green, tasks listed; no duplicate profile-gap rows in the à-faire strip.
2. Complete photo → module updates (photo task gone, score up).
3. Add a portfolio chantier with avant/après → score up.
4. Write a presentation → score up.
5. Upload verification docs + submit → task shows pending (completes only on admin VERIFY).
6. When tier reaches "remarquable", the module collapses to "Profil remarquable ✓".
7. Repeat checks at 390px viewport — single column, tap targets ≥44px, no horizontal scroll.

- [ ] **Step 3: Grep for gradients on the new surfaces**

Run: `grep -rn "linear-gradient" apps/web/src/app/pro/profile/ apps/web/src/components/dashboard/provider/RenforceTonProfil.tsx`
Expected: no matches.

---

### Task 9: Single feature commit

- [ ] **Step 1: Review the diff**

Run: `git status && git diff --stat`
Expected: new `apps/web/src/lib/upload.ts`, `apps/web/src/components/dashboard/provider/RenforceTonProfil.tsx`, `apps/web/src/app/pro/profile/**`, and modified `ProviderDashboardClient.tsx` + `VerifyWizard.tsx` only.

- [ ] **Step 2: One commit**

```bash
git add apps/web/src/lib/upload.ts apps/web/src/components/dashboard/provider/RenforceTonProfil.tsx apps/web/src/app/pro/profile apps/web/src/app/pro/ProviderDashboardClient.tsx apps/web/src/app/pro/verify/VerifyWizard.tsx
git commit -m "feat(onboarding): Phase 2 — Renforce ton profil module + photo/portfolio/bio/verify editors

- dashboard strength module (honest tiers, live tasks) from GET /providers/me/strength
- shared sign+upload helper (Supabase signed upload URLs)
- photo, guided portfolio chantier, tap-to-build bio editors
- real file upload wired into existing /pro/verify flow
- removed duplicated TodoStrip profile-gap rows"
```

---

## Self-Review

Checked against spec §"Phase 2 — Profile Strength", §"Portfolio builder", §"Visual & UX system":

- **Module on the dashboard, under the hero, honest tiers, progress bar, essentials-done row, task list, collapses at remarquable** → Task 2 + Task 3. ✓
- **Fed by the backend strength (one source)** → `providersApi.getStrength` (Plan 1) consumed in Task 2. ✓
- **No fabricated stats; reasons are honest** → `TASK_REASON` copy (visibility/trust/ranking, no percentages). ✓
- **No TodoStrip duplication (module owns enrichment)** → Task 3 Step 3. ✓
- **Photo editor (real upload → User.avatar)** → Task 4 (`uploadFile('avatar')` + `mediaApi.setAvatar`). ✓
- **Portfolio: example-led empty state, photo-first avant/pendant/après, tap-to-build description, target 3** → Task 6 (`PortfolioListClient` empty state + `AddChantierClient`). ✓
- **Bio tap-to-build with tone + slotted fields, editable** → Task 5. ✓
- **Verification: real Supabase upload wired into the EXISTING /pro/verify flow (not rebuilt)** → Task 7 (modifies `VerifyWizard`, keeps `verificationApi`/admin flow). ✓
- **Editors AppShell-wrapped under /pro/profile/* (not /pro/onboarding)** → Task 4–6 routes; confirmed `pro/layout.tsx` wraps all non-`/pro/onboarding` routes. ✓
- **Sanctioned styling, no gradients, mobile-first** → all components use `var(--k-*)` + `.k-*`; Task 8 Step 3 grep. ✓
- **Live preview filling in** → the module's progress + the dashboard's existing provider preview reflect completion via `queryKeys.providers.strength` / `dashboard.provider` invalidation on every editor save. ✓ (A standalone always-on side preview was an approach-C nicety folded down to the module's progress + dashboard reflection — consistent with the chosen Plan-1 single-endpoint design; noted as a conscious scope choice.)

Placeholder scan: every new file has complete code; every modify step gives the exact replacement and an explicit "match the existing signature" instruction where the current file's exact arity must be honored (Task 7) — both branches fully specified. No web test harness exists (stated up front); verification is type-check + explicit manual checklists. Type consistency: `uploadFile`'s `{ path }` return is consumed identically in Tasks 4/6/7; `mediaApi`/`providersApi`/`queryKeys.providers.strength`/`queryKeys.providers.portfolio` all originate in Plan 1 and are used consistently here.

Backend (strength endpoint, mediaApi, portfolio CRUD, verification storage) is Plan 1. Phase 1 wizard is Plan 2.
