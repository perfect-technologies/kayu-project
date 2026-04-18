import type { PrismaClient } from "@prisma/client";

type SeedPrismaClient = Pick<PrismaClient, "category" | "subcategory" | "trade">;

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  subcategories: Array<{
    name: string;
    slug: string;
    order: number;
    trades: Array<{
      name: string;
      slug: string;
      description: string;
      basePrice: number;
      duration: number;
    }>;
  }>;
};

export const categoriesData = [
  {
    name: 'Bâtiment & Construction',
    slug: 'batiment-construction',
    description: 'Services de construction, rénovation et entretien',
    icon: 'Building',
    color: '#ef4444',
    order: 1,
    subcategories: [
      {
        name: 'Maçonnerie',
        slug: 'maconnerie',
        order: 1,
        trades: [
          { name: 'Maçon', slug: 'macon', description: 'Construction de murs, fondations, structures', basePrice: 15000, duration: 480 },
          { name: 'Tailleur de pierre', slug: 'tailleur-de-pierre', description: 'Travail et sculpture de la pierre', basePrice: 20000, duration: 480 },
          { name: 'Briquetier', slug: 'briquetier', description: 'Pose de briques et parpaings', basePrice: 12000, duration: 480 },
        ],
      },
      {
        name: 'Plâtrerie',
        slug: 'platrerie',
        order: 2,
        trades: [
          { name: 'Plâtrier', slug: 'platrier', description: 'Pose de plâtre, enduits, cloisons', basePrice: 10000, duration: 240 },
          { name: 'Staffeur', slug: 'staffeur', description: 'Décorations en staff, moulures', basePrice: 15000, duration: 240 },
        ],
      },
      {
        name: 'Carrelage',
        slug: 'carrelage',
        order: 3,
        trades: [
          { name: 'Carreleur', slug: 'carreleur', description: 'Pose de carrelage, faïence, mosaïque', basePrice: 12000, duration: 480 },
          { name: 'Poseur de revêtements', slug: 'poseur-revetements', description: 'Pose de sols, parquets, vinyles', basePrice: 10000, duration: 480 },
        ],
      },
      {
        name: 'Peinture',
        slug: 'peinture',
        order: 4,
        trades: [
          { name: 'Peintre en bâtiment', slug: 'peintre-batiment', description: 'Peinture intérieure et extérieure', basePrice: 8000, duration: 480 },
          { name: 'Décorateur', slug: 'decorateur', description: 'Finitions décoratives, effets', basePrice: 12000, duration: 480 },
        ],
      },
      {
        name: 'Toiture',
        slug: 'toiture',
        order: 5,
        trades: [
          { name: 'Couvreur', slug: 'couvreur', description: 'Réparation et entretien de toiture', basePrice: 20000, duration: 480 },
          { name: 'Zingueur', slug: 'zingueur', description: 'Gouttières, descentes, zinguerie', basePrice: 18000, duration: 240 },
        ],
      },
    ],
  },
  {
    name: 'Plomberie & Sanitaire',
    slug: 'plomberie-sanitaire',
    description: 'Installation et réparation de plomberie',
    icon: 'Droplets',
    color: '#3b82f6',
    order: 2,
    subcategories: [
      {
        name: 'Plomberie générale',
        slug: 'plomberie-generale',
        order: 1,
        trades: [
          { name: 'Plombier', slug: 'plombier', description: 'Installation et réparation de tuyauterie', basePrice: 10000, duration: 120 },
          { name: 'Plombier chauffagiste', slug: 'plombier-chauffagiste', description: 'Installation de chauffe-eau, chaudières', basePrice: 15000, duration: 240 },
        ],
      },
      {
        name: 'Sanitaires',
        slug: 'sanitaires',
        order: 2,
        trades: [
          { name: 'Installateur sanitaire', slug: 'installateur-sanitaire', description: 'Pose de WC, lavabos, baignoires', basePrice: 12000, duration: 240 },
          { name: 'Déboucheur', slug: 'deboucheur', description: 'Débouchage de canalisations', basePrice: 8000, duration: 60 },
        ],
      },
    ],
  },
  {
    name: 'Électricité',
    slug: 'electricite',
    description: 'Installations électriques et dépannage',
    icon: 'Zap',
    color: '#f59e0b',
    order: 3,
    subcategories: [
      {
        name: 'Électricité générale',
        slug: 'electricite-generale',
        order: 1,
        trades: [
          { name: 'Électricien', slug: 'electricien', description: 'Installation et réparation électrique', basePrice: 12000, duration: 120 },
          { name: 'Électrotechnicien', slug: 'electrotechnicien', description: 'Installations industrielles', basePrice: 20000, duration: 240 },
        ],
      },
      {
        name: 'Électricité automobile',
        slug: 'electricite-automobile',
        order: 2,
        trades: [
          { name: 'Électricien auto', slug: 'electricien-auto', description: 'Diagnostic et réparation électrique auto', basePrice: 10000, duration: 120 },
          { name: 'Installateur audio auto', slug: 'installateur-audio-auto', description: 'Autoradio, haut-parleurs, alarmes', basePrice: 8000, duration: 180 },
        ],
      },
      {
        name: 'Climatisation',
        slug: 'climatisation',
        order: 3,
        trades: [
          { name: 'Climaticien', slug: 'climaticien', description: 'Installation et maintenance de climatiseurs', basePrice: 15000, duration: 240 },
          { name: 'Frigoriste', slug: 'frigoriste', description: 'Réfrigération commerciale et industrielle', basePrice: 20000, duration: 240 },
        ],
      },
    ],
  },
  {
    name: 'Menuiserie & Ébénisterie',
    slug: 'menuiserie-ebenisterie',
    description: 'Travail du bois et aménagement',
    icon: 'Hammer',
    color: '#8b5cf6',
    order: 4,
    subcategories: [
      {
        name: 'Menuiserie bois',
        slug: 'menuiserie-bois',
        order: 1,
        trades: [
          { name: 'Menuisier', slug: 'menuisier', description: 'Fabrication et pose de menuiseries', basePrice: 15000, duration: 480 },
          { name: 'Ébéniste', slug: 'ebeniste', description: 'Fabrication de meubles sur mesure', basePrice: 25000, duration: 960 },
        ],
      },
      {
        name: 'Menuiserie aluminium',
        slug: 'menuiserie-aluminium',
        order: 2,
        trades: [
          { name: 'Menuisier alu', slug: 'menuisier-alu', description: 'Portes, fenêtres, façades aluminium', basePrice: 20000, duration: 480 },
        ],
      },
      {
        name: 'Agencement',
        slug: 'agencement',
        order: 3,
        trades: [
          { name: 'Agenceur', slug: 'agenceur', description: 'Aménagement intérieur, cuisines, dressings', basePrice: 20000, duration: 960 },
          { name: 'Parqueteur', slug: 'parqueteur', description: 'Pose et rénovation de parquets', basePrice: 12000, duration: 480 },
        ],
      },
    ],
  },
  {
    name: 'Métallerie & Serrurerie',
    slug: 'metallerie-serrurerie',
    description: 'Travail du métal et sécurité',
    icon: 'Key',
    color: '#6b7280',
    order: 5,
    subcategories: [
      {
        name: 'Serrurerie',
        slug: 'serrurerie',
        order: 1,
        trades: [
          { name: 'Serrurier', slug: 'serrurier', description: 'Réparation et installation de serrures', basePrice: 8000, duration: 60 },
          { name: 'Serrurier dépanneur', slug: 'serrurier-depanneur', description: 'Ouverture de portes, urgences', basePrice: 15000, duration: 30 },
        ],
      },
      {
        name: 'Métallerie',
        slug: 'metallerie',
        order: 2,
        trades: [
          { name: 'Métallier', slug: 'metallier', description: 'Portails, garde-corps, rampes', basePrice: 25000, duration: 480 },
          { name: 'Soudeur', slug: 'soudeur', description: 'Soudure générale, réparations', basePrice: 12000, duration: 120 },
          { name: 'Forgeron', slug: 'forgeron', description: 'Travail artisanal du fer', basePrice: 30000, duration: 480 },
        ],
      },
    ],
  },
  {
    name: 'Automobile',
    slug: 'automobile',
    description: 'Réparation et entretien automobile',
    icon: 'Car',
    color: '#ec4899',
    order: 6,
    subcategories: [
      {
        name: 'Mécanique',
        slug: 'mecanique-auto',
        order: 1,
        trades: [
          { name: 'Mécanicien auto', slug: 'mecanicien-auto', description: 'Réparation et entretien véhicules', basePrice: 10000, duration: 240 },
          { name: 'Mécanicien moto', slug: 'mecanicien-moto', description: 'Réparation de motos et scooters', basePrice: 8000, duration: 120 },
          { name: 'Mécanicien poids lourd', slug: 'mecanicien-poids-lourd', description: 'Camions et véhicules industriels', basePrice: 20000, duration: 480 },
        ],
      },
      {
        name: 'Carrosserie',
        slug: 'carrosserie',
        order: 2,
        trades: [
          { name: 'Carrossier', slug: 'carrossier', description: 'Réparation de carrosserie', basePrice: 15000, duration: 480 },
          { name: 'Peintre auto', slug: 'peintre-auto', description: 'Peinture automobile', basePrice: 25000, duration: 960 },
        ],
      },
      {
        name: 'Pneumatiques',
        slug: 'pneumatiques',
        order: 3,
        trades: [
          { name: 'Monteur de pneus', slug: 'monteur-pneus', description: 'Montage, équilibrage, réparation', basePrice: 5000, duration: 60 },
        ],
      },
    ],
  },
  {
    name: 'Beauté & Bien-être',
    slug: 'beaute-bien-etre',
    description: 'Services de beauté et soins',
    icon: 'Sparkles',
    color: '#f472b6',
    order: 7,
    subcategories: [
      {
        name: 'Coiffure',
        slug: 'coiffure',
        order: 1,
        trades: [
          { name: 'Coiffeur', slug: 'coiffeur', description: 'Coupe et coiffure homme/femme', basePrice: 5000, duration: 60 },
          { name: 'Barbier', slug: 'barbier', description: 'Coupe et soins barbe', basePrice: 3000, duration: 30 },
          { name: 'Tresseur', slug: 'tresseur', description: 'Tresses, nattes, tissages', basePrice: 8000, duration: 180 },
        ],
      },
      {
        name: 'Esthétique',
        slug: 'esthetique',
        order: 2,
        trades: [
          { name: 'Esthéticienne', slug: 'estheticienne', description: 'Soins visage et corps', basePrice: 10000, duration: 120 },
          { name: 'Manucure', slug: 'manucure', description: 'Soins des mains, pose d\'ongles', basePrice: 5000, duration: 60 },
          { name: 'Pédicure', slug: 'pedicure', description: 'Soins des pieds', basePrice: 5000, duration: 60 },
        ],
      },
      {
        name: 'Bien-être',
        slug: 'bien-etre',
        order: 3,
        trades: [
          { name: 'Masseur', slug: 'masseur', description: 'Massages thérapeutiques et relaxants', basePrice: 15000, duration: 90 },
          { name: 'Make-up artist', slug: 'make-up-artist', description: 'Maquillage professionnel', basePrice: 10000, duration: 90 },
        ],
      },
    ],
  },
  {
    name: 'Mode & Textile',
    slug: 'mode-textile',
    description: 'Création et réparation de vêtements',
    icon: 'Shirt',
    color: '#a855f7',
    order: 8,
    subcategories: [
      {
        name: 'Couture',
        slug: 'couture',
        order: 1,
        trades: [
          { name: 'Couturier', slug: 'couturier', description: 'Création et retouche de vêtements', basePrice: 5000, duration: 120 },
          { name: 'Modiste', slug: 'modiste', description: 'Création de chapeaux et accessoires', basePrice: 8000, duration: 180 },
          { name: 'Brodeur', slug: 'brodeur', description: 'Broderie traditionnelle et moderne', basePrice: 10000, duration: 240 },
        ],
      },
      {
        name: 'Nettoyage',
        slug: 'nettoyage-textile',
        order: 2,
        trades: [
          { name: 'Teinturier', slug: 'teinturier', description: 'Nettoyage à sec, teinture', basePrice: 5000, duration: 1440 },
          { name: 'Repassage', slug: 'repassage', description: 'Repassage à domicile', basePrice: 3000, duration: 120 },
        ],
      },
    ],
  },
  {
    name: 'Maison & Entretien',
    slug: 'maison-entretien',
    description: 'Services domestiques et entretien',
    icon: 'Home',
    color: '#14b8a6',
    order: 9,
    subcategories: [
      {
        name: 'Nettoyage',
        slug: 'nettoyage',
        order: 1,
        trades: [
          { name: 'Agent de ménage', slug: 'agent-menage', description: 'Nettoyage et entretien de la maison', basePrice: 5000, duration: 240 },
          { name: 'Femme de ménage', slug: 'femme-menage', description: 'Nettoyage régulier', basePrice: 4000, duration: 240 },
          { name: 'Nettoyeur professionnel', slug: 'nettoyeur-pro', description: 'Nettoyage en profondeur', basePrice: 15000, duration: 480 },
        ],
      },
      {
        name: 'Jardinage',
        slug: 'jardinage',
        order: 2,
        trades: [
          { name: 'Jardinier', slug: 'jardinier', description: 'Entretien de jardins et espaces verts', basePrice: 8000, duration: 240 },
          { name: 'Paysagiste', slug: 'paysagiste', description: 'Création et aménagement de jardins', basePrice: 20000, duration: 480 },
          { name: 'Élagueur', slug: 'elagueur', description: 'Taille et élagage d\'arbres', basePrice: 15000, duration: 240 },
        ],
      },
      {
        name: 'Déménagement',
        slug: 'demenagement',
        order: 3,
        trades: [
          { name: 'Déménageur', slug: 'demenageur', description: 'Transport de meubles et cartons', basePrice: 30000, duration: 480 },
          { name: 'Aide au déménagement', slug: 'aide-demenagement', description: 'Chargement et déchargement', basePrice: 10000, duration: 240 },
        ],
      },
    ],
  },
  {
    name: 'Enfance & Garde',
    slug: 'enfance-garde',
    description: 'Services de garde et éducation',
    icon: 'Baby',
    color: '#fbbf24',
    order: 10,
    subcategories: [
      {
        name: 'Garde d\'enfants',
        slug: 'garde-enfants',
        order: 1,
        trades: [
          { name: 'Baby-sitter', slug: 'baby-sitter', description: 'Garde occasionnelle d\'enfants', basePrice: 3000, duration: 60 },
          { name: 'Nounou', slug: 'nounou', description: 'Garde régulière d\'enfants', basePrice: 5000, duration: 480 },
          { name: 'Auxiliaire de puériculture', slug: 'auxiliaire-puericulture', description: 'Soins aux jeunes enfants', basePrice: 8000, duration: 480 },
        ],
      },
      {
        name: 'Éducation',
        slug: 'education',
        order: 2,
        trades: [
          { name: 'Professeur particulier', slug: 'professeur-particulier', description: 'Cours de soutien scolaire', basePrice: 5000, duration: 60 },
          { name: 'Coach scolaire', slug: 'coach-scolaire', description: 'Accompagnement scolaire', basePrice: 8000, duration: 90 },
        ],
      },
    ],
  },
  {
    name: 'Santé & Sport',
    slug: 'sante-sport',
    description: 'Services de santé et coaching sportif',
    icon: 'Heart',
    color: '#ef4444',
    order: 11,
    subcategories: [
      {
        name: 'Soins à domicile',
        slug: 'soins-domicile',
        order: 1,
        trades: [
          { name: 'Infirmier à domicile', slug: 'infirmier-domicile', description: 'Soins infirmiers à domicile', basePrice: 10000, duration: 60 },
          { name: 'Kinésithérapeute', slug: 'kinesitherapeute', description: 'Rééducation et massages thérapeutiques', basePrice: 15000, duration: 60 },
          { name: 'Aide-soignant', slug: 'aide-soignant', description: 'Assistance aux personnes', basePrice: 8000, duration: 240 },
        ],
      },
      {
        name: 'Sport',
        slug: 'sport',
        order: 2,
        trades: [
          { name: 'Coach sportif', slug: 'coach-sportif', description: 'Entraînement personnel', basePrice: 10000, duration: 90 },
          { name: 'Professeur de yoga', slug: 'professeur-yoga', description: 'Cours de yoga', basePrice: 8000, duration: 60 },
          { name: 'Professeur de danse', slug: 'professeur-danse', description: 'Cours de danse', basePrice: 8000, duration: 60 },
        ],
      },
    ],
  },
  {
    name: 'Informatique & Tech',
    slug: 'informatique-tech',
    description: 'Services numériques et informatiques',
    icon: 'Monitor',
    color: '#0ea5e9',
    order: 12,
    subcategories: [
      {
        name: 'Développement',
        slug: 'developpement',
        order: 1,
        trades: [
          { name: 'Développeur web', slug: 'developpeur-web', description: 'Création de sites web', basePrice: 50000, duration: 1440 },
          { name: 'Développeur mobile', slug: 'developpeur-mobile', description: 'Applications mobiles', basePrice: 80000, duration: 2880 },
          { name: 'Designer UI/UX', slug: 'designer-ui-ux', description: 'Design d\'interfaces', basePrice: 40000, duration: 480 },
        ],
      },
      {
        name: 'Support',
        slug: 'support-informatique',
        order: 2,
        trades: [
          { name: 'Technicien informatique', slug: 'technicien-informatique', description: 'Dépannage et maintenance', basePrice: 10000, duration: 120 },
          { name: 'Formateur informatique', slug: 'formateur-informatique', description: 'Formation bureautique', basePrice: 8000, duration: 120 },
        ],
      },
      {
        name: 'Réseaux',
        slug: 'reseaux',
        order: 3,
        trades: [
          { name: 'Administrateur réseau', slug: 'administrateur-reseau', description: 'Installation et maintenance réseaux', basePrice: 20000, duration: 240 },
          { name: 'Installateur caméra', slug: 'installateur-camera', description: 'Vidéosurveillance et sécurité', basePrice: 25000, duration: 240 },
        ],
      },
    ],
  },
  {
    name: 'Transport & Logistique',
    slug: 'transport-logistique',
    description: 'Services de transport et livraison',
    icon: 'Truck',
    color: '#84cc16',
    order: 13,
    subcategories: [
      {
        name: 'Transport de personnes',
        slug: 'transport-personnes',
        order: 1,
        trades: [
          { name: 'Chauffeur privé', slug: 'chauffeur-prive', description: 'Transport avec chauffeur', basePrice: 10000, duration: 60 },
          { name: 'Chauffeur VTC', slug: 'chauffeur-vtc', description: 'Transport à la demande', basePrice: 8000, duration: 60 },
          { name: 'Taxi', slug: 'taxi', description: 'Transport urbain', basePrice: 5000, duration: 30 },
        ],
      },
      {
        name: 'Livraison',
        slug: 'livraison',
        order: 2,
        trades: [
          { name: 'Livreur', slug: 'livreur', description: 'Livraison de colis et courses', basePrice: 3000, duration: 60 },
          { name: 'Coursier moto', slug: 'coursier-moto', description: 'Livraison rapide 2 roues', basePrice: 2000, duration: 30 },
        ],
      },
    ],
  },
  {
    name: 'Événementiel',
    slug: 'evenementiel',
    description: 'Organisation d\'événements',
    icon: 'Calendar',
    color: '#f97316',
    order: 14,
    subcategories: [
      {
        name: 'Organisation',
        slug: 'organisation-evenements',
        order: 1,
        trades: [
          { name: 'Wedding planner', slug: 'wedding-planner', description: 'Organisation de mariages', basePrice: 100000, duration: 4320 },
          { name: 'Organisateur d\'événements', slug: 'organisateur-evenements', description: 'Fêtes, anniversaires, cérémonies', basePrice: 50000, duration: 1440 },
        ],
      },
      {
        name: 'Animation',
        slug: 'animation',
        order: 2,
        trades: [
          { name: 'DJ', slug: 'dj', description: 'Animation musicale', basePrice: 30000, duration: 360 },
          { name: 'Photographe', slug: 'photographe', description: 'Photos d\'événements', basePrice: 50000, duration: 480 },
          { name: 'Vidéaste', slug: 'videaste', description: 'Vidéo d\'événements', basePrice: 80000, duration: 480 },
        ],
      },
      {
        name: 'Traiteur',
        slug: 'traiteur',
        order: 3,
        trades: [
          { name: 'Traiteur', slug: 'traiteur', description: 'Restauration pour événements', basePrice: 15000, duration: 60 },
          { name: 'Cuisinier à domicile', slug: 'cuisinier-domicile', description: 'Cuisine à domicile', basePrice: 10000, duration: 180 },
          { name: 'Pâtissier', slug: 'patissier', description: 'Gâteaux et desserts', basePrice: 8000, duration: 120 },
        ],
      },
    ],
  },
  {
    name: 'Sécurité',
    slug: 'securite',
    description: 'Services de sécurité',
    icon: 'Shield',
    color: '#1e3a5f',
    order: 15,
    subcategories: [
      {
        name: 'Gardiennage',
        slug: 'gardiennage',
        order: 1,
        trades: [
          { name: 'Agent de sécurité', slug: 'agent-securite', description: 'Surveillance et gardiennage', basePrice: 8000, duration: 480 },
          { name: 'Gardien', slug: 'gardien', description: 'Surveillance de locaux', basePrice: 6000, duration: 480 },
          { name: 'Agent de surveillance', slug: 'agent-surveillance', description: 'Surveillance vidéo et ronde', basePrice: 8000, duration: 480 },
        ],
      },
      {
        name: 'Protection',
        slug: 'protection',
        order: 2,
        trades: [
          { name: 'Bodyguard', slug: 'bodyguard', description: 'Protection rapprochée', basePrice: 30000, duration: 480 },
        ],
      },
    ],
  },
] satisfies CategorySeed[];

export async function seedCategories(prisma: SeedPrismaClient) {
  console.log("Seeding categories, subcategories, and trades...");

  for (const categoryData of categoriesData) {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        order: categoryData.order,
        isActive: true,
      },
    });

    for (const subcategoryData of categoryData.subcategories) {
      const subcategory = await prisma.subcategory.create({
        data: {
          categoryId: category.id,
          name: subcategoryData.name,
          slug: subcategoryData.slug,
          order: subcategoryData.order,
          isActive: true,
        },
      });

      for (let index = 0; index < subcategoryData.trades.length; index += 1) {
        const tradeData = subcategoryData.trades[index];

        await prisma.trade.create({
          data: {
            subcategoryId: subcategory.id,
            name: tradeData.name,
            slug: tradeData.slug,
            description: tradeData.description,
            basePrice: tradeData.basePrice,
            duration: tradeData.duration,
            isActive: true,
            order: index + 1,
          },
        });
      }
    }
  }

  const [categoryCount, subcategoryCount, tradeCount] = await Promise.all([
    prisma.category.count(),
    prisma.subcategory.count(),
    prisma.trade.count(),
  ]);

  console.log(`Seeded ${categoryCount} categories, ${subcategoryCount} subcategories, and ${tradeCount} trades.`);
}
