"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, adminApi, providersApi, queryKeys } from "@kayu/api";
import { MEDIA_LIMITS, type AdminUpdateProviderDto, type CategoryTreeNode, type PremiumTier, type ProviderPublic, type UpdateProviderDto, type VerificationStatus } from "@kayu/schemas";
import { toE164 } from "@kayu/utils";
import { FormError, SelectField, Spinner, TextAreaField } from "@/components/forms/Field";
import { PhotoDropzone } from "@/components/media/PhotoDropzone";
import { VideoEditor } from "@/components/media/VideoEditor";
import { fromProviderMedia, isImage, isVideo, toMediaInput, type MediaDraftItem } from "@/components/media/media-draft";
import { selectionForNode } from "@/components/onboarding/CategoryCascade";
import { PublicProfileFields, type PublicProfileValue } from "@/components/onboarding/PublicProfileFields";
import { StepInfos, type InfosValue } from "@/components/onboarding/StepInfos";
import { StepLocation, type LocationValue } from "@/components/onboarding/StepLocation";
import { StepServices, type ServicesValue } from "@/components/onboarding/StepServices";
import type { SocialDraft } from "@/components/onboarding/wizard-state";
import { deepestNode, mapIssues, splitFreeSkills, type FieldErrors } from "@/components/onboarding/wizard-validation";
import { ScheduleEditor, scheduleIssues, type ScheduleValue } from "@/components/schedule/ScheduleEditor";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/copy/errors";
import { onboardingCopy } from "@/copy/onboarding";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const copy = onboardingCopy.editor;
const validation = onboardingCopy.validation;

type Tab = "infos" | "services" | "location" | "public" | "schedule" | "media" | "moderation";

type EditorSlices = {
  infos: InfosValue;
  services: ServicesValue;
  location: LocationValue;
  public: PublicProfileValue;
  schedule: ScheduleValue;
  media: MediaDraftItem[];
};

type Moderation = { hidden: boolean; premiumTier: PremiumTier; verificationStatus: VerificationStatus; rejectionReason: string };

function slicesFrom(provider: ProviderPublic, tree: CategoryTreeNode[]): EditorSlices {
  const contacts = provider.contacts;
  const social: SocialDraft = {
    youtubeUrl: provider.social.youtubeUrl ?? "",
    instagramUrl: provider.social.instagramUrl ?? "",
    tiktokUrl: provider.social.tiktokUrl ?? "",
    facebookUrl: provider.social.facebookUrl ?? "",
  };
  return {
    infos: {
      displayName: provider.displayName,
      phone: contacts?.phone ?? "",
      whatsapp: contacts?.whatsapp ?? "",
      profilePhoto: provider.profilePhoto ? { key: "current-photo", kind: "IMAGE", url: provider.profilePhoto } : null,
    },
    services: {
      ...selectionForNode(tree, provider.subcategoryId),
      yearsExperience: provider.yearsExperience === null ? "" : String(provider.yearsExperience),
      skillIds: provider.skills.map((skill) => skill.id),
      freeSkills: provider.freeSkills.join(", "),
      description: provider.description ?? "",
    },
    location: {
      placeId: provider.placeId,
      addressLine: contacts?.addressLine ?? "",
      latitude: contacts?.latitude ?? null,
      longitude: contacts?.longitude ?? null,
    },
    public: {
      languageIds: provider.languages.map((item) => item.id),
      modeIds: provider.interventionModes.map((item) => item.id),
      pricing:
        provider.pricing && provider.pricing.currency && provider.pricing.unit
          ? { amount: provider.pricing.amount, currencyId: provider.pricing.currency.id, unitId: provider.pricing.unit.id }
          : null,
      social,
    },
    schedule: {
      timezone: provider.schedule.timezone,
      slotDurationMin: provider.schedule.slotDurationMin,
      slotBufferMin: provider.schedule.slotBufferMin,
      rules: provider.schedule.rules.map((rule) => ({ ...rule })),
      exceptions: provider.schedule.exceptions.map((exception) => ({ ...exception })),
    },
    media: [...provider.media].sort((a, b) => a.order - b.order).map(fromProviderMedia),
  };
}

function moderationFrom(provider: ProviderPublic): Moderation {
  return { hidden: provider.hidden, premiumTier: provider.premiumTier, verificationStatus: provider.verificationStatus, rejectionReason: "" };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const orNull = (value: string) => (value.trim().length > 0 ? value.trim() : null);

type ServerValidation = { errors?: Array<{ path: string; message: string }> };

export function EditorClient({ initial, tree }: { initial: ProviderPublic; tree: CategoryTreeNode[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState(initial);
  const [saved, setSaved] = useState(() => slicesFrom(initial, tree));
  const [draft, setDraft] = useState(saved);
  const [moderation, setModeration] = useState(() => moderationFrom(initial));
  const [tab, setTab] = useState<Tab>("infos");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isAdminViewer = user?.role === "ADMIN" && !provider.isOwner;
  const readOnly = isAdminViewer;
  const uploading = Object.values(busy).some(Boolean);

  const tabs = useMemo(() => {
    const base: Array<{ key: Tab; label: string }> = [
      { key: "infos", label: copy.tabs.infos },
      { key: "services", label: copy.tabs.services },
      { key: "location", label: copy.tabs.location },
      { key: "public", label: copy.tabs.public },
      { key: "schedule", label: copy.tabs.schedule },
      { key: "media", label: copy.tabs.media },
    ];
    return isAdminViewer ? [...base, { key: "moderation" as Tab, label: copy.admin.title }] : base;
  }, [isAdminViewer]);

  const dirty = tab === "moderation" ? !same(moderation, moderationFrom(provider)) : !same(draft[tab], saved[tab]);

  const busyFor = useMemo(() => {
    const make = (key: string) => (value: boolean) => setBusy((current) => (current[key] === value ? current : { ...current, [key]: value }));
    return { photo: make("photo"), gallery: make("gallery"), video: make("video") };
  }, []);

  const patch = useCallback(<K extends keyof EditorSlices>(key: K, value: Partial<EditorSlices[K]> | EditorSlices[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: Array.isArray(value) || key === "media" ? value : { ...(current[key] as object), ...(value as object) },
    }));
  }, []);

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    if (dirty && !window.confirm(copy.dirtyGuard)) return;
    if (dirty) {
      if (tab === "moderation") setModeration(moderationFrom(provider));
      else setDraft((current) => ({ ...current, [tab]: saved[tab] }));
    }
    setErrors({});
    setFormError(null);
    setTab(next);
  };

  const applyProvider = (next: ProviderPublic) => {
    setProvider(next);
    const slices = slicesFrom(next, tree);
    setSaved(slices);
    setDraft((current) => ({ ...current, [tab]: slices[tab as keyof EditorSlices] }));
    void queryClient.invalidateQueries({ queryKey: queryKeys.providers.detail(next.id) });
  };

  const buildPatch = (): { dto: UpdateProviderDto | null; problems: FieldErrors } => {
    const problems: FieldErrors = {};
    if (tab === "infos") {
      const { infos } = draft;
      const name = infos.displayName.trim();
      if (name.length < 2 || name.length > 120) problems.displayName = validation.displayName;
      const phone = toE164(infos.phone, "CD");
      if (!phone) problems.phone = validation.phone;
      const whatsapp = infos.whatsapp ? toE164(infos.whatsapp, "CD") : null;
      if (infos.whatsapp && !whatsapp) problems.whatsapp = validation.whatsapp;
      const dto: UpdateProviderDto = { displayName: name, phone: phone ?? undefined, whatsapp };
      const photo = infos.profilePhoto;
      const savedUrl = saved.infos.profilePhoto?.url ?? null;
      if (!photo && savedUrl) dto.profilePhoto = null;
      else if (photo?.path) dto.profilePhoto = photo.path;
      return { dto, problems };
    }
    if (tab === "services") {
      const { services } = draft;
      const deepest = deepestNode(services, tree);
      if (!deepest) problems.subcategoryId = validation.category;
      const years = services.yearsExperience.trim() === "" ? null : Number(services.yearsExperience);
      return {
        dto: {
          subcategoryId: deepest?.id,
          yearsExperience: years !== null && Number.isFinite(years) ? Math.max(0, Math.min(80, Math.round(years))) : null,
          skillIds: services.skillIds,
          freeSkills: splitFreeSkills(services.freeSkills),
          description: orNull(services.description),
        },
        problems,
      };
    }
    if (tab === "location") {
      const { location } = draft;
      if (!location.placeId) problems.placeId = validation.city;
      return {
        dto: {
          placeId: location.placeId ?? undefined,
          addressLine: orNull(location.addressLine),
          latitude: location.latitude,
          longitude: location.longitude,
        },
        problems,
      };
    }
    if (tab === "public") {
      const { public: pub } = draft;
      return {
        dto: {
          languageIds: pub.languageIds,
          modeIds: pub.modeIds,
          pricing: pub.pricing && pub.pricing.currencyId && pub.pricing.unitId ? pub.pricing : null,
          social: {
            youtubeUrl: orNull(pub.social.youtubeUrl),
            instagramUrl: orNull(pub.social.instagramUrl),
            tiktokUrl: orNull(pub.social.tiktokUrl),
            facebookUrl: orNull(pub.social.facebookUrl),
          },
        },
        problems,
      };
    }
    return { dto: null, problems };
  };

  const save = async () => {
    setFormError(null);
    setErrors({});
    setSaving(true);
    try {
      if (tab === "moderation") {
        const dto: AdminUpdateProviderDto = {
          hidden: moderation.hidden,
          premiumTier: moderation.premiumTier,
          verificationStatus: moderation.verificationStatus,
          ...(moderation.verificationStatus === "REJECTED" && moderation.rejectionReason.trim() ? { rejectionReason: moderation.rejectionReason.trim() } : {}),
        };
        await adminApi(apiClient).updateProvider(provider.id, dto);
        const fresh = await providersApi(apiClient).getPublic(provider.id);
        applyProvider(fresh);
        setModeration(moderationFrom(fresh));
      } else if (tab === "schedule") {
        if (scheduleIssues(draft.schedule).length > 0) {
          setErrors({ schedule: validation.schedule });
          return;
        }
        const schedule = await providersApi(apiClient).putSchedule(draft.schedule);
        applyProvider({ ...provider, schedule });
      } else if (tab === "media") {
        const result = await providersApi(apiClient).putMedia({ items: draft.media.map(toMediaInput) });
        applyProvider({ ...provider, media: result.items });
      } else {
        const { dto, problems } = buildPatch();
        if (Object.keys(problems).length > 0 || !dto) {
          setErrors(problems);
          return;
        }
        const updated = await providersApi(apiClient).updateMe(dto);
        applyProvider(updated);
      }
      toast.success(copy.saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const mapped = mapIssues(((error.body as ServerValidation | undefined)?.errors ?? []).map((issue) => ({ path: issue.path, message: issue.message })));
        if (mapped) setErrors(mapped.fields);
      }
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const images = draft.media.filter(isImage);
  const videos = draft.media.filter(isVideo);

  return (
    <div className="mobile-page max-w-3xl pb-32">
      <div className="flex items-center gap-3">
        <Link href="/mon-espace" className="icon-button" aria-label={copy.back}>
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1>{copy.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <Link href={`/prestataire/${encodeURIComponent(provider.id)}`} className="icon-button" aria-label={copy.viewProfile}>
          <ExternalLink size={18} aria-hidden />
        </Link>
      </div>

      {isAdminViewer && <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-xs text-muted-foreground">{copy.admin.readOnly}</p>}

      <div role="tablist" aria-label={copy.tabs.label} className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => switchTab(item.key)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-xs font-bold whitespace-nowrap transition",
              tab === item.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-7">
        <fieldset disabled={readOnly && tab !== "moderation"} className="min-w-0 space-y-4 disabled:opacity-70">
          {tab === "infos" && <StepInfos heading={false} value={draft.infos} onChange={(value) => patch("infos", value)} errors={errors} onBusyChange={busyFor.photo} />}
          {tab === "services" && <StepServices heading={false} tree={tree} value={draft.services} onChange={(value) => patch("services", value)} errors={errors} />}
          {tab === "location" && <StepLocation heading={false} value={draft.location} onChange={(value) => patch("location", value)} errors={errors} />}
          {tab === "public" && <PublicProfileFields value={draft.public} onChange={(value) => patch("public", value)} errors={errors} />}
          {tab === "schedule" && (
            <>
              <p className="rounded-2xl bg-secondary px-4 py-3 text-xs text-muted-foreground">{copy.scheduleNotice}</p>
              <ScheduleEditor value={draft.schedule} onChange={(schedule) => patch("schedule", schedule)} />
              {errors.schedule && (
                <p role="alert" className="text-xs font-semibold text-destructive">
                  {errors.schedule}
                </p>
              )}
            </>
          )}
          {tab === "media" && (
            <>
              <h2 className="text-lg font-extrabold">{copy.mediaTitle}</h2>
              <PhotoDropzone
                multiple
                label={onboardingCopy.public.gallery}
                hint={onboardingCopy.public.galleryHint(images.length, MEDIA_LIMITS.maxImages)}
                value={images}
                onChange={(next) => patch("media", [...next, ...videos])}
                onBusyChange={busyFor.gallery}
              />
              <VideoEditor value={videos} onChange={(next) => patch("media", [...images, ...next])} onBusyChange={busyFor.video} />
              {errors.media && (
                <p role="alert" className="text-xs font-semibold text-destructive">
                  {errors.media}
                </p>
              )}
            </>
          )}
          {tab === "moderation" && (
            <div className="space-y-4">
              <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
                <input type="checkbox" checked={moderation.hidden} onChange={(event) => setModeration({ ...moderation, hidden: event.target.checked })} className="size-4 accent-primary" />
                {copy.admin.hidden}
              </label>
              <p className="-mt-2 text-xs text-muted-foreground">{copy.admin.hiddenHint}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label={copy.admin.tier} value={moderation.premiumTier} onChange={(event) => setModeration({ ...moderation, premiumTier: event.target.value as PremiumTier })}>
                  {(Object.keys(copy.admin.tiers) as PremiumTier[]).map((tier) => (
                    <option key={tier} value={tier}>
                      {copy.admin.tiers[tier]}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label={copy.admin.verification}
                  value={moderation.verificationStatus}
                  onChange={(event) => setModeration({ ...moderation, verificationStatus: event.target.value as VerificationStatus })}
                >
                  {(Object.keys(copy.admin.statuses) as VerificationStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {copy.admin.statuses[status]}
                    </option>
                  ))}
                </SelectField>
              </div>
              {moderation.verificationStatus === "REJECTED" && (
                <TextAreaField label={copy.admin.rejectionReason} required rows={3} maxLength={500} value={moderation.rejectionReason} onChange={(event) => setModeration({ ...moderation, rejectionReason: event.target.value })} />
              )}
              {errors.rejectionReason && (
                <p role="alert" className="text-xs font-semibold text-destructive">
                  {errors.rejectionReason}
                </p>
              )}
            </div>
          )}
        </fieldset>
        <FormError message={formError} className="mt-4" />
      </div>

      {(!readOnly || tab === "moderation") && (
        <div className="sticky bottom-[calc(88px+env(safe-area-inset-bottom))] z-30 mt-4 sm:bottom-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/95 p-3 shadow-soft-lg backdrop-blur">
            <span className={cn("text-xs font-semibold", dirty ? "text-amber-700" : "text-muted-foreground")} role="status">
              {dirty ? copy.dirty : uploading ? onboardingCopy.footer.uploading : ""}
            </span>
            <button type="button" onClick={() => void save()} disabled={!dirty || saving || uploading} aria-busy={saving} className="primary-action primary-action--gold w-auto min-h-11 px-5 text-sm">
              {saving ? (
                <>
                  <Spinner /> {copy.saving}
                </>
              ) : (
                <>
                  <Save size={16} aria-hidden /> {tab === "moderation" ? copy.admin.save : copy.save}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
