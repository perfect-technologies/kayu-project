import type { CategorySlug } from "@kayu/ui";

export type OnboardingData = {
  // Step 1 — Toi & ton métier
  firstName: string;
  lastName: string;
  phone: string;
  categories: string[]; // backend category IDs
  subcategoryIds: string[];
  title: string;
  years: string;
  skills: string[];
  // Step 2 — Où tu interviens
  zones: string[]; // keys "City|Commune"
  // Step 3 — Ton prix de départ
  hourly: number;
  // Carried, set with sane defaults, editable later from the profile
  languages: string[];
  // Publish
  acceptedTerms: boolean;
};

export const CITIES = [
  {
    name: "Kinshasa",
    communes: [
      "Bandalungwa",
      "Barumbu",
      "Bumbu",
      "Gombe",
      "Kalamu",
      "Kasa-Vubu",
      "Kimbanseke",
      "Kinshasa",
      "Kintambo",
      "Kisenso",
      "Lemba",
      "Limete",
      "Lingwala",
      "Makala",
      "Maluku",
      "Masina",
      "Matete",
      "Mont Ngafula",
      "Ndjili",
      "Ngaba",
      "Ngaliema",
      "Ngiri-Ngiri",
      "Nsele",
      "Selembao",
    ],
  },
];

// Default languages pre-selected for the launch market (Kinshasa). Editable
// later from the profile. Congo-Brazzaville / other cities come later.
export const DEFAULT_LANGUAGES = ["Français", "Lingala"];

export const LANGUAGES = [
  "Français",
  "Lingala",
  "Swahili",
  "Kikongo",
  "Tshiluba",
  "Anglais",
];

export const YEARS_OPTIONS = [
  "< 1 an",
  "1–3 ans",
  "4–7 ans",
  "8+ ans",
] as const;

// Tap-to-pick professional titles per trade. "Autre…" unlocks a free input.
export const TITLE_SUGGESTIONS: Partial<Record<CategorySlug, string[]>> = {
  plomberie: ["Plombier", "Plombier-chauffagiste", "Plombier sanitaire"],
  electricite: ["Électricien", "Électricien bâtiment", "Installateur solaire"],
  menage: ["Agent d'entretien", "Aide-ménagère", "Nettoyage professionnel"],
  coiffure: ["Coiffeur", "Coiffeuse", "Barbier", "Coiffure à domicile"],
  informatique: [
    "Technicien informatique",
    "Dépanneur PC",
    "Installateur réseau",
  ],
  jardinage: ["Jardinier", "Paysagiste", "Élagueur"],
  peinture: ["Peintre en bâtiment", "Peintre décorateur"],
  transport: ["Chauffeur", "Déménageur", "Livreur"],
  menuiserie: ["Menuisier", "Ébéniste", "Poseur"],
};

// Static curated per-trade starting-price guidance (FC, Kinshasa). NOT live
// analytics — a helpful anchor the provider can ignore.
export const PRICE_GUIDANCE: Partial<
  Record<CategorySlug, { min: number; max: number }>
> = {
  plomberie: { min: 12000, max: 18000 },
  electricite: { min: 10000, max: 18000 },
  menage: { min: 8000, max: 15000 },
  coiffure: { min: 5000, max: 15000 },
  informatique: { min: 10000, max: 25000 },
  jardinage: { min: 8000, max: 15000 },
  peinture: { min: 12000, max: 20000 },
  transport: { min: 10000, max: 30000 },
  menuiserie: { min: 15000, max: 30000 },
};

export const HOURLY_PRESETS = [5000, 8000, 12000, 15000];

export const SKILL_SUGGESTIONS: Partial<Record<CategorySlug, string[]>> = {
  plomberie: [
    "Fuites d'eau",
    "Chauffe-eau",
    "Installation sanitaire",
    "Débouchage",
    "Canalisations",
    "Évacuations",
    "Robinetterie",
    "Salle de bain",
  ],
  electricite: [
    "Dépannage",
    "Installation tableau",
    "Éclairage LED",
    "Prises",
    "Moteurs",
    "Onduleurs",
    "Groupe électrogène",
    "Câblage",
  ],
  menage: [
    "Grand ménage",
    "Entretien régulier",
    "Lessive",
    "Vitres",
    "Désinfection",
    "Cuisine",
    "Repassage",
  ],
  coiffure: ["Coupe", "Tresses", "Couleur", "Lissage", "Extensions", "Barbier", "Mariage"],
  informatique: [
    "Dépannage PC",
    "Installation réseau",
    "Récupération de données",
    "Formatage",
    "Antivirus",
    "Impression",
    "Configuration box",
  ],
  jardinage: ["Tonte", "Élagage", "Entretien", "Plantation", "Arrosage", "Désherbage"],
  peinture: ["Intérieur", "Extérieur", "Ravalement", "Décoration", "Enduit"],
  transport: [
    "Déménagement",
    "Livraison",
    "Course",
    "Transport meubles",
    "Location utilitaire",
  ],
  menuiserie: [
    "Sur mesure",
    "Pose portes",
    "Pose fenêtres",
    "Mobilier",
    "Parquet",
    "Placard",
  ],
};
