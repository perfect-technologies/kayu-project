import type { CategorySlug } from '@kayu/ui';

export type IdUploads = { front?: boolean; back?: boolean };
export type TravelMode = 'free' | 'fixed';
export type PaymentMethod = 'airtel' | 'mpesa' | 'orange' | 'mtn';

export type OnboardingData = {
  firstName: string;
  lastName: string;
  phone: string;
  id: IdUploads;
  // Backend category IDs. Labels and visuals are resolved from the categories API.
  categories: string[];
  subcategoryIds: string[];
  title: string;
  years: string;
  skills: string[];
  zones: string[];
  radius: number;
  hourly: number;
  travelMode: TravelMode;
  payment: PaymentMethod;
  photo: boolean;
  bio: string;
  portfolio: number;
  languages: string[];
  acceptedTerms: boolean;
};

export const CITIES = [
  {
    name: 'Kinshasa',
    communes: ['Gombe', 'Lemba', 'Limete', 'Ngaliema', 'Kintambo', 'Kasa-Vubu', 'Bandal'],
  },
  { name: 'Lubumbashi', communes: ['Kamalondo', 'Lubumbashi', 'Kenya'] },
  { name: 'Brazzaville', communes: ['Poto-Poto', 'Bacongo', 'Makélékélé'] },
  { name: 'Pointe-Noire', communes: ['Tié-Tié', 'Loandjili'] },
];

export const SKILL_SUGGESTIONS: Partial<Record<CategorySlug, string[]>> = {
  plomberie: [
    "Fuites d'eau",
    'Chauffe-eau',
    'Installation sanitaire',
    'Débouchage',
    'Canalisations',
    'Robinetterie',
  ],
  electricite: ['Dépannage', 'Tableau', 'Éclairage LED', 'Prises', 'Onduleurs'],
  menage: ['Grand ménage', 'Entretien régulier', 'Vitres', 'Désinfection'],
  coiffure: ['Coupe', 'Tresses', 'Couleur', 'Lissage', 'Barbier'],
  informatique: ['Dépannage PC', 'Installation réseau', 'Récupération de données'],
  jardinage: ['Tonte', 'Élagage', 'Plantation'],
  peinture: ['Intérieur', 'Extérieur', 'Ravalement'],
  transport: ['Déménagement', 'Livraison', 'Transport meubles'],
  menuiserie: ['Sur mesure', 'Pose portes', 'Mobilier'],
};

export const YEARS_OPTIONS = ['< 1 an', '1–3 ans', '4–7 ans', '8+ ans'] as const;

export const LANGUAGES = ['Français', 'Lingala', 'Swahili', 'Kikongo', 'Tshiluba', 'Anglais'];

export const HOURLY_PRESETS = [5000, 8000, 12000, 15000];

export function validateStep(step: number, d: OnboardingData): boolean {
  switch (step) {
    case 1:
      return (
        d.firstName.trim().length > 0 &&
        d.lastName.trim().length > 0 &&
        d.phone.length === 9 &&
        Boolean(d.id.front) &&
        Boolean(d.id.back)
      );
    case 2:
      return d.categories.length > 0 && d.title.trim().length > 0 && d.years.length > 0;
    case 3:
      return d.zones.length > 0 && d.radius >= 1 && d.radius <= 20;
    case 4:
      return d.hourly > 0;
    case 5:
      return d.bio.trim().length >= 10;
    case 6:
      return d.acceptedTerms;
    default:
      return false;
  }
}
