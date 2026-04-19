import type { IconName } from '@kayu/ui/mobile';

export type VerifyState =
  | 'not_started'
  | 'in_progress'
  | 'in_review'
  | 'verified'
  | 'rejected';

export type VerifyStep = {
  id: string;
  label: string;
  icon: IconName;
  required: boolean;
  caption: string;
};

export const VERIFY_STEPS: VerifyStep[] = [
  {
    id: 'identity',
    label: 'Identité',
    icon: 'idCard',
    required: true,
    caption: "Carte d'identité ou passeport",
  },
  {
    id: 'selfie',
    label: 'Selfie',
    icon: 'selfie',
    required: true,
    caption: "Pour confirmer que c'est bien vous",
  },
  {
    id: 'address',
    label: 'Adresse',
    icon: 'mapPin',
    required: true,
    caption: 'Facture EDC / Regideso récente',
  },
  {
    id: 'cert',
    label: 'Certificat métier',
    icon: 'award',
    required: false,
    caption: 'Optionnel · augmente vos chances',
  },
];

export const VERIFY_BENEFITS: { icon: IconName; label: string; desc: string }[] = [
  {
    icon: 'badgeCheck',
    label: 'Badge « De confiance »',
    desc: '+40% de vues',
  },
  {
    icon: 'trendingUp',
    label: 'Meilleur classement',
    desc: 'Plus haut en recherche',
  },
  {
    icon: 'zap',
    label: 'Missions premium',
    desc: 'Demandes urgentes',
  },
  {
    icon: 'shieldCheck',
    label: 'Assurance KAYOU',
    desc: 'Couverture litige / accident',
  },
];

export type StatusConfig = {
  tint: string;
  tintBg: string;
  icon: IconName;
  title: string;
  sub: string;
  cta: string | null;
  progress: number;
};

export const STATUS_CONFIG: Record<VerifyState, StatusConfig> = {
  not_started: {
    tint: '#D97706',
    tintBg: '#FEF3C7',
    icon: 'shieldCheck',
    title: 'Vérifiez votre compte',
    sub: 'Obtenez le badge « De confiance » pour rassurer les clients et recevoir plus de demandes.',
    cta: 'Commencer la vérification',
    progress: 0,
  },
  in_progress: {
    tint: '#0EA5E9',
    tintBg: '#E0F2FE',
    icon: 'upload',
    title: 'Continuez où vous en étiez',
    sub: 'Il vous reste 2 documents à envoyer.',
    cta: 'Reprendre',
    progress: 50,
  },
  in_review: {
    tint: '#7C3AED',
    tintBg: '#EDE9FE',
    icon: 'clock',
    title: "Dossier en cours d'examen",
    sub: 'Notre équipe vérifie vos documents. Délai habituel : moins de 2 heures.',
    cta: null,
    progress: 75,
  },
  verified: {
    tint: '#059669',
    tintBg: '#D1FAE5',
    icon: 'badgeCheck',
    title: 'Vous êtes vérifié !',
    sub: 'Votre profil affiche maintenant le badge « De confiance ».',
    cta: 'Voir mon profil',
    progress: 100,
  },
  rejected: {
    tint: '#DC2626',
    tintBg: '#FEE2E2',
    icon: 'xCircle',
    title: 'Vérification refusée',
    sub: "Un de vos documents n'est pas lisible. Vous pouvez soumettre à nouveau.",
    cta: 'Renvoyer les documents',
    progress: 0,
  },
};

export const PRO_DISPUTE = {
  ref: 'B-2847',
  opened: 'Il y a 2h',
  client: 'Marie K.',
  service: 'Réparation fuite sous évier',
  amount: 24000,
  reason: 'Travail non conforme',
  clientSide:
    "L'évier fuit toujours le lendemain. J'ai essayé de joindre le pro mais sans réponse. Je demande un remboursement.",
  deadline: 'Il vous reste 22h pour répondre',
  evidence: 2,
};
