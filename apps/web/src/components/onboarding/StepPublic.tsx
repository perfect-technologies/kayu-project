"use client";

import { useMemo } from "react";
import type { CategoryTreeNode } from "@kayu/schemas";
import { MEDIA_LIMITS } from "@kayu/schemas";
import { PhotoDropzone } from "@/components/media/PhotoDropzone";
import { VideoEditor } from "@/components/media/VideoEditor";
import { isImage, isVideo, type MediaDraftItem } from "@/components/media/media-draft";
import { usePlaceAncestors } from "@/components/reference/useReferences";
import { ScheduleEditor } from "@/components/schedule/ScheduleEditor";
import { TermsCheckbox } from "@/components/auth/TermsStep";
import { onboardingCopy } from "@/copy/onboarding";
import { cityOf, countryShort } from "@/lib/dto/provider";
import { BenefitsCard } from "./BenefitsCard";
import { PreviewCard } from "./PreviewCard";
import { PublicProfileFields } from "./PublicProfileFields";
import type { WizardDraft } from "./wizard-state";
import { deepestNode, type FieldErrors } from "./wizard-validation";

const copy = onboardingCopy.public;

export type StepPublicProps = {
  tree: CategoryTreeNode[];
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
  errors: FieldErrors;
  onBusyChange?: (busy: boolean) => void;
};

export function StepPublic({ tree, draft, onChange, errors, onBusyChange }: StepPublicProps) {
  const images = useMemo(() => draft.media.filter(isImage), [draft.media]);
  const videos = useMemo(() => draft.media.filter(isVideo), [draft.media]);
  const place = usePlaceAncestors(draft.placeId);
  const category = tree.find((node) => node.id === draft.categoryId) ?? null;
  const deepest = deepestNode(draft, tree);

  const setImages = (next: MediaDraftItem[]) => onChange({ media: [...next, ...videos] });
  const setVideos = (next: MediaDraftItem[]) => onChange({ media: [...images, ...next] });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">{copy.title}</h2>
      <PublicProfileFields
        value={{ languageIds: draft.languageIds, modeIds: draft.modeIds, pricing: draft.pricing, social: draft.social }}
        onChange={onChange}
        errors={errors}
      />
      <PhotoDropzone multiple label={copy.gallery} hint={copy.galleryHint(images.length, MEDIA_LIMITS.maxImages)} value={images} onChange={setImages} onBusyChange={onBusyChange} />
      <ScheduleEditor value={draft.schedule} onChange={(schedule) => onChange({ schedule })} />
      {errors.schedule && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.schedule}
        </p>
      )}
      <VideoEditor value={videos} onChange={setVideos} onBusyChange={onBusyChange} />
      {errors.media && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.media}
        </p>
      )}
      <PreviewCard
        name={draft.displayName}
        photoUrl={draft.profilePhoto?.url ?? null}
        categoryLabel={category?.name ?? null}
        subcategoryLabel={deepest && deepest.id !== category?.id ? deepest.name : null}
        cityLabel={cityOf(place.chain)?.label ?? null}
        countryLabel={countryShort(place.chain)}
      />
      <TermsCheckbox checked={draft.acceptTerms} onChange={(acceptTerms) => onChange({ acceptTerms })} copy={copy.terms} />
      {errors.acceptTerms && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.acceptTerms}
        </p>
      )}
      <BenefitsCard />
    </div>
  );
}
