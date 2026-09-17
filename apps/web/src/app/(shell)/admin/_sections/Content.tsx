"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import { SITE_SETTING_BOOLEAN_KEYS, SITE_SETTING_STRING_KEYS, type AdminUpdateSettingsDto, type SiteSettings } from "@kayu/schemas";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Field, TextAreaField } from "@/components/forms/Field";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SectionTitle } from "../_components/SectionTitle";
import { ToggleRow } from "../_components/ToggleRow";
import { useAdminMutation } from "../_components/useAdminMutation";

const copy = adminCopy.content;
type StringKey = (typeof SITE_SETTING_STRING_KEYS)[number];
type BooleanKey = (typeof SITE_SETTING_BOOLEAN_KEYS)[number];

const GROUPS: Array<{ key: keyof typeof copy.groups; fields: StringKey[]; toggles?: BooleanKey[]; multiline?: StringKey[] }> = [
  { key: "hero", fields: ["hero_title", "hero_subtitle", "hero_cta", "tagline"], multiline: ["hero_subtitle"] },
  { key: "how", fields: ["how1_title", "how1_desc", "how2_title", "how2_desc", "how3_title", "how3_desc"], multiline: ["how1_desc", "how2_desc", "how3_desc"] },
  { key: "premium", fields: ["premium_title", "premium_subtitle"], multiline: ["premium_subtitle"] },
  { key: "contact", fields: ["contact_phone", "contact_email", "contact_website"] },
  { key: "features", fields: [], toggles: ["feat_booking", "feat_reviews", "feat_whatsapp", "contacts_require_premium"] },
  { key: "maintenance", fields: ["maintenance_message"], toggles: ["maintenance_mode"], multiline: ["maintenance_message"] },
];

function diff(saved: SiteSettings, draft: SiteSettings): AdminUpdateSettingsDto {
  const patch: Record<string, string | boolean> = {};
  for (const key of SITE_SETTING_STRING_KEYS) if (draft[key] !== saved[key]) patch[key] = draft[key];
  for (const key of SITE_SETTING_BOOLEAN_KEYS) if (draft[key] !== saved[key]) patch[key] = draft[key];
  return patch as AdminUpdateSettingsDto;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-white p-5">
      <h3 className="mb-4 text-base font-extrabold text-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Content() {
  const query = useQuery({ queryKey: queryKeys.admin.settings, queryFn: () => adminApi(apiClient).settings() });
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (query.data && draft === null) setDraft(query.data);
  }, [query.data, draft]);

  const save = useAdminMutation({
    mutationFn: (dto: AdminUpdateSettingsDto) => adminApi(apiClient).updateSettings(dto),
    invalidate: [queryKeys.admin.settings, queryKeys.settings.public],
    success: copy.saved,
    onSuccess: (settings) => {
      setDraft(settings);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1500);
    },
  });

  if (query.isError) return <ErrorCard onRetry={() => void query.refetch()} />;
  if (!draft || !query.data) return <SkeletonList count={3} />;
  const saved = query.data;
  const patch = diff(saved, draft);
  const dirty = Object.keys(patch).length > 0;
  const setString = (key: StringKey, value: string) => setDraft((current) => (current ? { ...current, [key]: value } : current));
  const setBoolean = (key: BooleanKey, value: boolean) => setDraft((current) => (current ? { ...current, [key]: value } : current));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!dirty) {
          toast.message(copy.nothingToSave);
          return;
        }
        save.mutate(patch);
      }}
    >
      <SectionTitle
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <button
            type="submit"
            disabled={save.isPending}
            className={cn("inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-800 to-teal-700 px-5 text-sm font-bold text-white shadow-brand disabled:opacity-55", justSaved && "from-emerald-600 to-emerald-600")}
          >
            {justSaved ? <Check size={16} aria-hidden /> : <Save size={16} aria-hidden />}
            {justSaved ? copy.saved : save.isPending ? adminCopy.common.saving : copy.save}
          </button>
        }
      />
      <p className="mb-4 text-xs text-muted-foreground">{copy.emptyHint}</p>
      <div className="grid gap-4 xl:grid-cols-2">
        {GROUPS.map((group) => (
          <Card key={group.key} title={copy.groups[group.key]}>
            {group.toggles?.map((key) => (
              <ToggleRow key={key} label={copy.toggles[key].label} description={copy.toggles[key].description} checked={draft[key]} onChange={(value) => setBoolean(key, value)} />
            ))}
            {group.fields.map((key) =>
              group.multiline?.includes(key) ? (
                <TextAreaField key={key} label={copy.fields[key]} value={draft[key]} rows={2} maxLength={2000} onChange={(event) => setString(key, event.target.value)} />
              ) : (
                <Field key={key} label={copy.fields[key]} value={draft[key]} maxLength={2000} onChange={(event) => setString(key, event.target.value)} />
              ),
            )}
          </Card>
        ))}
      </div>
    </form>
  );
}
