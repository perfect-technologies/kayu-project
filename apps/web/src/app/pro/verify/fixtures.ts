import type { VerificationDocKind, VerificationState } from "@kayu/schemas";
import type { IconName } from "@kayu/ui/web";

export type VerifyStep = {
  id: string;
  label: string;
  icon: IconName;
  required: boolean;
  caption: string;
  kinds: VerificationDocKind[];
};

export const VERIFY_STEPS: VerifyStep[] = [
  {
    id: "identity",
    label: "Identité",
    icon: "idCard",
    required: true,
    caption: "Carte d'identité ou passeport",
    kinds: ["ID_FRONT", "ID_BACK"],
  },
  {
    id: "selfie",
    label: "Selfie",
    icon: "selfie",
    required: true,
    caption: "Pour confirmer que c'est bien vous",
    kinds: ["SELFIE"],
  },
  {
    id: "address",
    label: "Adresse",
    icon: "mapPin",
    required: true,
    caption: "Facture EDC / Regideso récente",
    kinds: ["ADDRESS"],
  },
  {
    id: "cert",
    label: "Certificat métier",
    icon: "award",
    required: false,
    caption: "Optionnel · augmente vos chances",
    kinds: ["CERT_OPTIONAL"],
  },
];

export const VERIFY_BENEFITS: {
  icon: IconName;
  label: string;
  desc: string;
}[] = [
  {
    icon: "badgeCheck",
    label: "Badge « De confiance »",
    desc: "Affiché sur votre profil · +40% de vues",
  },
  {
    icon: "trendingUp",
    label: "Meilleur classement",
    desc: "Vous apparaissez plus haut dans les recherches",
  },
  {
    icon: "zap",
    label: "Missions premium",
    desc: "Accès aux demandes urgentes et haut de gamme",
  },
  {
    icon: "shieldCheck",
    label: "Assurance KAYOU",
    desc: "Couverture en cas de litige ou accident",
  },
];

export const VERIFIED_TIPS: { icon: IconName; label: string; desc: string }[] =
  [
    {
      icon: "camera",
      label: "Ajoute 3 photos de chantier",
      desc: "Les profils avec portfolio reçoivent 2× plus de demandes",
    },
    {
      icon: "clock",
      label: "Réponds en moins de 30 min",
      desc: "Tu gagnes le tag « Réponse rapide » visible en search",
    },
    {
      icon: "sparkles",
      label: "10 missions notées débloquent « De confiance »",
      desc: "Maintiens une note moyenne > 4.5 pour viser « Expert »",
    },
    {
      icon: "users",
      label: "Partage ton profil",
      desc: "Les clients qui viennent de ton lien comptent 2× plus",
    },
  ];

export type StatusConfig = {
  tint: string;
  tintBg: string;
  icon: IconName;
  title: string;
  sub: string;
  cta: string | null;
};

export const STATUS_CONFIG: Record<VerificationState, StatusConfig> = {
  NOT_STARTED: {
    tint: "#D97706",
    tintBg: "#FEF3C7",
    icon: "shieldCheck",
    title: "Vérifiez votre compte",
    sub: "Obtenez le badge « De confiance » pour rassurer les clients et recevoir plus de demandes.",
    cta: "Commencer la vérification",
  },
  IN_PROGRESS: {
    tint: "#0EA5E9",
    tintBg: "#E0F2FE",
    icon: "upload",
    title: "Continuez où vous en étiez",
    sub: "Envoyez les documents restants pour soumettre votre dossier.",
    cta: "Reprendre",
  },
  IN_REVIEW: {
    tint: "#7C3AED",
    tintBg: "#EDE9FE",
    icon: "clock",
    title: "Dossier en cours d'examen",
    sub: "Notre équipe vérifie vos documents. Délai habituel : moins de 2 heures.",
    cta: null,
  },
  VERIFIED: {
    tint: "#059669",
    tintBg: "#D1FAE5",
    icon: "badgeCheck",
    title: "Vous êtes vérifié !",
    sub: "Votre profil affiche maintenant le badge « De confiance ». Vos chances d'être choisi augmentent significativement.",
    cta: "Voir mon profil",
  },
  REJECTED: {
    tint: "#DC2626",
    tintBg: "#FEE2E2",
    icon: "xCircle",
    title: "Vérification refusée",
    sub: "Un de vos documents n'est pas lisible. Vous pouvez soumettre à nouveau.",
    cta: "Renvoyer les documents",
  },
};

export function pretendUploadUrl(kind: VerificationDocKind): string {
  const token = Math.random().toString(36).slice(2, 10);
  return `https://placeholder.kayou.cd/verification/${kind.toLowerCase()}-${token}`;
}
