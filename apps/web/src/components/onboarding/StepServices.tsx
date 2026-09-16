"use client";

import type { CategoryTreeNode } from "@kayu/schemas";
import { Field, TextAreaField } from "@/components/forms/Field";
import { MultipleChoices } from "@/components/reference/MultipleChoices";
import { onboardingCopy } from "@/copy/onboarding";
import { CategoryCascade, type CategorySelection } from "./CategoryCascade";
import { DESCRIPTION_MAX, FREE_SKILLS_MAX, splitFreeSkills, type FieldErrors } from "./wizard-validation";

const copy = onboardingCopy.services;

export type ServicesValue = CategorySelection & {
  yearsExperience: string;
  skillIds: string[];
  freeSkills: string;
  description: string;
};

export type StepServicesProps = {
  tree: CategoryTreeNode[];
  value: ServicesValue;
  onChange: (patch: Partial<ServicesValue>) => void;
  errors: FieldErrors;
  heading?: boolean;
};

export function StepServices({ tree, value, onChange, errors, heading = true }: StepServicesProps) {
  const freeCount = splitFreeSkills(value.freeSkills).length;
  return (
    <div className="space-y-4">
      {heading && <h2 className="text-lg font-extrabold">{copy.title}</h2>}
      <CategoryCascade
        tree={tree}
        value={{ categoryId: value.categoryId, subcategoryId: value.subcategoryId, serviceId: value.serviceId }}
        onChange={(selection) => onChange({ ...selection, skillIds: selection.categoryId === value.categoryId ? value.skillIds : [] })}
        error={errors.subcategoryId}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={copy.experience}
          type="number"
          inputMode="numeric"
          min={0}
          max={60}
          step={1}
          value={value.yearsExperience}
          error={errors.yearsExperience}
          onChange={(event) => onChange({ yearsExperience: event.target.value.replace(/[^0-9]/g, "").slice(0, 2) })}
        />
        <Field
          label={copy.freeSkills}
          value={value.freeSkills}
          placeholder={copy.freeSkillsPlaceholder}
          hint={copy.freeSkillsHint(freeCount, FREE_SKILLS_MAX)}
          error={errors.freeSkills}
          onChange={(event) => onChange({ freeSkills: event.target.value })}
        />
      </div>
      {value.categoryId && <MultipleChoices label={copy.skills} type="SKILL" categoryId={value.categoryId} value={value.skillIds} onChange={(skillIds) => onChange({ skillIds })} />}
      {errors.skillIds && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.skillIds}
        </p>
      )}
      <TextAreaField
        label={copy.description}
        value={value.description}
        maxLength={DESCRIPTION_MAX}
        placeholder={copy.descriptionPlaceholder}
        counter={copy.counter(value.description.length, DESCRIPTION_MAX)}
        error={errors.description}
        onChange={(event) => onChange({ description: event.target.value })}
      />
    </div>
  );
}
