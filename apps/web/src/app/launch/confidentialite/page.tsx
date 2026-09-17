import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock3,
  Database,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { CampaignHeader } from "../CampaignHeader";
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
    <div className="k-campaign flex min-h-dvh flex-col text-foreground">
      <CampaignHeader
        label="KAYOU — retour à la préinscription"
        className="max-w-3xl"
      >
        <span className="text-xs font-semibold text-muted-foreground">
          Version {privacyNoticeVersion}
        </span>
      </CampaignHeader>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.19em] text-primary">
          Préinscription
        </p>
        <h1 className="mb-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Vos informations, en clair
        </h1>
        <p className="mb-7 max-w-[620px] text-base leading-relaxed text-muted-foreground">
          Cette notice s’applique aux deux parcours de préinscription KAYOU.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {NOTICE_ITEMS.map(({ icon: Icon, title, text }) => (
            <section
              key={title}
              className="rounded-2xl bg-white p-5 shadow-soft"
            >
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <h2 className="mb-1.5 text-[15px] font-bold">{title}</h2>
              <p className="text-[13px] leading-5 text-muted-foreground">
                {text}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-4 rounded-2xl bg-secondary p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
              <Mail aria-hidden className="size-5" />
            </span>
            <div>
              <h2 className="mb-1 text-[15px] font-bold">
                Vos choix restent les vôtres
              </h2>
              <p className="text-[13px] leading-5 text-foreground/80">
                Vous pouvez demander une copie, une correction, le retrait de
                votre demande ou sa suppression à{" "}
                <a
                  href={`mailto:${privacyContact}`}
                  className="font-semibold text-primary underline underline-offset-2"
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
          href="/launch"
          className="primary-action mt-7 sm:w-auto sm:px-8"
        >
          Retour à la préinscription
        </Link>
      </main>
    </div>
  );
}
