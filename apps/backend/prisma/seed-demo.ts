import {
  BookingStatus,
  NotificationType,
  Prisma,
  PremiumTier,
  PrismaClient,
  UserRole,
  VerificationStatus,
} from "@prisma/client";
import { GENERATED_PER_CATEGORY, generatedProviders, seededRandom } from "./seed-demo-generated";
import { slugify } from "./seed-places";
import { referenceSlug, skillSlug } from "./seed-references";

const DEFAULT_PASSWORD = "Password123!";
const SLOT_DURATION_MIN = 60;
const SLOT_BUFFER_MIN = 15;
const COMMISSION_PCT = 10;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

type SeedPrismaClient = PrismaClient;

type Timezone = "Africa/Kinshasa" | "Africa/Lubumbashi" | "Africa/Brazzaville";

// Central African time zones observe no daylight saving time.
const UTC_OFFSET_HOURS: Record<Timezone, number> = {
  "Africa/Kinshasa": 1,
  "Africa/Lubumbashi": 2,
  "Africa/Brazzaville": 1,
};

const WEEKLY_RANGES = [
  { startTime: "08:00", endTime: "12:00" },
  { startTime: "13:00", endTime: "17:00" },
];

// Second slot of each weekly range with a 60 min duration and 15 min buffer.
const SLOT_TIMES = ["09:15", "14:15"] as const;

const KINSHASA = "cd-province-kinshasa-city-kinshasa";
const LUBUMBASHI = "cd-province-haut-katanga-city-lubumbashi";
const MATADI = "cd-province-kongo-central-city-matadi";
const BRAZZAVILLE = "cg-city-brazzaville";
const CONGO = "cg";

function kinshasaCommune(label: string): string {
  return `${KINSHASA}-commune-${slugify(label)}`;
}

export type DemoProvider = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasWhatsApp: boolean;
  country: "RDC" | "Congo";
  placeSlug: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  timezone: Timezone;
  description: string;
  yearsExperience: number;
  subcategorySlug: string;
  skillSubcategorySlugs: string[];
  freeSkills: string[];
  languages: string[];
  interventionModes: string[];
  pricing: { amount: number; currency: "CDF" | "USD" | "XAF"; unit: string };
  verificationStatus: VerificationStatus;
  premiumTier: PremiumTier;
  profilePhoto?: string | null;
  generated?: boolean;
};

type DemoClient = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  country: "RDC" | "Congo";
  placeSlug: string;
  addressLine: string;
};

type Lookups = Awaited<ReturnType<typeof loadLookups>>;

type CreatedProvider = {
  index: number;
  userId: string;
  providerId: string;
  name: string;
  timezone: Timezone;
  subcategoryId: string;
  pricingAmount: number;
};

type CreatedClient = {
  userId: string;
  name: string;
  phone: string;
  placeId: string;
  addressLine: string;
};

type BookingSpec = {
  provider: CreatedProvider;
  client: CreatedClient;
  status: BookingStatus;
  dayOffset: number;
  slotTime: (typeof SLOT_TIMES)[number];
  agreedPrice?: number;
  isPaid?: boolean;
  cancelledBy?: "client" | "provider";
};

type CreatedBooking = {
  id: string;
  spec: BookingSpec;
  createdAt: Date;
  completedAt: Date | null;
  agreedPrice: number | null;
  commissionAmt: number;
  providerNetAmt: number;
  isPaid: boolean;
};

const providersData: DemoProvider[] = [
  {
    firstName: "Jean-Pierre",
    lastName: "Mukendi",
    email: "jeanpierre.mukendi@kayou.cd",
    phone: "+243812345670",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: kinshasaCommune("Gombe"),
    addressLine: "24, avenue du Commerce",
    latitude: -4.3036,
    longitude: 15.3107,
    timezone: "Africa/Kinshasa",
    description: "Installations résidentielles, dépannage et mise aux normes électriques à Kinshasa.",
    yearsExperience: 15,
    subcategorySlug: "installation_electrique",
    skillSubcategorySlugs: ["depannage_electrique", "eclairage", "comptage"],
    freeSkills: ["Domotique"],
    languages: ["Français", "Lingala"],
    interventionModes: ["À domicile", "Sur chantier"],
    pricing: { amount: 25000, currency: "CDF", unit: "Par prestation" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.ELITE,
  },
  {
    firstName: "Marie-Claire",
    lastName: "Nzuzi",
    email: "marieclaire.nzuzi@kayou.cd",
    phone: "+243812345671",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: kinshasaCommune("Lemba"),
    addressLine: "8, avenue de l'Université",
    latitude: -4.404,
    longitude: 15.318,
    timezone: "Africa/Kinshasa",
    description: "Entretien de maisons et de bureaux, grand ménage et repassage.",
    yearsExperience: 8,
    subcategorySlug: "grand_menage",
    skillSubcategorySlugs: ["menage_regulier", "fin_chantier"],
    freeSkills: ["Repassage"],
    languages: ["Français", "Lingala"],
    interventionModes: ["À domicile"],
    pricing: { amount: 8000, currency: "CDF", unit: "Par heure" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.FREE,
  },
  {
    firstName: "Patrick",
    lastName: "Mbuyi",
    email: "patrick.mbuyi@kayou.cd",
    phone: "+243812345672",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: LUBUMBASHI,
    addressLine: "Commune Annexe, avenue Kasapa",
    latitude: -11.6647,
    longitude: 27.4794,
    timezone: "Africa/Lubumbashi",
    description: "Dépannage de plomberie, installation sanitaire et débouchage.",
    yearsExperience: 10,
    subcategorySlug: "depannage_fuite",
    skillSubcategorySlugs: ["installation_sanitaire", "chauffe_eau"],
    freeSkills: ["Débouchage"],
    languages: ["Français", "Swahili"],
    interventionModes: ["À domicile"],
    pricing: { amount: 20000, currency: "CDF", unit: "Par prestation" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.BOOSTED,
  },
  {
    firstName: "Françoise",
    lastName: "Kabongo",
    email: "francoise.kabongo@kayou.cd",
    phone: "+243812345673",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: kinshasaCommune("Bandalungwa"),
    addressLine: "15, avenue Kimbondo",
    latitude: -4.3421,
    longitude: 15.2843,
    timezone: "Africa/Kinshasa",
    description: "Coiffure à domicile : tresses, tissages et soins capillaires.",
    yearsExperience: 12,
    subcategorySlug: "tresses_tissages",
    skillSubcategorySlugs: ["coiffure_femme", "coiffure_enfant"],
    freeSkills: ["Soins capillaires"],
    languages: ["Français", "Lingala", "Tshiluba"],
    interventionModes: ["À domicile", "En atelier"],
    pricing: { amount: 15000, currency: "CDF", unit: "Par prestation" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.VERIFIED,
  },
  {
    firstName: "Thierry",
    lastName: "Mutombo",
    email: "thierry.mutombo@kayou.cd",
    phone: "+242061234574",
    hasWhatsApp: true,
    country: "Congo",
    placeSlug: BRAZZAVILLE,
    addressLine: "Poto-Poto, avenue de la Paix",
    latitude: -4.26,
    longitude: 15.275,
    timezone: "Africa/Brazzaville",
    description: "Construction, rénovation et finitions dans le respect des délais.",
    yearsExperience: 20,
    subcategorySlug: "elevation_murs",
    skillSubcategorySlugs: ["fondations", "chape"],
    freeSkills: ["Béton armé", "Rénovation"],
    languages: ["Français", "Lingala", "Kikongo"],
    interventionModes: ["Sur chantier"],
    pricing: { amount: 18000, currency: "XAF", unit: "Par jour" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.FREE,
  },
  {
    firstName: "Espérance",
    lastName: "Ngoma",
    email: "esperance.ngoma@kayou.cd",
    phone: "+243812345675",
    hasWhatsApp: false,
    country: "RDC",
    placeSlug: kinshasaCommune("Kintambo"),
    addressLine: "5, avenue Pumbu",
    latitude: -4.329,
    longitude: 15.271,
    timezone: "Africa/Kinshasa",
    description: "Soins du visage, manucure, pédicure et maquillage à domicile.",
    yearsExperience: 6,
    subcategorySlug: "soins_visage",
    skillSubcategorySlugs: ["gommage", "epilation"],
    freeSkills: ["Pédicure"],
    languages: ["Français", "Lingala"],
    interventionModes: ["À domicile"],
    pricing: { amount: 12000, currency: "CDF", unit: "Par prestation" },
    verificationStatus: VerificationStatus.PENDING,
    premiumTier: PremiumTier.FREE,
  },
  {
    firstName: "Dieudonné",
    lastName: "Kasongo",
    email: "dieudonne.kasongo@kayou.cd",
    phone: "+243812345676",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: LUBUMBASHI,
    addressLine: "Commune Kamalondo, avenue Lumumba",
    latitude: -11.67,
    longitude: 27.49,
    timezone: "Africa/Lubumbashi",
    description: "Diagnostic, entretien et réparation de véhicules légers.",
    yearsExperience: 18,
    subcategorySlug: "diagnostic",
    skillSubcategorySlugs: ["revision", "moteur"],
    freeSkills: ["Électricité auto"],
    languages: ["Français", "Swahili"],
    interventionModes: ["En atelier"],
    pricing: { amount: 15000, currency: "CDF", unit: "Par heure" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.BOOSTED,
  },
  {
    firstName: "Véronique",
    lastName: "Lumumba",
    email: "veronique.lumumba@kayou.cd",
    phone: "+243812345677",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: MATADI,
    addressLine: "Quartier Soyo, avenue de la Poste",
    latitude: -5.8177,
    longitude: 13.46,
    timezone: "Africa/Kinshasa",
    description: "Soutien scolaire primaire et secondaire, mathématiques et français.",
    yearsExperience: 10,
    subcategorySlug: "math_sciences",
    skillSubcategorySlugs: ["langues", "soutien_scolaire"],
    freeSkills: ["Préparation aux examens"],
    languages: ["Français", "Kikongo"],
    interventionModes: ["À domicile", "À distance"],
    pricing: { amount: 10000, currency: "CDF", unit: "Par heure" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.FREE,
  },
  {
    firstName: "Olivier",
    lastName: "Tshisekedi",
    email: "olivier.tshisekedi@kayou.cd",
    phone: "+242061234578",
    hasWhatsApp: true,
    country: "Congo",
    placeSlug: CONGO,
    addressLine: "Pointe-Noire, avenue Charles de Gaulle",
    latitude: -4.778,
    longitude: 11.8636,
    timezone: "Africa/Brazzaville",
    description: "Création et entretien de jardins, taille et arrosage.",
    yearsExperience: 7,
    subcategorySlug: "paysagisme",
    skillSubcategorySlugs: ["entretien_jardin", "elagage"],
    freeSkills: ["Arrosage"],
    languages: ["Français", "Kikongo", "Lingala"],
    interventionModes: ["À domicile"],
    pricing: { amount: 12000, currency: "XAF", unit: "Par jour" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.FREE,
  },
  {
    firstName: "Grâce",
    lastName: "Mwamba",
    email: "grace.mwamba@kayou.cd",
    phone: "+243812345679",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: `${kinshasaCommune("Gombe")}-quartier-golf`,
    addressLine: "12, avenue des Aviateurs",
    latitude: -4.31,
    longitude: 15.3,
    timezone: "Africa/Kinshasa",
    description: "Traiteur, cuisine congolaise et cheffe privée à domicile.",
    yearsExperience: 14,
    subcategorySlug: "traiteur_mariage",
    skillSubcategorySlugs: ["anniversaire", "evenements", "cuisinier_domicile"],
    freeSkills: ["Buffets"],
    languages: ["Français", "Lingala", "Anglais"],
    interventionModes: ["À domicile"],
    pricing: { amount: 30000, currency: "CDF", unit: "Par prestation" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.ELITE,
  },
  {
    firstName: "Emmanuel",
    lastName: "Kalonji",
    email: "emmanuel.kalonji@kayou.cd",
    phone: "+243812345680",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: kinshasaCommune("Ngaba"),
    addressLine: "7, rue Kianza",
    latitude: -4.38,
    longitude: 15.316,
    timezone: "Africa/Kinshasa",
    description: "Dépannage informatique, réseaux, formation et assistance à domicile.",
    yearsExperience: 9,
    subcategorySlug: "reparation_ordinateur",
    skillSubcategorySlugs: ["installation_reseau", "formation_informatique"],
    freeSkills: ["Sauvegarde de données"],
    languages: ["Français", "Lingala", "Tshiluba", "Anglais"],
    interventionModes: ["À domicile", "En atelier", "À distance"],
    pricing: { amount: 18000, currency: "CDF", unit: "Par heure" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.FREE,
  },
  {
    firstName: "Béatrice",
    lastName: "Nkashama",
    email: "beatrice.nkashama@kayou.cd",
    phone: "+243812345681",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: LUBUMBASHI,
    addressLine: "Commune Lubumbashi, avenue Mama Yemo",
    latitude: -11.66,
    longitude: 27.48,
    timezone: "Africa/Lubumbashi",
    description: "Mariages, anniversaires, décoration et coordination de cérémonies.",
    yearsExperience: 8,
    subcategorySlug: "organisation_evenements",
    skillSubcategorySlugs: ["decoration", "son_lumiere_dj", "photographie"],
    freeSkills: ["Gestion de budget"],
    languages: ["Français", "Swahili"],
    interventionModes: ["À domicile"],
    pricing: { amount: 25000, currency: "CDF", unit: "Par prestation" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.VERIFIED,
  },
  {
    firstName: "Firmin",
    lastName: "Mwepu",
    email: "firmin.mwepu@kayou.cd",
    phone: "+242061234582",
    hasWhatsApp: false,
    country: "Congo",
    placeSlug: BRAZZAVILLE,
    addressLine: "Bacongo, avenue Matsoua",
    latitude: -4.28,
    longitude: 15.26,
    timezone: "Africa/Brazzaville",
    description: "Gardiennage, contrôle d'accès et surveillance de jour comme de nuit.",
    yearsExperience: 5,
    subcategorySlug: "gardiennage",
    skillSubcategorySlugs: ["agent_securite", "controle_acces"],
    freeSkills: ["Rondes"],
    languages: ["Français", "Lingala", "Kikongo"],
    interventionModes: ["Sur chantier"],
    pricing: { amount: 8000, currency: "XAF", unit: "Par jour" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.FREE,
  },
  {
    firstName: "Charlène",
    lastName: "Masengu",
    email: "charlene.masengu@kayou.cd",
    phone: "+243812345683",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: kinshasaCommune("Limete"),
    addressLine: "10e rue, Limete résidentiel",
    latitude: -4.37,
    longitude: 15.347,
    timezone: "Africa/Kinshasa",
    description: "Massages thérapeutiques, sportifs et relaxants à domicile.",
    yearsExperience: 6,
    subcategorySlug: "massage_therapeutique",
    skillSubcategorySlugs: ["massage_relaxant", "soins_corps"],
    freeSkills: ["Récupération sportive"],
    languages: ["Français", "Lingala"],
    interventionModes: ["À domicile"],
    pricing: { amount: 20000, currency: "CDF", unit: "Par prestation" },
    verificationStatus: VerificationStatus.VERIFIED,
    premiumTier: PremiumTier.FREE,
  },
  {
    firstName: "Roger",
    lastName: "Ilunga",
    email: "roger.ilunga@kayou.cd",
    phone: "+243812345684",
    hasWhatsApp: true,
    country: "RDC",
    placeSlug: kinshasaCommune("Masina"),
    addressLine: "18, avenue Mandina",
    latitude: -4.386,
    longitude: 15.391,
    timezone: "Africa/Kinshasa",
    description: "Peinture intérieure et extérieure, finitions propres et rapides.",
    yearsExperience: 12,
    subcategorySlug: "peinture_interieure",
    skillSubcategorySlugs: ["peinture_exterieure", "enduits", "peinture_decoration"],
    freeSkills: ["Papier peint"],
    languages: ["Français", "Lingala"],
    interventionModes: ["Sur chantier"],
    pricing: { amount: 3500, currency: "CDF", unit: "Par m²" },
    verificationStatus: VerificationStatus.PENDING,
    premiumTier: PremiumTier.FREE,
  },
];

const clientsData: DemoClient[] = [
  { firstName: "Paul", lastName: "Kabasele", email: "paul.kabasele@email.cd", phone: "+243819000001", phoneVerified: true, country: "RDC", placeSlug: kinshasaCommune("Ngaliema"), addressLine: "45, avenue Colonel Mondjiba" },
  { firstName: "Michelle", lastName: "Kazadi", email: "michelle.kazadi@email.cd", phone: "+243819000002", phoneVerified: true, country: "RDC", placeSlug: kinshasaCommune("Lemba"), addressLine: "3, avenue Kikwit" },
  { firstName: "Joseph", lastName: "Lomami", email: "joseph.lomami@email.cd", phone: "+243819000003", phoneVerified: true, country: "RDC", placeSlug: LUBUMBASHI, addressLine: "Commune Kampemba, avenue Kilela Balanda" },
  { firstName: "Annie", lastName: "Mutombo", email: "annie.mutombo@email.cd", phone: "+243819000004", phoneVerified: false, country: "RDC", placeSlug: kinshasaCommune("Kalamu"), addressLine: "9, avenue Victoire" },
  { firstName: "Claude", lastName: "Mwamba", email: "claude.mwamba@email.cd", phone: "+242069000005", phoneVerified: true, country: "Congo", placeSlug: BRAZZAVILLE, addressLine: "Moungali, rue Mayama" },
  { firstName: "Solange", lastName: "Ngoyi", email: "solange.ngoyi@email.cd", phone: "+243819000006", phoneVerified: true, country: "RDC", placeSlug: MATADI, addressLine: "Quartier Mvuzi" },
  { firstName: "Henri", lastName: "Kambale", email: "henri.kambale@email.cd", phone: "+243819000007", phoneVerified: true, country: "RDC", placeSlug: kinshasaCommune("Limete"), addressLine: "5e rue, Limete industriel" },
  { firstName: "Gisèle", lastName: "Tshibanda", email: "gisele.tshibanda@email.cd", phone: "+243819000008", phoneVerified: false, country: "RDC", placeSlug: LUBUMBASHI, addressLine: "Commune Kenya, avenue Likasi" },
  { firstName: "Marc", lastName: "Ndaye", email: "marc.ndaye@email.cd", phone: "+242069000009", phoneVerified: true, country: "Congo", placeSlug: CONGO, addressLine: "Pointe-Noire, quartier Loandjili" },
  { firstName: "Brigitte", lastName: "Mwilo", email: "brigitte.mwilo@email.cd", phone: "+243819000010", phoneVerified: true, country: "RDC", placeSlug: kinshasaCommune("Bandalungwa"), addressLine: "20, avenue Lubudi" },
  { firstName: "Alain", lastName: "Musasa", email: "alain.musasa@email.cd", phone: "+243819000011", phoneVerified: true, country: "RDC", placeSlug: kinshasaCommune("Kintambo"), addressLine: "2, avenue Nguma" },
  { firstName: "Francine", lastName: "Kiese", email: "francine.kiese@email.cd", phone: "+243819000012", phoneVerified: false, country: "RDC", placeSlug: MATADI, addressLine: "Quartier Kinkanda" },
  { firstName: "Patrick", lastName: "Mwepu", email: "patrick.mwepu@email.cd", phone: "+242069000013", phoneVerified: true, country: "Congo", placeSlug: BRAZZAVILLE, addressLine: "Ouenzé, avenue de la Tsiémé" },
];

// The curated providers keep their hand-written demo accounts and stories; the
// generated ones fill every category to at least GENERATED_PER_CATEGORY profiles.
const CURATED_PROVIDER_COUNT = providersData.length;
const allProvidersData: DemoProvider[] = [
  ...providersData,
  ...generatedProviders(GENERATED_PER_CATEGORY, providersData.map((provider) => provider.email)),
];

const reviewRatings = [5, 4, 5, 5, 3, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4];

const reviewCommentsByRating: Record<number, string[]> = {
  5: [
    "Travail soigné, ponctuel et très professionnel. Je recommande sans hésiter.",
    "Très à l'écoute, intervention rapide et propre.",
    "Excellent contact, résultat impeccable et conseils utiles pour la suite.",
    "Arrivé à l'heure, matériel complet, tout a été fait dans la matinée.",
  ],
  4: [
    "Bonne prestation, communication claire du début à la fin.",
    "Résultat conforme à la demande et prix respecté.",
    "Sérieux et efficace, un petit détail à reprendre mais rien de grave.",
  ],
  3: [
    "Travail correct, mais arrivé avec une heure de retard.",
    "Prestation acceptable, le devis initial a un peu augmenté.",
  ],
  2: ["Le rendez-vous a été déplacé deux fois, le travail final est moyen."],
  1: ["Pas venu au rendez-vous et injoignable ensuite."],
};

function generatedRating(random: () => number): number {
  const roll = random();
  if (roll < 0.45) return 5;
  if (roll < 0.8) return 4;
  if (roll < 0.95) return 3;
  if (roll < 0.99) return 2;
  return 1;
}

function authSeedId(email: string): string {
  return `seed:${email}`;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

function localCalendarDate(timezone: Timezone, dayOffset: number): Date {
  const local = new Date(Date.now() + UTC_OFFSET_HOURS[timezone] * HOUR_MS + dayOffset * DAY_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

function onWeekday(date: Date): Date {
  const weekday = date.getUTCDay();
  const shift = weekday === 6 ? 2 : weekday === 0 ? 1 : 0;
  return new Date(date.getTime() + shift * DAY_MS);
}

function upcomingSaturday(date: Date): Date {
  const daysAhead = (6 - date.getUTCDay() + 7) % 7 || 7;
  return new Date(date.getTime() + daysAhead * DAY_MS);
}

function slotInstant(timezone: Timezone, localDate: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(
    localDate.getTime() + (hours - UTC_OFFSET_HOURS[timezone]) * HOUR_MS + minutes * MINUTE_MS,
  );
}

async function loadLookups(prisma: SeedPrismaClient) {
  const [places, subcategories, references] = await Promise.all([
    prisma.place.findMany({ select: { id: true, slug: true } }),
    prisma.subcategory.findMany({ select: { id: true, slug: true } }),
    prisma.referenceItem.findMany({ select: { id: true, slug: true } }),
  ]);

  const bySlug = (rows: Array<{ id: string; slug: string }>, kind: string) => {
    const ids = new Map(rows.map((row) => [row.slug, row.id]));
    return (slug: string): string => {
      const id = ids.get(slug);
      if (!id) throw new Error(`Missing seeded ${kind} for slug ${slug}`);
      return id;
    };
  };

  return {
    placeId: bySlug(places, "place"),
    subcategoryId: bySlug(subcategories, "subcategory"),
    referenceId: bySlug(references, "reference item"),
  };
}

export async function seedDemo(prisma: SeedPrismaClient) {
  const lookups = await loadLookups(prisma);

  console.log("Seeding demo users and provider profiles...");
  const providers = await seedProviders(prisma, lookups);
  const clients = await seedClients(prisma, lookups);
  const admin = await seedAdmin(prisma, lookups);

  console.log("Seeding marketplace activity...");
  const bookings = await seedBookings(prisma, providers, clients);
  const reviews = await seedReviews(prisma, bookings);
  await refreshProviderAggregates(prisma, providers);
  await seedTransactions(prisma, bookings, providers[0]);
  const conversations = await seedConversations(prisma, providers, clients);
  await seedSafetyAndInbox(prisma, lookups, providers, clients);
  await seedNotifications(prisma, { adminId: admin.id, providers, bookings, reviews, conversations });

  console.log(`Demo password for Supabase seed users: ${DEFAULT_PASSWORD}`);
  console.log(
    `Seeded ${providers.length} providers (${CURATED_PROVIDER_COUNT} curated, ${providers.length - CURATED_PROVIDER_COUNT} generated), ${clients.length} clients, and ${bookings.length} bookings.`,
  );
}

async function seedProviders(prisma: SeedPrismaClient, lookups: Lookups): Promise<CreatedProvider[]> {
  const created: CreatedProvider[] = [];

  for (const [index, data] of allProvidersData.entries()) {
    const user = await prisma.user.create({
      data: {
        authUserId: data.generated ? `seed-generated:${data.email}` : authSeedId(data.email),
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.PROVIDER,
        roleSelectedAt: daysFromNow(-90),
        placeId: lookups.placeId(data.placeSlug),
        country: data.country,
        emailVerifiedAt: daysFromNow(-90),
        phoneVerifiedAt: daysFromNow(-90),
        termsAcceptedAt: daysFromNow(-90),
        lastLoginAt: daysFromNow(-index),
      },
    });

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        displayName: `${data.firstName} ${data.lastName}`,
        profilePhoto: data.profilePhoto ?? null,
        description: data.description,
        yearsExperience: data.yearsExperience,
        phone: data.phone,
        whatsapp: data.hasWhatsApp ? data.phone : null,
        email: data.email,
        subcategoryId: lookups.subcategoryId(data.subcategorySlug),
        placeId: lookups.placeId(data.placeSlug),
        addressLine: data.addressLine,
        latitude: data.latitude,
        longitude: data.longitude,
        freeSkills: data.freeSkills,
        pricingAmount: data.pricing.amount,
        pricingCurrencyId: lookups.referenceId(referenceSlug("currency", data.pricing.currency)),
        pricingUnitId: lookups.referenceId(referenceSlug("price-unit", data.pricing.unit)),
        timezone: data.timezone,
        slotDurationMin: SLOT_DURATION_MIN,
        slotBufferMin: SLOT_BUFFER_MIN,
        verificationStatus: data.verificationStatus,
        premiumTier: data.premiumTier,
        premiumUntil: data.premiumTier === PremiumTier.FREE ? null : daysFromNow(365),
        publishedAt: daysFromNow(data.generated ? -(30 + (index % 12) * 25) : -90),
        skills: {
          create: data.skillSubcategorySlugs.map((slug) => ({
            itemId: lookups.referenceId(skillSlug(slug)),
          })),
        },
        references: {
          create: [
            ...data.languages.map((label) => ({
              kind: "LANGUAGE" as const,
              itemId: lookups.referenceId(referenceSlug("language", label)),
            })),
            ...data.interventionModes.map((label) => ({
              kind: "INTERVENTION_MODE" as const,
              itemId: lookups.referenceId(referenceSlug("mode", label)),
            })),
          ],
        },
        media: {
          create: [0, 1, 2].map((mediaIndex) => ({
            kind: "IMAGE" as const,
            url: `https://picsum.photos/seed/kayou-provider-${index}-${mediaIndex}/900/650`,
            title: `Réalisation ${mediaIndex + 1}`,
            order: mediaIndex,
          })),
        },
        availabilityRules: {
          create: [1, 2, 3, 4, 5].flatMap((dayOfWeek) =>
            WEEKLY_RANGES.map((range, order) => ({ dayOfWeek, order, ...range })),
          ),
        },
        availabilityExceptions: { create: availabilityExceptionsFor(index, data.timezone) },
      },
    });

    created.push({
      index,
      userId: user.id,
      providerId: provider.id,
      name: provider.displayName,
      timezone: data.timezone,
      subcategoryId: provider.subcategoryId,
      pricingAmount: data.pricing.amount,
    });
  }

  return created;
}

function availabilityExceptionsFor(index: number, timezone: Timezone) {
  if (index === 0) {
    return [
      {
        date: onWeekday(localCalendarDate(timezone, 12)),
        isOpen: false,
        reason: "Formation",
      },
    ];
  }

  if (index === 1) {
    return [
      {
        date: upcomingSaturday(localCalendarDate(timezone, 0)),
        isOpen: true,
        startTime: "09:00",
        endTime: "13:00",
        reason: "Permanence du samedi",
      },
    ];
  }

  return [];
}

async function seedClients(prisma: SeedPrismaClient, lookups: Lookups): Promise<CreatedClient[]> {
  const created: CreatedClient[] = [];

  for (const [index, data] of clientsData.entries()) {
    const placeId = lookups.placeId(data.placeSlug);
    const user = await prisma.user.create({
      data: {
        authUserId: authSeedId(data.email),
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.CLIENT,
        roleSelectedAt: daysFromNow(-60),
        placeId,
        country: data.country,
        phoneVerifiedAt: data.phoneVerified ? daysFromNow(-60) : null,
        termsAcceptedAt: daysFromNow(-60),
        lastLoginAt: daysFromNow(-index),
        addresses:
          index < 3
            ? {
                create: [
                  {
                    label: "HOME" as const,
                    recipient: `${data.firstName} ${data.lastName}`,
                    addressLine: data.addressLine,
                    placeId,
                    country: data.country,
                    isDefault: true,
                  },
                  ...(index === 0
                    ? [
                        {
                          label: "WORK" as const,
                          addressLine: "Boulevard du 30 Juin, immeuble Interfina",
                          placeId: lookups.placeId(kinshasaCommune("Gombe")),
                          country: data.country,
                        },
                      ]
                    : []),
                ],
              }
            : undefined,
      },
    });

    created.push({
      userId: user.id,
      name: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
      placeId,
      addressLine: data.addressLine,
    });
  }

  return created;
}

async function seedAdmin(prisma: SeedPrismaClient, lookups: Lookups) {
  return prisma.user.create({
    data: {
      authUserId: authSeedId("admin@kayou.cd"),
      email: "admin@kayou.cd",
      phone: "+243800000000",
      firstName: "Admin",
      lastName: "KAYOU",
      role: UserRole.ADMIN,
      roleSelectedAt: daysFromNow(-120),
      placeId: lookups.placeId(kinshasaCommune("Gombe")),
      country: "RDC",
      emailVerifiedAt: daysFromNow(-120),
      phoneVerifiedAt: daysFromNow(-120),
      termsAcceptedAt: daysFromNow(-120),
    },
  });
}

function bookingPlan(providers: CreatedProvider[], clients: CreatedClient[]): BookingSpec[] {
  const plan: BookingSpec[] = [];

  for (const provider of providers.slice(0, CURATED_PROVIDER_COUNT)) {
    const { index } = provider;
    const client = (offset: number) => clients[(index + offset) % clients.length];

    plan.push({
      provider,
      client: client(0),
      status: BookingStatus.COMPLETED,
      dayOffset: -(7 + index),
      slotTime: SLOT_TIMES[0],
      agreedPrice: provider.pricingAmount * 2,
      isPaid: true,
    });

    if (index < 6) {
      plan.push({
        provider,
        client: client(5),
        status: BookingStatus.COMPLETED,
        dayOffset: -(21 + index),
        slotTime: SLOT_TIMES[1],
        agreedPrice: index % 2 === 0 ? provider.pricingAmount : undefined,
        isPaid: index % 4 === 0,
      });
      plan.push({
        provider,
        client: client(2),
        status: BookingStatus.PENDING,
        dayOffset: 2 + index,
        slotTime: SLOT_TIMES[0],
      });
    }

    if (index < 5) {
      plan.push({
        provider,
        client: client(7),
        status: BookingStatus.CONFIRMED,
        dayOffset: 3 + index,
        slotTime: SLOT_TIMES[1],
      });
    }

    if (index >= 6 && index < 10) {
      plan.push({
        provider,
        client: client(4),
        status: BookingStatus.CANCELLED,
        dayOffset: index - 4,
        slotTime: SLOT_TIMES[0],
        cancelledBy: index % 2 === 0 ? "client" : "provider",
      });
    }
  }

  for (const provider of providers.slice(CURATED_PROVIDER_COUNT)) {
    plan.push(...generatedBookingPlan(provider, clients));
  }

  return plan;
}

// Past, completed history so the generated profiles carry real ratings and job
// counts; a few open requests so their dashboards are not empty. Clients are
// distinct per provider (one review per client and provider).
function generatedBookingPlan(provider: CreatedProvider, clients: CreatedClient[]): BookingSpec[] {
  const random = seededRandom(1_000 + provider.index);
  const client = (offset: number) => clients[(provider.index * 7 + offset) % clients.length];
  const completedCount = [0, 1, 1, 2, 2, 3, 3, 4][Math.floor(random() * 8)];
  const plan: BookingSpec[] = [];

  for (let k = 0; k < completedCount; k += 1) {
    const priced = random() < 0.7;
    plan.push({
      provider,
      client: client(k),
      status: BookingStatus.COMPLETED,
      dayOffset: -(4 + (provider.index % 17) + k * 11),
      slotTime: SLOT_TIMES[k % 2],
      agreedPrice: priced ? provider.pricingAmount * (1 + Math.floor(random() * 3)) : undefined,
      isPaid: priced && random() < 0.6,
    });
  }

  if (random() < 0.3) {
    plan.push({
      provider,
      client: client(5),
      status: BookingStatus.PENDING,
      dayOffset: 2 + (provider.index % 12),
      slotTime: SLOT_TIMES[0],
    });
  }

  if (random() < 0.2) {
    plan.push({
      provider,
      client: client(6),
      status: BookingStatus.CONFIRMED,
      dayOffset: 4 + (provider.index % 10),
      slotTime: SLOT_TIMES[1],
    });
  }

  return plan;
}

async function seedBookings(
  prisma: SeedPrismaClient,
  providers: CreatedProvider[],
  clients: CreatedClient[],
): Promise<CreatedBooking[]> {
  const created: CreatedBooking[] = [];

  for (const [index, spec] of bookingPlan(providers, clients).entries()) {
    const { provider, client, status } = spec;
    const scheduledAt = slotInstant(
      provider.timezone,
      onWeekday(localCalendarDate(provider.timezone, spec.dayOffset)),
      spec.slotTime,
    );
    const createdAt = new Date(Math.min(scheduledAt.getTime(), Date.now()) - 2 * DAY_MS);
    const isCompleted = status === BookingStatus.COMPLETED;
    const completedAt = isCompleted ? new Date(scheduledAt.getTime() + SLOT_DURATION_MIN * MINUTE_MS) : null;
    const agreedPrice = isCompleted ? (spec.agreedPrice ?? null) : null;
    const commissionAmt = agreedPrice ? Math.round((agreedPrice * COMMISSION_PCT) / 100) : 0;
    const isPaid = isCompleted && Boolean(spec.isPaid);
    const cancelledById =
      spec.cancelledBy === "client" ? client.userId : spec.cancelledBy === "provider" ? provider.userId : null;

    const booking = await prisma.booking.create({
      data: {
        clientId: client.userId,
        providerId: provider.providerId,
        status,
        scheduledAt,
        durationMin: SLOT_DURATION_MIN,
        bufferMin: SLOT_BUFFER_MIN,
        timezone: provider.timezone,
        subcategoryId: provider.subcategoryId,
        clientPhone: client.phone,
        clientNotes: index % 2 === 0 ? "Merci de m'appeler en arrivant devant la parcelle." : null,
        providerNotes: status === BookingStatus.PENDING ? null : "Matériel apporté par le prestataire.",
        placeId: client.placeId,
        addressLine: client.addressLine,
        agreedPrice,
        commissionPct: COMMISSION_PCT,
        commissionAmt,
        providerNetAmt: agreedPrice ? agreedPrice - commissionAmt : 0,
        isPaid,
        paidAt: isPaid ? completedAt : null,
        confirmedAt:
          status === BookingStatus.CONFIRMED || isCompleted ? new Date(createdAt.getTime() + 2 * HOUR_MS) : null,
        completedAt,
        cancelledAt: status === BookingStatus.CANCELLED ? new Date(createdAt.getTime() + 5 * HOUR_MS) : null,
        cancelledById,
        cancelReason:
          spec.cancelledBy === "provider"
            ? "Indisponible ce jour-là, désolé."
            : spec.cancelledBy === "client"
              ? "Changement de programme."
              : null,
        createdAt,
      },
    });

    created.push({
      id: booking.id,
      spec,
      createdAt,
      completedAt,
      agreedPrice,
      commissionAmt,
      providerNetAmt: booking.providerNetAmt,
      isPaid,
    });
  }

  return created;
}

async function seedReviews(prisma: SeedPrismaClient, bookings: CreatedBooking[]) {
  const reviewed = new Set<string>();
  const created: Array<{ id: string; kind: "review" | "clientReview"; booking: CreatedBooking }> = [];

  for (const [bookingIndex, booking] of bookings.entries()) {
    const { provider, client, status } = booking.spec;
    if (status !== BookingStatus.COMPLETED || !booking.completedAt) continue;
    const generated = provider.index >= CURATED_PROVIDER_COUNT;
    const random = seededRandom(5_000 + bookingIndex);
    // Only each curated provider's first completed booking is reviewed, so the
    // second one stays in the client's "to review" list. Generated providers
    // get a review on most completed bookings.
    if (!generated && reviewed.has(provider.providerId)) continue;
    if (generated && random() > 0.8) continue;
    reviewed.add(provider.providerId);

    const reviewedAt = new Date(booking.completedAt.getTime() + DAY_MS);
    const rating = generated ? generatedRating(random) : reviewRatings[provider.index % reviewRatings.length];
    const comments = reviewCommentsByRating[rating];
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        clientId: client.userId,
        providerId: provider.providerId,
        rating,
        comment: comments[provider.index % comments.length],
        reply: provider.index % 3 === 0 ? "Merci pour votre confiance, à bientôt !" : null,
        repliedAt: provider.index % 3 === 0 ? new Date(reviewedAt.getTime() + 3 * HOUR_MS) : null,
        createdAt: reviewedAt,
      },
    });
    created.push({ id: review.id, kind: "review", booking });

    if (generated ? random() > 0.5 : provider.index % 2 !== 0) continue;

    const clientReview = await prisma.clientReview.create({
      data: {
        bookingId: booking.id,
        providerId: provider.providerId,
        clientId: client.userId,
        rating: provider.index % 4 === 0 ? 5 : 4,
        comment: "Client clair dans sa demande, accueil courtois et paiement sans difficulté.",
        createdAt: reviewedAt,
      },
    });
    created.push({ id: clientReview.id, kind: "clientReview", booking });
  }

  return created;
}

async function refreshProviderAggregates(prisma: SeedPrismaClient, providers: CreatedProvider[]) {
  for (const provider of providers) {
    const [ratings, completedJobs] = await Promise.all([
      prisma.review.aggregate({
        where: { providerId: provider.providerId, isPublic: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.booking.count({
        where: { providerId: provider.providerId, status: BookingStatus.COMPLETED },
      }),
    ]);

    await prisma.provider.update({
      where: { id: provider.providerId },
      data: {
        ratingAvg: new Prisma.Decimal((ratings._avg.rating ?? 0).toFixed(1)),
        ratingCount: ratings._count._all,
        completedJobs,
      },
    });
  }
}

async function seedTransactions(
  prisma: SeedPrismaClient,
  bookings: CreatedBooking[],
  bonusProvider: CreatedProvider,
) {
  await prisma.transaction.createMany({
    data: [
      ...bookings
        .filter((booking) => booking.agreedPrice && booking.completedAt)
        .map((booking) => ({
          providerId: booking.spec.provider.providerId,
          bookingId: booking.id,
          type: "EARNING" as const,
          amount: booking.agreedPrice!,
          feeAmt: booking.commissionAmt,
          netAmt: booking.providerNetAmt,
          status: booking.isPaid ? ("COMPLETED" as const) : ("PENDING" as const),
          occurredAt: booking.completedAt!,
        })),
      {
        providerId: bonusProvider.providerId,
        type: "BONUS" as const,
        amount: 10000,
        netAmt: 10000,
        status: "COMPLETED" as const,
        note: "Bonus de lancement",
        occurredAt: daysFromNow(-30),
      },
    ],
  });
}

async function seedConversations(
  prisma: SeedPrismaClient,
  providers: CreatedProvider[],
  clients: CreatedClient[],
) {
  const created: Array<{
    id: string;
    provider: CreatedProvider;
    client: CreatedClient;
    clientUnread: number;
    providerUnread: number;
  }> = [];

  for (const provider of providers.slice(0, 8)) {
    const client = clients[(provider.index + 2) % clients.length];
    const firstAt = daysFromNow(-(provider.index + 1));
    const messages = [
      {
        senderId: client.userId,
        body: "Bonjour, êtes-vous disponible cette semaine pour une intervention ?",
        createdAt: firstAt,
      },
      {
        senderId: provider.userId,
        body: "Bonjour, oui. J'ai des créneaux libres, vous pouvez réserver directement sur mon profil.",
        createdAt: new Date(firstAt.getTime() + HOUR_MS),
      },
      ...(provider.index % 3 === 0
        ? [
            {
              senderId: client.userId,
              body: "Parfait, je viens de réserver. À bientôt !",
              createdAt: new Date(firstAt.getTime() + 90 * MINUTE_MS),
            },
          ]
        : []),
    ];
    const last = messages[messages.length - 1];
    const lastFromClient = last.senderId === client.userId;
    const clientUnread = !lastFromClient && provider.index % 2 === 1 ? 1 : 0;
    const providerUnread = lastFromClient ? 1 : 0;

    const conversation = await prisma.conversation.create({
      data: {
        clientId: client.userId,
        providerId: provider.providerId,
        subject: "Demande d'intervention",
        lastMessageAt: last.createdAt,
        lastPreview: last.body,
        clientUnread,
        providerUnread,
        createdAt: firstAt,
        messages: { create: messages },
      },
    });

    created.push({ id: conversation.id, provider, client, clientUnread, providerUnread });
  }

  return created;
}

async function seedSafetyAndInbox(
  prisma: SeedPrismaClient,
  lookups: Lookups,
  providers: CreatedProvider[],
  clients: CreatedClient[],
) {
  await prisma.report.create({
    data: {
      reporterId: clients[4].userId,
      targetKind: "PROVIDER",
      targetId: providers[13].providerId,
      reason: "Le numéro affiché sur le profil ne répond jamais.",
      createdAt: daysFromNow(-1),
    },
  });

  await prisma.block.create({
    data: {
      blockerId: clients[12].userId,
      blockedId: providers[14].userId,
      createdAt: daysFromNow(-2),
    },
  });

  await prisma.placeSuggestion.create({
    data: {
      userId: providers[8].userId,
      kind: "CITY",
      label: "Pointe-Noire",
      parentId: lookups.placeId(CONGO),
      createdAt: daysFromNow(-3),
    },
  });

  await prisma.contactMessage.createMany({
    data: [
      {
        name: "Nadine Mbala",
        email: "nadine.mbala@email.cd",
        phone: "+243819000101",
        subject: "Devenir prestataire",
        message: "Bonjour, je suis couturière à Matete. Comment faire vérifier mon profil ?",
        status: "NEW",
        createdAt: daysFromNow(-1),
      },
      {
        name: "Didier Lukusa",
        email: "didier.lukusa@email.cd",
        subject: "Problème de réservation",
        message: "Je ne vois aucun créneau disponible pour un électricien à Ngaliema cette semaine.",
        status: "READ",
        createdAt: daysFromNow(-4),
      },
      {
        name: "Sarah Okitu",
        email: "sarah.okitu@email.cd",
        phone: "+243819000103",
        subject: "Partenariat",
        message: "Notre entreprise souhaite référencer ses techniciens sur KAYOU. Qui contacter ?",
        status: "REPLIED",
        createdAt: daysFromNow(-9),
      },
    ],
  });
}

async function seedNotifications(
  prisma: SeedPrismaClient,
  input: {
    adminId: string;
    providers: CreatedProvider[];
    bookings: CreatedBooking[];
    reviews: Awaited<ReturnType<typeof seedReviews>>;
    conversations: Awaited<ReturnType<typeof seedConversations>>;
  },
) {
  const data: Prisma.NotificationCreateManyInput[] = [
    {
      userId: input.adminId,
      type: NotificationType.SYSTEM,
      title: "Données de démonstration chargées",
      message: "Les données locales KAYOU sont prêtes.",
    },
  ];

  // Generated providers' activity stays out of the inboxes so the demo accounts keep a readable feed.
  for (const [index, booking] of input.bookings.entries()) {
    const { provider, client, status } = booking.spec;
    if (provider.index >= CURATED_PROVIDER_COUNT) continue;
    const bookingData = { bookingId: booking.id };

    if (status === BookingStatus.PENDING) {
      data.push({
        userId: provider.userId,
        type: NotificationType.BOOKING_NEW,
        title: "Nouvelle demande de réservation",
        message: `${client.name} souhaite réserver un créneau.`,
        data: bookingData,
        createdAt: booking.createdAt,
      });
    } else if (status === BookingStatus.CONFIRMED) {
      const isRead = index % 2 === 0;
      data.push({
        userId: client.userId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: "Réservation confirmée",
        message: `${provider.name} a confirmé votre réservation.`,
        data: bookingData,
        isRead,
        readAt: isRead ? new Date() : null,
      });
    } else if (status === BookingStatus.COMPLETED) {
      data.push({
        userId: client.userId,
        type: NotificationType.BOOKING_COMPLETED,
        title: "Prestation terminée",
        message: `${provider.name} a marqué la prestation comme terminée.`,
        data: bookingData,
        isRead: true,
        readAt: booking.completedAt,
        createdAt: booking.completedAt ?? undefined,
      });
    } else if (status === BookingStatus.CANCELLED) {
      const byClient = booking.spec.cancelledBy === "client";
      data.push({
        userId: byClient ? provider.userId : client.userId,
        type: NotificationType.BOOKING_CANCELLED,
        title: "Réservation annulée",
        message: `${byClient ? client.name : provider.name} a annulé la réservation.`,
        data: bookingData,
      });
    }
  }

  for (const review of input.reviews) {
    const { provider, client } = review.booking.spec;
    if (provider.index >= CURATED_PROVIDER_COUNT) continue;
    data.push(
      review.kind === "review"
        ? {
            userId: provider.userId,
            type: NotificationType.NEW_REVIEW,
            title: "Nouvel avis",
            message: `${client.name} a laissé un avis sur votre prestation.`,
            data: { bookingId: review.booking.id, reviewId: review.id },
          }
        : {
            userId: client.userId,
            type: NotificationType.NEW_CLIENT_REVIEW,
            title: "Vous avez été évalué",
            message: `${provider.name} a évalué votre réservation.`,
            data: { bookingId: review.booking.id, clientReviewId: review.id },
          },
    );
  }

  for (const conversation of input.conversations) {
    const conversationData = { conversationId: conversation.id };
    if (conversation.clientUnread > 0) {
      data.push({
        userId: conversation.client.userId,
        type: NotificationType.NEW_MESSAGE,
        title: "Nouveau message",
        message: `${conversation.provider.name} vous a répondu.`,
        data: conversationData,
      });
    }
    if (conversation.providerUnread > 0) {
      data.push({
        userId: conversation.provider.userId,
        type: NotificationType.NEW_MESSAGE,
        title: "Nouveau message",
        message: `${conversation.client.name} vous a envoyé un message.`,
        data: conversationData,
      });
    }
  }

  for (const provider of input.providers.slice(0, 2)) {
    data.push({
      userId: provider.userId,
      type: NotificationType.VERIFICATION_UPDATED,
      title: "Profil vérifié",
      message: "Vos documents ont été validés. Le badge vérifié est visible sur votre profil.",
      isRead: true,
      readAt: daysFromNow(-60),
      createdAt: daysFromNow(-60),
    });
  }

  await prisma.notification.createMany({ data });
}
