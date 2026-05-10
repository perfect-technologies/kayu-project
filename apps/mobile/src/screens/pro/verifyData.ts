import type { VerificationDocKind, VerificationState } from '@kayu/schemas';
import type { IconName } from '@kayu/ui/mobile';

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
    id: 'identity',
    label: 'Identité',
    icon: 'idCard',
    required: true,
    caption: "Carte d'identité ou passeport",
    kinds: ['ID_FRONT', 'ID_BACK'],
  },
  {
    id: 'selfie',
    label: 'Selfie',
    icon: 'selfie',
    required: true,
    caption: "Pour confirmer que c'est bien vous",
    kinds: ['SELFIE'],
  },
  {
    id: 'address',
    label: 'Adresse',
    icon: 'mapPin',
    required: true,
    caption: 'Facture EDC / Regideso récente',
    kinds: ['ADDRESS'],
  },
  {
    id: 'cert',
    label: 'Certificat métier',
    icon: 'award',
    required: false,
    caption: 'Optionnel · augmente vos chances',
    kinds: ['CERT_OPTIONAL'],
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
};

export const STATUS_CONFIG: Record<VerificationState, StatusConfig> = {
  NOT_STARTED: {
    tint: '#D97706',
    tintBg: '#FEF3C7',
    icon: 'shieldCheck',
    title: 'Vérifiez votre compte',
    sub: 'Obtenez le badge « De confiance » pour rassurer les clients et recevoir plus de demandes.',
    cta: 'Commencer la vérification',
  },
  IN_PROGRESS: {
    tint: '#0EA5E9',
    tintBg: '#E0F2FE',
    icon: 'upload',
    title: 'Continuez où vous en étiez',
    sub: 'Envoyez les documents restants pour soumettre votre dossier.',
    cta: 'Reprendre',
  },
  IN_REVIEW: {
    tint: '#7C3AED',
    tintBg: '#EDE9FE',
    icon: 'clock',
    title: "Dossier en cours d'examen",
    sub: 'Notre équipe vérifie vos documents. Délai habituel : sous 24h.',
    cta: null,
  },
  VERIFIED: {
    tint: '#059669',
    tintBg: '#D1FAE5',
    icon: 'badgeCheck',
    title: 'Vous êtes vérifié !',
    sub: 'Votre profil affiche maintenant le badge « De confiance ».',
    cta: 'Voir mon profil',
  },
  REJECTED: {
    tint: '#DC2626',
    tintBg: '#FEE2E2',
    icon: 'xCircle',
    title: 'Vérification refusée',
    sub: "Un de vos documents n'est pas lisible. Vous pouvez soumettre à nouveau.",
    cta: 'Renvoyer les documents',
  },
};

export function pretendUploadUrl(kind: VerificationDocKind): string {
  const token = Math.random().toString(36).slice(2, 10);
  return `https://placeholder.kayou.cd/verification/${kind.toLowerCase()}-${token}`;
}
