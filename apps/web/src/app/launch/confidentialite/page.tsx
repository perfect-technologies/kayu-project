import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  Database,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { campaignPublicConfig } from "../campaign-data";

export const metadata: Metadata = {
  title: "Confidentialité · Préinscription KAYOU",
  description:
    "Comment KAYOU utilise et protège les informations de préinscription au lancement à Kinshasa.",
};

const NOTICE_ITEMS = [
  {
    icon: Database,
    title: "Données utilisées",
    text: "Vos coordonnées, votre commune, le service choisi et les précisions que vous ajoutez.",
  },
  {
    icon: UserRoundCheck,
    title: "Pourquoi",
    text: "Étudier votre demande et vous recontacter au sujet du lancement KAYOU à Kinshasa.",
  },
  {
    icon: ShieldCheck,
    title: "Qui y accède",
    text: "Uniquement l’équipe KAYOU chargée du lancement et de la protection des données.",
  },
  {
    icon: Clock3,
    title: "Durée",
    text: "Une demande retirée, refusée ou sans réponse est supprimée ou anonymisée 90 jours après le dernier contact. Un nouvel accord sera demandé après 12 mois aux personnes toujours préinscrites.",
  },
] as const;

export default function CampaignPrivacyPage() {
  const { privacyContact, privacyNoticeVersion } = campaignPublicConfig;

  return (
    <div className="k-campaign min-h-screen bg-[var(--k-bg)] text-[var(--k-text-primary)]">
      <header className="border-b border-[var(--k-border)] bg-[var(--k-surface)]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="KAYOU — retour à la préinscription"
            className="inline-flex min-h-11 items-center gap-2.5"
          >
            <Image src="/logo.svg" alt="" width={30} height={30} priority />
            <span className="font-[var(--k-font-display)] text-[20px] font-extrabold">
              KAYOU
            </span>
          </Link>
          <span className="k-caption">Version {privacyNoticeVersion}</span>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-4 py-8 sm:px-6 sm:py-12">
        <p className="k-overline mb-3 text-[var(--k-primary-hover)]">
          Préinscription
        </p>
        <h1 className="k-display-l mb-3">Vos informations, en clair</h1>
        <p className="k-body-l mb-7 max-w-[620px] text-[var(--k-text-body)]">
          Cette notice s’applique aux deux parcours de préinscription KAYOU.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {NOTICE_ITEMS.map(({ icon: Icon, title, text }) => (
            <section
              key={title}
              className="rounded-[16px] border border-[var(--k-border)] bg-[var(--k-surface)] p-4"
            >
              <Icon
                aria-hidden
                className="mb-3 h-5 w-5 text-[var(--k-primary-hover)]"
              />
              <h2 className="mb-1.5 text-[15px] font-bold">{title}</h2>
              <p className="text-[13px] leading-5 text-[var(--k-text-body)]">
                {text}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-4 rounded-[16px] border border-[var(--k-border)] bg-[var(--k-primary-subtle)] p-4">
          <div className="flex items-start gap-3">
            <Mail
              aria-hidden
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--k-primary-hover)]"
            />
            <div>
              <h2 className="mb-1 text-[15px] font-bold">
                Vos choix restent les vôtres
              </h2>
              <p className="text-[13px] leading-5 text-[var(--k-text-body)]">
                Vous pouvez demander une copie, une correction, le retrait de
                votre demande ou sa suppression à{" "}
                <a
                  href={`mailto:${privacyContact}`}
                  className="font-semibold text-[var(--k-primary-hover)] underline underline-offset-2"
                >
                  {privacyContact}
                </a>
                . Les nouvelles du lancement nécessitent un accord facultatif
                séparé.
              </p>
            </div>
          </div>
        </section>

        <Link
          href="/"
          className="k-btn k-btn-primary mt-6 min-h-12 w-full sm:w-auto"
        >
          Retour à la préinscription
        </Link>
      </main>
    </div>
  );
}
