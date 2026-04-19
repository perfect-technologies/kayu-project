import type { CategorySlug } from '@kayu/ui';

// DS07 — type shapes used by JobRequestsScreen + QuoteComposeScreen. Data now
// flows from the backend (I04 for requests, I05 for quote lookup). Only the
// quote-preset static catalog remains in code (product config, not data).

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
