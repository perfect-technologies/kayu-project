import type { CategorySlug } from "@kayu/ui";

export type IdUploads = { front?: boolean; back?: boolean };
export type TravelMode = "free" | "fixed";
export type PaymentMethod = "airtel" | "mpesa" | "orange" | "mtn";

export type OnboardingData = {
  // Step 1 — identity
  firstName: string;
  lastName: string;
  phone: string;
  id: IdUploads;
  // Step 2 — métier
  categories: CategorySlug[];
  title: string;
  years: string;
  skills: string[];
  // Step 3 — zones
  zones: string[]; // keys "City|Commune"
  radius: number;
  // Step 4 — tarifs
  hourly: number;
  travelMode: TravelMode;
  payment: PaymentMethod;
  // Step 5 — profil
  photo: boolean;
  bio: string;
  portfolio: number;
  languages: string[];
  // Step 6 — publish
  acceptedTerms: boolean;
};

export const CITIES = [
  {
    name: "Kinshasa",
    communes: [
      "Gombe",
      "Lemba",
      "Limete",
      "Ngaliema",
      "Kintambo",
      "Kasa-Vubu",
      "Bandal",
    ],
  },
  {
    name: "Lubumbashi",
    communes: ["Kamalondo", "Lubumbashi", "Kenya"],
  },
  {
    name: "Brazzaville",
    communes: ["Poto-Poto", "Bacongo", "Makélékélé"],
  },
  {
    name: "Pointe-Noire",
    communes: ["Tié-Tié", "Loandjili"],
  },
];

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
  coiffure: [
    "Coupe",
    "Tresses",
    "Couleur",
    "Lissage",
    "Extensions",
    "Barbier",
    "Mariage",
  ],
  informatique: [
    "Dépannage PC",
    "Installation réseau",
    "Récupération de données",
    "Formatage",
    "Antivirus",
    "Impression",
    "Configuration box",
  ],
  jardinage: [
    "Tonte",
    "Élagage",
    "Entretien",
    "Plantation",
    "Arrosage",
    "Désherbage",
  ],
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

export const YEARS_OPTIONS = [
  "< 1 an",
  "1–3 ans",
  "4–7 ans",
  "8+ ans",
] as const;

export const LANGUAGES = [
  "Français",
  "Lingala",
  "Swahili",
  "Kikongo",
  "Tshiluba",
  "Anglais",
];
