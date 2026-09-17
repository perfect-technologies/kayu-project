"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleOff,
  CircleUserRound,
  LockKeyhole,
  MapPin,
} from "lucide-react";

import type { CampaignCategory } from "./campaign-data";
import { CampaignForm } from "./CampaignForm";
import { CampaignHeader } from "./CampaignHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  emitCampaignEvent,
  parseCampaignAttribution,
  type CampaignLeadType,
} from "@/lib/campaign-leads";
import { campaignScrollBehavior } from "@/lib/campaign-routing";
import { cn } from "@/lib/utils";

type CampaignLandingProps = {
  categories: CampaignCategory[];
  initialRole?: CampaignLeadType;
  privacyNoticeVersion: string;
  privacyContact: string;
};

const ROLE_COPY = {
  provider: {
    label: "Je propose mes services",
    description: "Faire partie des premiers prestataires KAYOU.",
    href: "/launch/providers",
    icon: BriefcaseBusiness,
  },
  client: {
    label: "Je cherche un service",
    description: "Être parmi les premiers à trouver un prestataire de confiance.",
    href: "/launch/clients",
    icon: CircleUserRound,
  },
} as const;

export function CampaignLanding({
  categories,
  initialRole,
  privacyNoticeVersion,
  privacyContact,
}: CampaignLandingProps) {
  const [role, setRole] = useState<CampaignLeadType | null>(
    initialRole ?? null,
  );
  const landingTracked = useRef(false);
  const selectedRolesTracked = useRef(new Set<CampaignLeadType>());

  useEffect(() => {
    if (landingTracked.current) return;
    landingTracked.current = true;
    const attribution = parseCampaignAttribution(
      window.location.search,
      document.referrer,
    );
    emitCampaignEvent("launch_landing_viewed", {
      attribution,
    });
    if (initialRole && !selectedRolesTracked.current.has(initialRole)) {
      selectedRolesTracked.current.add(initialRole);
      emitCampaignEvent("launch_role_selected", {
        leadType: initialRole,
        attribution,
      });
    }
  }, [initialRole]);

  const chooseRole = useCallback((nextRole: CampaignLeadType) => {
    setRole(nextRole);
    if (!selectedRolesTracked.current.has(nextRole)) {
      selectedRolesTracked.current.add(nextRole);
      emitCampaignEvent("launch_role_selected", {
        leadType: nextRole,
        attribution: parseCampaignAttribution(
          window.location.search,
          document.referrer,
        ),
      });
    }

    window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      document
        .getElementById("interest-form")
        ?.scrollIntoView({
          behavior: campaignScrollBehavior(reducedMotion),
          block: "start",
        });
    });
  }, []);

  return (
    <div className="k-campaign flex min-h-dvh flex-col text-foreground">
      <CampaignHeader
        label="KAYOU — accueil de la campagne"
        className="max-w-[1120px] lg:px-8"
      >
        <span className="status-pill bg-white">
          Ouverture prochaine · Kinshasa
        </span>
      </CampaignHeader>

      <main className="flex-1">
        <section className="mx-auto grid max-w-[1120px] gap-8 px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-12 lg:px-8 lg:pb-16 lg:pt-14">
          <div className="lg:sticky lg:top-8">
            <p className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.19em] text-primary">
              <MapPin aria-hidden className="size-3.5" />
              Kinshasa
            </p>
            <h1 className="mb-5 max-w-[720px] text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
              KAYOU arrive bientôt à{" "}
              <span className="gradient-text">Kinshasa</span>.
            </h1>
            <p className="mb-7 max-w-[620px] text-base leading-relaxed text-muted-foreground sm:text-lg">
              Préinscrivez-vous gratuitement pour faire partie des premiers.
            </p>

            <div
              aria-label="Choisissez votre parcours"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
            >
              {(Object.keys(ROLE_COPY) as CampaignLeadType[]).map((itemRole) => {
                const item = ROLE_COPY[itemRole];
                const Icon = item.icon;
                const selected = role === itemRole;

                return (
                  <button
                    key={itemRole}
                    type="button"
                    onClick={() => chooseRole(itemRole)}
                    aria-pressed={selected}
                    className={cn(
                      "group min-h-[116px] rounded-2xl border p-4 text-left transition-colors",
                      selected
                        ? "border-primary bg-secondary shadow-soft"
                        : "border-border bg-white hover:bg-secondary/40",
                    )}
                  >
                    <span className="mb-3 flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "inline-flex size-10 items-center justify-center rounded-xl",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-primary",
                        )}
                      >
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                    <span className="mb-1 block font-heading text-base font-bold text-foreground">
                      {item.label}
                    </span>
                    <span className="block text-[13px] leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 border-t border-border pt-5">
              {[
                {
                  icon: LockKeyhole,
                  text: "Préinscription gratuite, sans création de compte.",
                },
                {
                  icon: CheckCircle2,
                  text: "Certains profils seront recontactés avant l’ouverture.",
                },
                {
                  icon: Banknote,
                  text: "Paiement en espèces, directement entre client et prestataire.",
                },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 text-[13px] leading-5 text-foreground/80"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-soft">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {role ? (
              <CampaignForm
                key={role}
                role={role}
                categories={categories}
                privacyNoticeVersion={privacyNoticeVersion}
                privacyContact={privacyContact}
                onChooseOtherRole={() =>
                  chooseRole(role === "provider" ? "client" : "provider")
                }
              />
            ) : (
              <div id="interest-form" role="status" className="scroll-mt-6">
                <EmptyState
                  icon={CheckCircle2}
                  title="Choisissez un parcours pour commencer."
                  description="Deux étapes, seulement l’essentiel."
                />
              </div>
            )}

            <details className="group mt-4 rounded-2xl border border-border bg-white">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-foreground [&::-webkit-details-marker]:hidden">
                Tous les services prévus au lancement
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="border-t border-border px-4 py-4">
                {categories.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categories.map((category) => (
                      <div key={category.id}>
                        <h3 className="mb-1 text-[13px] font-bold text-foreground">
                          {category.name}
                        </h3>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {category.subcategories
                            .map((subcategory) => subcategory.name)
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p role="status" className="text-[13px] text-muted-foreground">
                    Les services prévus n’ont pas pu être chargés. Rechargez
                    cette page avant votre préinscription.
                  </p>
                )}
              </div>
            </details>

            <div className="mt-4 rounded-2xl bg-secondary p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-bold text-foreground">
                Jamais demandé ici
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Mot de passe",
                  "Document d’identité",
                  "Adresse exacte",
                  "Paiement en ligne",
                ].map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 text-[13px] text-foreground/80"
                  >
                    <CircleOff
                      aria-hidden
                      className="size-4 shrink-0 text-primary/60"
                    />
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Ni travail garanti, ni prestataire disponible immédiatement.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-4 py-5 text-xs leading-5 text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} KAYOU · Lancement prochain à Kinshasa</span>
          <span>
            Retrait ou correction :{" "}
            <a
              href={`mailto:${privacyContact}`}
              className="font-semibold text-primary underline underline-offset-2"
            >
              {privacyContact}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
