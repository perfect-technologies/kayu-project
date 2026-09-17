import { PremiumTier, VerificationStatus } from "@prisma/client";
import { taxonomy, type TaxonomyNode } from "./seed-categories";
import type { DemoProvider } from "./seed-demo";
import { slugify } from "./seed-places";

export const GENERATED_PER_CATEGORY = 11;

type Timezone = DemoProvider["timezone"];
type Country = DemoProvider["country"];

type Locality = {
  placeSlug: string;
  city: string;
  country: Country;
  timezone: Timezone;
  latitude: number;
  longitude: number;
  languages: string[];
  weight: number;
};

// mulberry32: small, deterministic, good enough for demo data.
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const kinshasa = (label: string, latitude: number, longitude: number): Locality => ({
  placeSlug: `cd-province-kinshasa-city-kinshasa-commune-${slugify(label)}`,
  city: label,
  country: "RDC",
  timezone: "Africa/Kinshasa",
  latitude,
  longitude,
  languages: ["Lingala"],
  weight: 3,
});

const city = (
  province: string,
  label: string,
  timezone: Timezone,
  latitude: number,
  longitude: number,
  languages: string[],
  weight: number,
): Locality => ({
  placeSlug: `cd-province-${slugify(province)}-city-${slugify(label)}`,
  city: label,
  country: "RDC",
  timezone,
  latitude,
  longitude,
  languages,
  weight,
});

const localities: Locality[] = [
  kinshasa("Gombe", -4.303, 15.311),
  kinshasa("Ngaliema", -4.37, 15.25),
  kinshasa("Lemba", -4.39, 15.32),
  kinshasa("Limete", -4.35, 15.33),
  kinshasa("Kalamu", -4.34, 15.31),
  kinshasa("Bandalungwa", -4.34, 15.28),
  kinshasa("Kintambo", -4.32, 15.27),
  kinshasa("Matete", -4.39, 15.35),
  kinshasa("Masina", -4.39, 15.4),
  kinshasa("Ndjili", -4.41, 15.38),
  kinshasa("Kimbanseke", -4.42, 15.41),
  kinshasa("Barumbu", -4.31, 15.32),
  kinshasa("Kinshasa", -4.32, 15.31),
  kinshasa("Lingwala", -4.32, 15.3),
  kinshasa("Kasa-Vubu", -4.34, 15.3),
  kinshasa("Ngiri-Ngiri", -4.35, 15.29),
  kinshasa("Bumbu", -4.37, 15.29),
  kinshasa("Makala", -4.38, 15.3),
  kinshasa("Selembao", -4.38, 15.27),
  kinshasa("Mont-Ngafula", -4.45, 15.27),
  kinshasa("Kisenso", -4.4, 15.34),
  kinshasa("Ngaba", -4.39, 15.31),
  city("Haut-Katanga", "Lubumbashi", "Africa/Lubumbashi", -11.66, 27.48, ["Swahili"], 9),
  city("Lualaba", "Kolwezi", "Africa/Lubumbashi", -10.71, 25.47, ["Swahili"], 2),
  city("Nord-Kivu", "Goma", "Africa/Lubumbashi", -1.68, 29.22, ["Swahili"], 4),
  city("Sud-Kivu", "Bukavu", "Africa/Lubumbashi", -2.5, 28.86, ["Swahili"], 3),
  city("Tshopo", "Kisangani", "Africa/Lubumbashi", 0.52, 25.2, ["Swahili", "Lingala"], 3),
  city("Kasaï-Central", "Kananga", "Africa/Lubumbashi", -5.9, 22.42, ["Tshiluba"], 3),
  city("Kasaï-Oriental", "Mbuji-Mayi", "Africa/Lubumbashi", -6.14, 23.6, ["Tshiluba"], 4),
  city("Kongo Central", "Matadi", "Africa/Kinshasa", -5.82, 13.45, ["Kikongo"], 4),
  city("Équateur", "Mbandaka", "Africa/Kinshasa", 0.05, 18.26, ["Lingala"], 2),
  {
    placeSlug: "cg-city-brazzaville",
    city: "Brazzaville",
    country: "Congo",
    timezone: "Africa/Brazzaville",
    latitude: -4.27,
    longitude: 15.28,
    languages: ["Lingala", "Kikongo"],
    weight: 9,
  },
];

const firstNames = [
  "Adolphe", "Aimée", "Alphonse", "Annie", "Arlette", "Augustin", "Benjamin", "Bernadette", "Blaise",
  "Carine", "Célestin", "Chantal", "Christian", "Clarisse", "Cyprien", "Delphine", "Désiré", "Dorcas",
  "Édouard", "Élodie", "Eugénie", "Fabrice", "Fidèle", "Florence", "Gaston", "Georgette", "Gérard",
  "Gloria", "Hélène", "Hervé", "Honorine", "Isaac", "Jacqueline", "Jeanne", "Joël", "Josué", "Judith",
  "Julienne", "Junior", "Léa", "Léon", "Lydie", "Marcel", "Martine", "Mireille", "Moïse", "Nadège",
  "Nathan", "Nicole", "Odette", "Papy", "Pascal", "Patience", "Prosper", "Rachel", "Raphaël", "Rebecca",
  "Régine", "Richard", "Ruth", "Samuel", "Sandrine", "Serge", "Sylvie", "Théo", "Thérèse", "Trésor",
  "Valentin", "Victoire", "Yannick", "Yvette",
];

const lastNames = [
  "Badibanga", "Bokolo", "Bolamba", "Diakese", "Ebengo", "Ekofo", "Kabamba", "Kabeya", "Kalala",
  "Kalombo", "Kamanda", "Kamba", "Kanku", "Kapinga", "Kasereka", "Katumba", "Kawaya", "Kayembe",
  "Kilolo", "Kimbembe", "Kitenge", "Kongolo", "Luboya", "Lukoji", "Lukusa", "Lusamba", "Mabiala",
  "Makabu", "Makiese", "Malonga", "Mbala", "Mbombo", "Mbuya", "Moke", "Mongo", "Mpoyi", "Mputu",
  "Muamba", "Mubiala", "Mukuna", "Mulamba", "Mulumba", "Mwanza", "Nkulu", "Nsimba", "Ntumba", "Nzeza",
  "Okito", "Olela", "Pambu", "Sefu", "Tshiala", "Tshiamala", "Tshibangu", "Tshimanga", "Yumba",
];

const streets = [
  "avenue de la Paix", "avenue Kasa-Vubu", "avenue des Aviateurs", "avenue Lumumba", "avenue de l'Église",
  "avenue Kabinda", "avenue du Marché", "avenue Bobozo", "avenue de la Libération", "avenue Mondjiba",
  "avenue Kimbangu", "avenue des Écoles", "rue du Stade", "avenue Sendwe", "avenue de l'Université",
];

type CategoryProfile = {
  descriptions: [string, string];
  units: string[];
  amount: [number, number];
  modes: string[];
  freeSkills: string[];
};

const profiles: Record<string, CategoryProfile> = {
  batiment_construction: {
    descriptions: [
      "Artisan du bâtiment à {city} depuis {years} ans : travaux neufs, rénovation et finitions soignées.",
      "Chantiers résidentiels et petits commerces à {city}. Devis clair, délais respectés, matériel fourni.",
    ],
    units: ["Par prestation", "Par jour", "Par m²"],
    amount: [20000, 150000],
    modes: ["À domicile", "Sur chantier"],
    freeSkills: ["Lecture de plans", "Petites réparations", "Étanchéité", "Devis gratuit"],
  },
  beaute_bien_etre: {
    descriptions: [
      "Prestations beauté à domicile ou en salon à {city}, {years} ans d'expérience et produits de qualité.",
      "Mise en beauté, soins et conseils personnalisés à {city}. Sur rendez-vous, du lundi au samedi.",
    ],
    units: ["Par prestation"],
    amount: [8000, 60000],
    modes: ["À domicile", "En atelier"],
    freeSkills: ["Conseil en image", "Produits naturels", "Mariages", "Soins enfants"],
  },
  cuisine_restauration: {
    descriptions: [
      "Cuisine congolaise et internationale pour vos réceptions à {city}, {years} ans de métier.",
      "Repas de famille, buffets et plats à emporter préparés avec des produits frais à {city}.",
    ],
    units: ["Par prestation", "Forfait"],
    amount: [30000, 300000],
    modes: ["À domicile", "En atelier"],
    freeSkills: ["Cuisine congolaise", "Cuisine végétarienne", "Service en salle", "Livraison"],
  },
  maison_entretien: {
    descriptions: [
      "Entretien de maisons et bureaux à {city} : ménage, linge et petits travaux, {years} ans d'expérience.",
      "Équipe sérieuse et discrète pour l'entretien régulier de votre logement à {city}.",
    ],
    units: ["Par heure", "Par prestation"],
    amount: [5000, 40000],
    modes: ["À domicile"],
    freeSkills: ["Repassage", "Nettoyage vitres", "Entretien bureaux", "Produits fournis"],
  },
  garde_assistance: {
    descriptions: [
      "Garde d'enfants et assistance aux personnes à {city}, {years} ans d'expérience, références disponibles.",
      "Accompagnement quotidien, garde de jour et de nuit à {city}. Ponctualité et bienveillance.",
    ],
    units: ["Par heure", "Par jour"],
    amount: [5000, 30000],
    modes: ["À domicile"],
    freeSkills: ["Aide aux devoirs", "Premiers secours", "Garde de nuit", "Personnes âgées"],
  },
  transport_logistique: {
    descriptions: [
      "Transport de personnes et de marchandises à {city} et alentours, véhicules entretenus, {years} ans de route.",
      "Déménagements, livraisons et courses à {city}. Devis sur simple appel.",
    ],
    units: ["Par prestation", "Par jour"],
    amount: [15000, 120000],
    modes: ["À domicile", "Sur chantier"],
    freeSkills: ["Permis B", "Véhicule climatisé", "Manutention", "Trajets interurbains"],
  },
  mecanique_auto: {
    descriptions: [
      "Entretien et réparation automobile à {city} : diagnostic, mécanique générale et carrosserie, {years} ans de pratique.",
      "Dépannage rapide et pièces garanties pour votre véhicule à {city}.",
    ],
    units: ["Par prestation", "Forfait"],
    amount: [20000, 150000],
    modes: ["À domicile", "En atelier"],
    freeSkills: ["Diagnostic électronique", "Dépannage sur route", "Pièces d'origine", "Motos"],
  },
  technologie_numerique: {
    descriptions: [
      "Services informatiques à {city} : maintenance, sites web et assistance, {years} ans d'expérience.",
      "Solutions numériques pour particuliers et PME à {city}, intervention sur place ou à distance.",
    ],
    units: ["Par heure", "Forfait"],
    amount: [15000, 200000],
    modes: ["À domicile", "À distance"],
    freeSkills: ["WordPress", "Réseaux", "Formation bureautique", "Récupération de données"],
  },
  sante: {
    descriptions: [
      "Soins et accompagnement santé à domicile à {city}, {years} ans d'expérience en milieu médical.",
      "Suivi personnalisé, hygiène rigoureuse et disponibilité à {city}.",
    ],
    units: ["Par prestation", "Par heure"],
    amount: [10000, 60000],
    modes: ["À domicile"],
    freeSkills: ["Prise de constantes", "Injections", "Suivi post-opératoire", "Nutrition"],
  },
  agriculture_elevage: {
    descriptions: [
      "Conseil et travaux agricoles autour de {city} : cultures, élevage et irrigation, {years} ans sur le terrain.",
      "Aménagement de parcelles et suivi d'exploitations près de {city}.",
    ],
    units: ["Par jour", "Forfait"],
    amount: [15000, 100000],
    modes: ["Sur chantier", "À domicile"],
    freeSkills: ["Maraîchage", "Aviculture", "Irrigation goutte à goutte", "Compost"],
  },
  education_formation: {
    descriptions: [
      "Cours particuliers et soutien scolaire à {city}, {years} ans d'enseignement, tous niveaux.",
      "Pédagogie adaptée à chaque élève, à domicile ou en ligne, à {city}.",
    ],
    units: ["Par heure"],
    amount: [8000, 30000],
    modes: ["À domicile", "À distance"],
    freeSkills: ["Préparation examen d'État", "Mathématiques", "Anglais", "Informatique"],
  },
  evenementiel: {
    descriptions: [
      "Organisation d'événements à {city} : mariages, anniversaires et séminaires, {years} ans d'expérience.",
      "Décoration, animation et logistique pour vos fêtes à {city}.",
    ],
    units: ["Forfait", "Par prestation"],
    amount: [50000, 500000],
    modes: ["À domicile", "Sur chantier"],
    freeSkills: ["Sonorisation", "Décoration florale", "Photographie", "Coordination jour J"],
  },
  securite: {
    descriptions: [
      "Services de sécurité et gardiennage à {city}, agents formés, {years} ans d'activité.",
      "Protection de sites et d'événements à {city}, disponible jour et nuit.",
    ],
    units: ["Par jour", "Forfait"],
    amount: [20000, 120000],
    modes: ["Sur chantier", "À domicile"],
    freeSkills: ["Vidéosurveillance", "Rondes de nuit", "Contrôle d'accès", "Agents formés"],
  },
  energie: {
    descriptions: [
      "Installation solaire et solutions énergétiques à {city}, {years} ans d'expérience.",
      "Panneaux, batteries et groupes électrogènes pour maisons et commerces à {city}.",
    ],
    units: ["Par prestation", "Forfait"],
    amount: [30000, 300000],
    modes: ["À domicile", "Sur chantier"],
    freeSkills: ["Dimensionnement solaire", "Onduleurs", "Maintenance groupes", "Batteries lithium"],
  },
  textile_mode: {
    descriptions: [
      "Couture sur mesure et retouches à {city}, {years} ans de création.",
      "Tenues traditionnelles et modernes confectionnées avec soin à {city}.",
    ],
    units: ["Par prestation"],
    amount: [10000, 80000],
    modes: ["En atelier", "À domicile"],
    freeSkills: ["Pagne", "Broderie", "Tenues de cérémonie", "Retouches express"],
  },
  communication_impression: {
    descriptions: [
      "Impression, graphisme et communication visuelle à {city}, {years} ans d'expérience.",
      "Cartes, affiches, enseignes et supports numériques réalisés à {city}.",
    ],
    units: ["Par prestation", "Forfait"],
    amount: [15000, 150000],
    modes: ["À distance", "En atelier"],
    freeSkills: ["Logos", "Bâches", "Réseaux sociaux", "Impression grand format"],
  },
  metiers_artisanat: {
    descriptions: [
      "Artisan à {city} depuis {years} ans : fabrication et réparation à la main.",
      "Pièces uniques et travail soigné à {city}, sur commande.",
    ],
    units: ["Par prestation"],
    amount: [10000, 90000],
    modes: ["En atelier", "À domicile"],
    freeSkills: ["Sur mesure", "Réparation", "Finitions", "Livraison"],
  },
  services_admin_juridique: {
    descriptions: [
      "Assistance administrative et juridique à {city}, {years} ans d'expérience.",
      "Démarches, contrats et conseils clairs à {city}, en toute confidentialité.",
    ],
    units: ["Par prestation", "Par heure"],
    amount: [20000, 150000],
    modes: ["À distance", "À domicile"],
    freeSkills: ["Rédaction de contrats", "Démarches RCCM", "Traduction", "Comptabilité"],
  },
  autres: {
    descriptions: [
      "Services divers à {city} : petites tâches, aide ponctuelle, {years} ans d'expérience.",
      "Disponible rapidement à {city} pour vos besoins du quotidien.",
    ],
    units: ["Par prestation"],
    amount: [10000, 60000],
    modes: ["À domicile"],
    freeSkills: ["Courses", "Petit bricolage", "Accompagnement", "Disponible le week-end"],
  },
};

function leaves(node: TaxonomyNode): TaxonomyNode[] {
  return node.subs?.length ? node.subs.flatMap(leaves) : [node];
}

function normalizeEmailPart(value: string): string {
  return slugify(value).replace(/-/g, "");
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

function weightedPick<T extends { weight: number }>(random: () => number, items: readonly T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1]!;
}

function between(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function roundTo(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

function verification(random: () => number): VerificationStatus {
  const roll = random();
  if (roll < 0.35) return VerificationStatus.VERIFIED;
  if (roll < 0.45) return VerificationStatus.UNDER_REVIEW;
  if (roll < 0.5) return VerificationStatus.REJECTED;
  return VerificationStatus.PENDING;
}

function tier(random: () => number): PremiumTier {
  const roll = random();
  if (roll < 0.65) return PremiumTier.FREE;
  if (roll < 0.85) return PremiumTier.VERIFIED;
  if (roll < 0.95) return PremiumTier.BOOSTED;
  return PremiumTier.ELITE;
}

// Deterministic: the same seed produces the same providers on every run.
export function generatedProviders(perCategory = GENERATED_PER_CATEGORY, takenEmails: Iterable<string> = []): DemoProvider[] {
  const random = seededRandom(20260917);
  const emails = new Set(takenEmails);
  const providers: DemoProvider[] = [];
  let phoneCounter = 0;

  for (const category of taxonomy) {
    const profile = profiles[category.slug];
    if (!profile) throw new Error(`No generated profile for category ${category.slug}`);
    // A provider hangs off a subcategory, so a category without any cannot host one.
    if (!category.subs?.length) continue;
    const categoryLeaves = leaves(category);
    const skillPool = category.subs.flatMap((sub) => [sub, ...(sub.subs ?? [])]);

    for (let n = 0; n < perCategory; n += 1) {
      const firstName = pick(random, firstNames);
      const lastName = pick(random, lastNames);
      let email = `${normalizeEmailPart(firstName)}.${normalizeEmailPart(lastName)}@kayou.cd`;
      for (let suffix = 2; emails.has(email); suffix += 1) {
        email = `${normalizeEmailPart(firstName)}.${normalizeEmailPart(lastName)}${suffix}@kayou.cd`;
      }
      emails.add(email);

      const locality = weightedPick(random, localities);
      phoneCounter += 1;
      const phone =
        locality.country === "Congo"
          ? `+24206${String(2000000 + phoneCounter).padStart(7, "0")}`
          : `+24382${String(2000000 + phoneCounter).padStart(7, "0")}`;

      const yearsExperience = between(random, 1, 20);
      const leaf = pick(random, categoryLeaves);
      // Skills cover the whole category tree (subcategories and services) or about half of it.
      const others = skillPool.filter((node) => node.slug !== leaf.slug).sort(() => random() - 0.5);
      const skills = random() < 0.5 ? others : others.slice(0, Math.ceil(others.length / 2));
      const freeSkills = [...profile.freeSkills].sort(() => random() - 0.5).slice(0, between(random, 1, 2));
      const languages = ["Français", ...locality.languages.slice(0, between(random, 0, locality.languages.length))];
      if (random() < 0.2 && !languages.includes("Anglais")) languages.push("Anglais");
      const modes = profile.modes.slice(0, between(random, 1, profile.modes.length));

      const cdfAmount = roundTo(between(random, profile.amount[0], profile.amount[1]), 500);
      const pricing: DemoProvider["pricing"] =
        locality.country === "Congo"
          ? { amount: roundTo(cdfAmount / 4.5, 500), currency: "XAF", unit: pick(random, profile.units) }
          : { amount: cdfAmount, currency: "CDF", unit: pick(random, profile.units) };

      providers.push({
        firstName,
        lastName,
        email,
        phone,
        hasWhatsApp: random() < 0.7,
        country: locality.country,
        placeSlug: locality.placeSlug,
        addressLine: `${between(random, 1, 180)}, ${pick(random, streets)}`,
        latitude: Number((locality.latitude + (random() - 0.5) * 0.024).toFixed(4)),
        longitude: Number((locality.longitude + (random() - 0.5) * 0.024).toFixed(4)),
        timezone: locality.timezone,
        description: pick(random, profile.descriptions)
          .replace("{city}", locality.city)
          .replace("{years}", String(yearsExperience)),
        yearsExperience,
        subcategorySlug: leaf.slug,
        skillSubcategorySlugs: skills.map((node) => node.slug),
        freeSkills,
        languages,
        interventionModes: modes,
        pricing,
        verificationStatus: verification(random),
        premiumTier: tier(random),
        profilePhoto: random() < 0.6 ? `https://picsum.photos/seed/kayou-avatar-${phoneCounter}/300/300` : null,
        generated: true,
      });
    }
  }

  return providers;
}
