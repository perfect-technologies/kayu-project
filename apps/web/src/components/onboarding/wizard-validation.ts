import { PublishProviderDto, type CategoryTreeNode, type PublishProviderDto as PublishPayload } from "@kayu/schemas";
import { toE164 } from "@kayu/utils";
import { toMediaInput } from "@/components/media/media-draft";
import { scheduleIssues } from "@/components/schedule/ScheduleEditor";
import { onboardingCopy } from "@/copy/onboarding";
import { findNode } from "@/lib/dto/category";
import type { WizardDraft, WizardStep } from "./wizard-state";

export const FREE_SKILLS_MAX = 10;
export const DESCRIPTION_MAX = 2000;

export type FieldErrors = Partial<Record<string, string>>;

const copy = onboardingCopy.validation;

const STEP_OF_FIELD: Record<string, WizardStep> = {
  displayName: 1,
  phone: 1,
  whatsapp: 1,
  email: 1,
  profilePhoto: 1,
  subcategoryId: 2,
  yearsExperience: 2,
  skillIds: 2,
  freeSkills: 2,
  description: 2,
  placeId: 3,
  addressLine: 3,
  latitude: 3,
  longitude: 3,
  languageIds: 4,
  modeIds: 4,
  pricing: 4,
  schedule: 4,
  media: 4,
  social: 4,
  acceptTerms: 4,
};

export function stepForPath(path: string | Array<string | number>): WizardStep {
  const head = Array.isArray(path) ? String(path[0] ?? "") : path.split(".")[0] ?? "";
  return STEP_OF_FIELD[head] ?? 4;
}

/** Deepest chosen taxonomy node (service, else subcategory); the server only accepts leaves. */
export function deepestNode(draft: Pick<WizardDraft, "subcategoryId" | "serviceId">, tree: CategoryTreeNode[]): CategoryTreeNode | null {
  const node = findNode(tree, draft.serviceId || draft.subcategoryId || null);
  return node && node.children.length === 0 ? node : null;
}

export function splitFreeSkills(value: string): string[] {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean))).slice(0, FREE_SKILLS_MAX);
}

/** The exact client rules of the 06 doc, per step. Returns field → message. */
export function stepErrors(step: WizardStep, draft: WizardDraft, tree: CategoryTreeNode[]): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 1) {
    const name = draft.displayName.trim();
    if (name.length < 2 || name.length > 120) errors.displayName = copy.displayName;
    if (!toE164(draft.phone, "CD")) errors.phone = copy.phone;
    if (draft.whatsapp && !toE164(draft.whatsapp, "CD")) errors.whatsapp = copy.whatsapp;
  }
  if (step === 2) {
    if (!deepestNode(draft, tree)) errors.subcategoryId = copy.category;
  }
  if (step === 3) {
    if (!draft.placeId) errors.placeId = copy.city;
  }
  if (step === 4) {
    if (!draft.acceptTerms) errors.acceptTerms = copy.terms;
    if (scheduleIssues(draft.schedule).length > 0) errors.schedule = copy.schedule;
  }
  return errors;
}

export function stepIsValid(step: WizardStep, draft: WizardDraft, tree: CategoryTreeNode[]): boolean {
  return Object.keys(stepErrors(step, draft, tree)).length === 0;
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Wizard draft → `POST /me/provider` body. */
export function toPublishPayload(draft: WizardDraft, tree: CategoryTreeNode[]): PublishPayload {
  const years = draft.yearsExperience.trim() === "" ? null : Number(draft.yearsExperience);
  const social = {
    youtubeUrl: emptyToUndefined(draft.social.youtubeUrl),
    instagramUrl: emptyToUndefined(draft.social.instagramUrl),
    tiktokUrl: emptyToUndefined(draft.social.tiktokUrl),
    facebookUrl: emptyToUndefined(draft.social.facebookUrl),
  };
  return {
    displayName: draft.displayName.trim(),
    phone: toE164(draft.phone, "CD") ?? draft.phone,
    whatsapp: draft.whatsapp ? (toE164(draft.whatsapp, "CD") ?? draft.whatsapp) : null,
    profilePhoto: draft.profilePhoto?.path ?? null,
    subcategoryId: deepestNode(draft, tree)?.id ?? (draft.serviceId || draft.subcategoryId),
    yearsExperience: years !== null && Number.isFinite(years) ? Math.max(0, Math.min(80, Math.round(years))) : null,
    skillIds: draft.skillIds,
    freeSkills: splitFreeSkills(draft.freeSkills),
    description: emptyToUndefined(draft.description) ?? null,
    placeId: draft.placeId ?? "",
    addressLine: emptyToUndefined(draft.addressLine) ?? null,
    latitude: draft.latitude,
    longitude: draft.longitude,
    languageIds: draft.languageIds,
    modeIds: draft.modeIds,
    pricing: draft.pricing && draft.pricing.currencyId && draft.pricing.unitId ? draft.pricing : null,
    schedule: draft.schedule,
    media: draft.media.map(toMediaInput),
    social: Object.values(social).some(Boolean) ? social : undefined,
    acceptTerms: true,
  };
}

export type MappedErrors = { step: WizardStep; fields: FieldErrors };

/** Maps Zod issue paths (client parse or the server's dotted `errors[].path`) onto the owning step. */
export function mapIssues(issues: Array<{ path: string | Array<string | number>; message: string }>): MappedErrors | null {
  if (issues.length === 0) return null;
  const fields: FieldErrors = {};
  let step: WizardStep = 4;
  for (const issue of issues) {
    const head = Array.isArray(issue.path) ? String(issue.path[0] ?? "") : issue.path.split(".")[0] ?? "";
    const owner = stepForPath(head);
    if (owner < step) step = owner;
    if (!fields[head]) fields[head] = issue.message || onboardingCopy.errors.fieldInvalid;
  }
  return { step, fields };
}

/** Runs the shared Zod contract before the request so a 400 is the exception, not the rule. */
export function validatePayload(payload: PublishPayload): MappedErrors | null {
  const result = PublishProviderDto.safeParse(payload);
  if (result.success) return null;
  return mapIssues(result.error.issues.map((issue) => ({ path: issue.path as Array<string | number>, message: issue.message })));
}
