"use client";

import Image from "next/image";
import Link from "next/link";
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
import {
  emitCampaignEvent,
  parseCampaignAttribution,
  type CampaignLeadType,
} from "@/lib/campaign-leads";
import { campaignScrollBehavior } from "@/lib/campaign-routing";

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
    <div className="k-campaign min-h-screen bg-[var(--k-bg)] text-[var(--k-text-primary)]">
      <header className="border-b border-[var(--k-border)] bg-[rgba(250,250,249,0.94)]">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="KAYOU — accueil de la campagne"
            className="inline-flex min-h-11 items-center gap-2.5"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={30}
              height={30}
              priority
              className="h-8 w-8"
            />
            <span className="font-[var(--k-font-display)] text-[20px] font-extrabold tracking-[-0.02em]">
              KAYOU
            </span>
          </Link>
          <span className="rounded-full border border-[var(--k-border)] bg-[var(--k-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--k-text-muted)]">
            Ouverture prochaine · Kinshasa
          </span>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1120px] gap-8 px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-12 lg:px-8 lg:pb-14 lg:pt-16">
          <div className="lg:sticky lg:top-6">
            <p className="k-overline mb-4 inline-flex items-center gap-2 text-[var(--k-primary-hover)]">
              <MapPin aria-hidden className="h-4 w-4" />
              Kinshasa
            </p>
            <h1 className="k-display-xl mb-5 max-w-[720px]">
              KAYOU arrive bientôt à{" "}
              <span className="bg-[linear-gradient(100deg,#0EA5E9_0%,#0EA5E9_45%,#FB7185_100%)] bg-clip-text text-transparent">
                Kinshasa
              </span>
              .
            </h1>
            <p className="k-body-l mb-6 max-w-[620px] text-[var(--k-text-body)]">
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
                    className={`group min-h-[116px] rounded-[16px] border p-4 text-left transition-[border-color,background-color,box-shadow] ${
                      selected
                        ? "border-[var(--k-primary)] bg-[var(--k-primary-subtle)] shadow-[var(--k-e1)]"
                        : "border-[var(--k-border)] bg-[var(--k-surface)] hover:border-[var(--k-border-strong)]"
                    }`}
                  >
                    <span className="mb-3 flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] ${
                          selected
                            ? "bg-[var(--k-primary)] text-white"
                            : "bg-[var(--k-surface-muted)] text-[var(--k-text-body)]"
                        }`}
                      >
                        <Icon aria-hidden className="h-5 w-5" />
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 text-[var(--k-text-muted)] transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                    <span className="mb-1 block font-[var(--k-font-display)] text-[16px] font-bold">
                      {item.label}
                    </span>
                    <span className="block text-[13px] leading-5 text-[var(--k-text-muted)]">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 border-t border-[var(--k-border)] pt-5">
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
                  className="flex items-start gap-3 text-[13px] leading-5 text-[var(--k-text-body)]"
                >
                  <Icon
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--k-primary-hover)]"
                  />
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
              <div
                id="interest-form"
                role="status"
                className="scroll-mt-6 rounded-[20px] border border-dashed border-[var(--k-border-strong)] bg-[var(--k-surface)] p-5 text-center sm:p-7"
              >
                <CheckCircle2
                  aria-hidden
                  className="mx-auto mb-3 h-7 w-7 text-[var(--k-primary-hover)]"
                />
                <p className="text-[14px] font-semibold text-[var(--k-text-body)]">
                  Choisissez un parcours pour commencer.
                </p>
                <p className="mt-1 text-[12px] text-[var(--k-text-muted)]">
                  Deux étapes, seulement l’essentiel.
                </p>
              </div>
            )}

            <details className="group mt-4 rounded-[16px] border border-[var(--k-border)] bg-[var(--k-surface)]">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
                Tous les services prévus au lancement
                <ChevronDown
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-[var(--k-text-muted)] transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="border-t border-[var(--k-border)] px-4 py-4">
                {categories.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categories.map((category) => (
                      <div key={category.id}>
                        <h3 className="mb-1.5 text-[13px] font-bold text-[var(--k-text-primary)]">
                          {category.name}
                        </h3>
                        <p className="text-[12px] leading-5 text-[var(--k-text-muted)]">
                          {category.subcategories
                            .map((subcategory) => subcategory.name)
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    role="status"
                    className="text-[13px] text-[var(--k-text-muted)]"
                  >
                    Les services prévus n’ont pas pu être chargés. Rechargez
                    cette page avant votre préinscription.
                  </p>
                )}
              </div>
            </details>

            <div className="mt-4 rounded-[16px] border border-[var(--k-border)] bg-[#FFFBF5] p-4">
              <h2 className="mb-2 text-[14px] font-bold">
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
                    className="flex items-center gap-2 text-[13px] text-[var(--k-text-body)]"
                  >
                    <CircleOff
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-[var(--k-text-muted)]"
                    />
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[var(--k-text-muted)]">
                Ni travail garanti, ni prestataire disponible immédiatement.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--k-border)] bg-[var(--k-surface)]">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-4 py-6 text-[12px] leading-5 text-[var(--k-text-muted)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} KAYOU · Lancement prochain à Kinshasa</span>
          <span>
            Retrait ou correction :{" "}
            <a
              href={`mailto:${privacyContact}`}
              className="font-semibold text-[var(--k-primary-hover)] underline underline-offset-2"
            >
              {privacyContact}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
