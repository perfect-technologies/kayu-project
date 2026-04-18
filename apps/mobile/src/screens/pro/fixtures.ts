import type { CategorySlug } from '@kayu/ui';

// DS07 — mock data for JobRequestsScreen + QuoteComposeScreen. Mirrors
// apps/web/src/components/pro/fixtures.ts. Backend wiring deferred.

export type InboundRequest = {
  id: string;
  client: {
    name: string;
    initials: string;
    bg: string;
    rating?: number | null;
    jobs?: number;
    newClient?: boolean;
  };
  service: string;
  category: CategorySlug;
  when: string;
  address: string;
  neighborhood: string;
  distance: number;
  estimatedHours: number;
  budget: number;
  description: string;
  photos: number;
  receivedAt: string;
  expiresIn: string;
  expiresMinutes: number;
  competing?: number;
  matchScore: number;
  urgent?: boolean;
};

export type ActiveJobStatus = 'scheduled' | 'enroute' | 'arrived' | 'in_progress';

export type ActiveJob = {
  id: string;
  client: { name: string; initials: string; bg: string };
  service: string;
  when: string;
  address: string;
  status: ActiveJobStatus;
  payout: number;
};

export type LineItemPreset = {
  label: string;
  unit: string;
  unitPrice: number;
};

export const INCOMING_REQUESTS: InboundRequest[] = [
  {
    id: 'r1',
    client: {
      name: 'Marie Kabongo',
      initials: 'MK',
      bg: '#FB7185',
      rating: 4.9,
      jobs: 14,
    },
    service: 'Fuite sous évier cuisine',
    category: 'plomberie',
    when: "Dès que possible · idéalement aujourd'hui",
    address: 'Av. Kasa-Vubu 42, Gombe',
    neighborhood: 'Gombe',
    distance: 2.1,
    estimatedHours: 1.5,
    budget: 15000,
    description:
      "L'eau goutte depuis ce matin, j'ai mis un seau. Urgent si possible.",
    photos: 2,
    receivedAt: 'il y a 4 min',
    expiresIn: '27 min',
    expiresMinutes: 27,
    competing: 3,
    matchScore: 94,
    urgent: true,
  },
  {
    id: 'r2',
    client: {
      name: 'Papa Léon',
      initials: 'PL',
      bg: '#10B981',
      rating: 4.7,
      jobs: 23,
    },
    service: 'Installation chauffe-eau 80L',
    category: 'plomberie',
    when: 'Samedi 19 avril · matin',
    address: 'Bld. du 30 juin 112, Gombe',
    neighborhood: 'Gombe',
    distance: 3.4,
    estimatedHours: 3,
    budget: 45000,
    description:
      'Chauffe-eau déjà acheté sur place. Besoin d’un raccordement propre et mise en service.',
    photos: 4,
    receivedAt: 'il y a 22 min',
    expiresIn: '2h 03min',
    expiresMinutes: 123,
    competing: 1,
    matchScore: 88,
  },
  {
    id: 'r3',
    client: {
      name: 'Christelle M.',
      initials: 'CM',
      bg: '#7C3AED',
      rating: null,
      jobs: 0,
      newClient: true,
    },
    service: 'Débouchage WC + lavabo',
    category: 'plomberie',
    when: 'Flexible · cette semaine',
    address: 'Av. Kabinda 7, Lingwala',
    neighborhood: 'Lingwala',
    distance: 5.8,
    estimatedHours: 1,
    budget: 12000,
    description:
      'Deux problèmes dans la même salle de bain. Merci d’apporter matériel de débouchage.',
    photos: 0,
    receivedAt: 'il y a 1h',
    expiresIn: '4h',
    expiresMinutes: 240,
    competing: 5,
    matchScore: 82,
  },
];

export const PRO_ACTIVE_JOBS: ActiveJob[] = [
  {
    id: 'j1',
    client: { name: 'Joseph Mbuyi', initials: 'JM', bg: '#F59E0B' },
    service: 'Remplacement robinetterie cuisine',
    when: "Aujourd'hui · 14:00",
    address: 'Av. de la Paix 18, Ngaliema',
    status: 'scheduled',
    payout: 28000,
  },
  {
    id: 'j2',
    client: { name: 'Famille Mutombo', initials: 'FM', bg: '#0EA5E9' },
    service: 'Réparation fuite salle de bain',
    when: 'Hier · 16:00 — en cours',
    address: 'Rue des Écoles 4, Kintambo',
    status: 'in_progress',
    payout: 22000,
  },
];

export const PRESET_LINE_ITEMS: Record<string, LineItemPreset[]> = {
  plomberie: [
    { label: 'Diagnostic + déplacement', unit: 'Forfait', unitPrice: 5000 },
    { label: "Main-d'œuvre plombier", unit: 'Heure', unitPrice: 8000 },
    { label: 'Remplacement joint/robinet', unit: 'Pièce', unitPrice: 4500 },
    { label: 'Débouchage canalisation', unit: 'Forfait', unitPrice: 12000 },
  ],
  electricite: [
    { label: 'Diagnostic électrique', unit: 'Forfait', unitPrice: 5000 },
    { label: "Main-d'œuvre électricien", unit: 'Heure', unitPrice: 8500 },
    { label: 'Fourniture matériel', unit: 'Pièce', unitPrice: 0 },
  ],
  default: [
    { label: 'Déplacement', unit: 'Forfait', unitPrice: 5000 },
    { label: "Main-d'œuvre", unit: 'Heure', unitPrice: 7500 },
    { label: 'Matériel', unit: 'Pièce', unitPrice: 0 },
  ],
};

export function getPresets(category: string | undefined | null): LineItemPreset[] {
  if (!category) return PRESET_LINE_ITEMS.default;
  return PRESET_LINE_ITEMS[category] ?? PRESET_LINE_ITEMS.default;
}

export function findRequest(id: string | null | undefined): InboundRequest | undefined {
  if (!id) return undefined;
  return INCOMING_REQUESTS.find((r) => r.id === id);
}
