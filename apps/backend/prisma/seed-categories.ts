import type { PrismaClient } from "@prisma/client";

type SeedPrismaClient = Pick<PrismaClient, "category" | "subcategory">;

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  image: string;
  order: number;
  subcategories: Array<{
    name: string;
    slug: string;
    order: number;
  }>;
};

const unsplashImage = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&h=480&fit=crop&q=80`;

export const categoriesData = [
  {
    name: 'Bâtiment & Construction',
    slug: 'batiment-construction',
    description: 'Services de construction, rénovation et entretien',
    icon: 'Building',
    color: '#ef4444',
    image: unsplashImage('photo-1503387762-592deb58ef4e'),
    order: 1,
    subcategories: [
      {
        name: 'Maçonnerie',
        slug: 'maconnerie',
        order: 1,
      },
      {
        name: 'Plâtrerie',
        slug: 'platrerie',
        order: 2,
      },
      {
        name: 'Carrelage',
        slug: 'carrelage',
        order: 3,
      },
      {
        name: 'Peinture',
        slug: 'peinture',
        order: 4,
      },
      {
        name: 'Toiture',
        slug: 'toiture',
        order: 5,
      },
    ],
  },
  {
    name: 'Plomberie & Sanitaire',
    slug: 'plomberie-sanitaire',
    description: 'Installation et réparation de plomberie',
    icon: 'Droplets',
    color: '#3b82f6',
    image: unsplashImage('photo-1585704032915-c3400ca199e7'),
    order: 2,
    subcategories: [
      {
        name: 'Plomberie générale',
        slug: 'plomberie-generale',
        order: 1,
      },
      {
        name: 'Sanitaires',
        slug: 'sanitaires',
        order: 2,
      },
    ],
  },
  {
    name: 'Électricité',
    slug: 'electricite',
    description: 'Installations électriques et dépannage',
    icon: 'Zap',
    color: '#f59e0b',
    image: unsplashImage('photo-1621905251189-08b45d6a269e'),
    order: 3,
    subcategories: [
      {
        name: 'Électricité générale',
        slug: 'electricite-generale',
        order: 1,
      },
      {
        name: 'Électricité automobile',
        slug: 'electricite-automobile',
        order: 2,
      },
      {
        name: 'Climatisation',
        slug: 'climatisation',
        order: 3,
      },
    ],
  },
  {
    name: 'Menuiserie & Ébénisterie',
    slug: 'menuiserie-ebenisterie',
    description: 'Travail du bois et aménagement',
    icon: 'Hammer',
    color: '#8b5cf6',
    image: unsplashImage('photo-1452860606245-08befc0ff44b'),
    order: 4,
    subcategories: [
      {
        name: 'Menuiserie bois',
        slug: 'menuiserie-bois',
        order: 1,
      },
      {
        name: 'Menuiserie aluminium',
        slug: 'menuiserie-aluminium',
        order: 2,
      },
      {
        name: 'Agencement',
        slug: 'agencement',
        order: 3,
      },
    ],
  },
  {
    name: 'Métallerie & Serrurerie',
    slug: 'metallerie-serrurerie',
    description: 'Travail du métal et sécurité',
    icon: 'Key',
    color: '#6b7280',
    image: unsplashImage('photo-1504917595217-d4dc5ebe6122'),
    order: 5,
    subcategories: [
      {
        name: 'Serrurerie',
        slug: 'serrurerie',
        order: 1,
      },
      {
        name: 'Métallerie',
        slug: 'metallerie',
        order: 2,
      },
    ],
  },
  {
    name: 'Automobile',
    slug: 'automobile',
    description: 'Réparation et entretien automobile',
    icon: 'Car',
    color: '#ec4899',
    image: unsplashImage('photo-1486006920555-c77dcf18193c'),
    order: 6,
    subcategories: [
      {
        name: 'Mécanique',
        slug: 'mecanique-auto',
        order: 1,
      },
      {
        name: 'Carrosserie',
        slug: 'carrosserie',
        order: 2,
      },
      {
        name: 'Pneumatiques',
        slug: 'pneumatiques',
        order: 3,
      },
    ],
  },
  {
    name: 'Beauté & Bien-être',
    slug: 'beaute-bien-etre',
    description: 'Services de beauté et soins',
    icon: 'Sparkles',
    color: '#f472b6',
    image: unsplashImage('photo-1560066984-138dadb4c035'),
    order: 7,
    subcategories: [
      {
        name: 'Coiffure',
        slug: 'coiffure',
        order: 1,
      },
      {
        name: 'Esthétique',
        slug: 'esthetique',
        order: 2,
      },
      {
        name: 'Bien-être',
        slug: 'bien-etre',
        order: 3,
      },
    ],
  },
  {
    name: 'Mode & Textile',
    slug: 'mode-textile',
    description: 'Création et réparation de vêtements',
    icon: 'Shirt',
    color: '#a855f7',
    image: unsplashImage('photo-1558769132-cb1aea458c5e'),
    order: 8,
    subcategories: [
      {
        name: 'Couture',
        slug: 'couture',
        order: 1,
      },
      {
        name: 'Nettoyage',
        slug: 'nettoyage-textile',
        order: 2,
      },
    ],
  },
  {
    name: 'Maison & Entretien',
    slug: 'maison-entretien',
    description: 'Services domestiques et entretien',
    icon: 'Home',
    color: '#14b8a6',
    image: unsplashImage('photo-1581578731548-c64695cc6952'),
    order: 9,
    subcategories: [
      {
        name: 'Nettoyage',
        slug: 'nettoyage',
        order: 1,
      },
      {
        name: 'Jardinage',
        slug: 'jardinage',
        order: 2,
      },
      {
        name: 'Déménagement',
        slug: 'demenagement',
        order: 3,
      },
    ],
  },
  {
    name: 'Enfance & Garde',
    slug: 'enfance-garde',
    description: 'Services de garde et éducation',
    icon: 'Baby',
    color: '#fbbf24',
    image: unsplashImage('photo-1503454537195-1dcabb73ffb9'),
    order: 10,
    subcategories: [
      {
        name: 'Garde d\'enfants',
        slug: 'garde-enfants',
        order: 1,
      },
      {
        name: 'Éducation',
        slug: 'education',
        order: 2,
      },
    ],
  },
  {
    name: 'Santé & Sport',
    slug: 'sante-sport',
    description: 'Services de santé et coaching sportif',
    icon: 'Heart',
    color: '#ef4444',
    image: unsplashImage('photo-1571019613454-1cb2f99b2d8b'),
    order: 11,
    subcategories: [
      {
        name: 'Soins à domicile',
        slug: 'soins-domicile',
        order: 1,
      },
      {
        name: 'Sport',
        slug: 'sport',
        order: 2,
      },
    ],
  },
  {
    name: 'Informatique & Tech',
    slug: 'informatique-tech',
    description: 'Services numériques et informatiques',
    icon: 'Monitor',
    color: '#0ea5e9',
    image: unsplashImage('photo-1517694712202-14dd9538aa97'),
    order: 12,
    subcategories: [
      {
        name: 'Développement',
        slug: 'developpement',
        order: 1,
      },
      {
        name: 'Support',
        slug: 'support-informatique',
        order: 2,
      },
      {
        name: 'Réseaux',
        slug: 'reseaux',
        order: 3,
      },
    ],
  },
  {
    name: 'Transport & Logistique',
    slug: 'transport-logistique',
    description: 'Services de transport et livraison',
    icon: 'Truck',
    color: '#84cc16',
    image: unsplashImage('photo-1494976388531-d1058494cdd8'),
    order: 13,
    subcategories: [
      {
        name: 'Transport de personnes',
        slug: 'transport-personnes',
        order: 1,
      },
      {
        name: 'Livraison',
        slug: 'livraison',
        order: 2,
      },
    ],
  },
  {
    name: 'Événementiel',
    slug: 'evenementiel',
    description: 'Organisation d\'événements',
    icon: 'Calendar',
    color: '#f97316',
    image: unsplashImage('photo-1530103862676-de8c9debad1d'),
    order: 14,
    subcategories: [
      {
        name: 'Organisation',
        slug: 'organisation-evenements',
        order: 1,
      },
      {
        name: 'Animation',
        slug: 'animation',
        order: 2,
      },
      {
        name: 'Traiteur',
        slug: 'traiteur',
        order: 3,
      },
    ],
  },
  {
    name: 'Sécurité',
    slug: 'securite',
    description: 'Services de sécurité',
    icon: 'Shield',
    color: '#1e3a5f',
    image: unsplashImage('photo-1557597774-9d273605dfa9'),
    order: 15,
    subcategories: [
      {
        name: 'Gardiennage',
        slug: 'gardiennage',
        order: 1,
      },
      {
        name: 'Protection',
        slug: 'protection',
        order: 2,
      },
    ],
  },
] satisfies CategorySeed[];

export async function seedCategories(prisma: SeedPrismaClient) {
  console.log("Seeding categories and subcategories...");

  for (const categoryData of categoriesData) {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        image: categoryData.image,
        order: categoryData.order,
        isActive: true,
      },
    });

    for (const subcategoryData of categoryData.subcategories) {
      await prisma.subcategory.create({
        data: {
          categoryId: category.id,
          name: subcategoryData.name,
          slug: subcategoryData.slug,
          order: subcategoryData.order,
          isActive: true,
        },
      });
    }
  }

  const [categoryCount, subcategoryCount] = await Promise.all([
    prisma.category.count(),
    prisma.subcategory.count(),
  ]);

  console.log(`Seeded ${categoryCount} categories and ${subcategoryCount} subcategories.`);
}
