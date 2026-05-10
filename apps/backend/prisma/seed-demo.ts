import {
  BadgeType,
  BookingStatus,
  ClientTrustLevel,
  NotificationType,
  PaymentRating,
  PortfolioImageType,
  PrismaClient,
  TrustLevel,
  UserRole,
  VerificationStatus,
} from "@prisma/client";

const DEFAULT_PASSWORD = "Password123!";

type SeedPrismaClient = PrismaClient;

type DemoProvider = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  profession: string;
  description: string;
  experience: number;
  hourlyRate: number;
  isPremium: boolean;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  trustLevel: TrustLevel;
  skills: string[];
  serviceZones: Array<{ city: string; commune?: string }>;
  subcategorySlugs: string[];
};

type DemoClient = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  isVerified: boolean;
  clientTrustLevel: ClientTrustLevel;
};

type CreatedProvider = {
  userId: string;
  providerId: string;
  profession: string;
  bookingTitle: string;
  bookingDescription: string;
  bookingDuration: number;
  bookingPrice: number;
  trustScoreId: string;
};

type CreatedClient = {
  userId: string;
  city: string;
};

const providersData: DemoProvider[] = [
  {
    firstName: "Jean-Pierre",
    lastName: "Mukendi",
    email: "jeanpierre.mukendi@kayou.cd",
    phone: "+243812345670",
    city: "Kinshasa",
    country: "RDC",
    profession: "Electricien",
    description: "Installations residentielles, depannage et mise aux normes sur Kinshasa.",
    experience: 15,
    hourlyRate: 25000,
    isPremium: true,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.EXPERT,
    skills: ["Installation electrique", "Depannage", "Domotique", "Mise aux normes"],
    serviceZones: [{ city: "Kinshasa", commune: "Gombe" }, { city: "Kinshasa", commune: "Ngaliema" }],
    subcategorySlugs: ["electricite-generale", "climatisation"],
  },
  {
    firstName: "Marie-Claire",
    lastName: "Nzuzi",
    email: "marieclaire.nzuzi@kayou.cd",
    phone: "+243812345671",
    city: "Kinshasa",
    country: "RDC",
    profession: "Agent de menage",
    description: "Entretien de maisons et bureaux, grand menage et repassage.",
    experience: 8,
    hourlyRate: 8000,
    isPremium: false,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.TRUSTED,
    skills: ["Menage regulier", "Grand menage", "Repassage", "Nettoyage profond"],
    serviceZones: [{ city: "Kinshasa", commune: "Lemba" }, { city: "Kinshasa", commune: "Limete" }],
    subcategorySlugs: ["nettoyage", "nettoyage-textile"],
  },
  {
    firstName: "Patrick",
    lastName: "Mbuyi",
    email: "patrick.mbuyi@kayou.cd",
    phone: "+243812345672",
    city: "Lubumbashi",
    country: "RDC",
    profession: "Plombier",
    description: "Depannage plomberie, installation sanitaire et debouchage.",
    experience: 10,
    hourlyRate: 20000,
    isPremium: true,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.TRUSTED,
    skills: ["Fuites", "Sanitaires", "Debouchage", "Chauffe-eau"],
    serviceZones: [{ city: "Lubumbashi", commune: "Annexe" }],
    subcategorySlugs: ["plomberie-generale", "sanitaires"],
  },
  {
    firstName: "Francoise",
    lastName: "Kabongo",
    email: "francoise.kabongo@kayou.cd",
    phone: "+243812345673",
    city: "Kinshasa",
    country: "RDC",
    profession: "Coiffeuse",
    description: "Coiffure a domicile, tresses, tissages et soins capillaires.",
    experience: 12,
    hourlyRate: 15000,
    isPremium: true,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.EXPERT,
    skills: ["Coiffure femme", "Tresses", "Tissage", "Soins capillaires"],
    serviceZones: [{ city: "Kinshasa", commune: "Bandalungwa" }],
    subcategorySlugs: ["coiffure"],
  },
  {
    firstName: "Thierry",
    lastName: "Mutombo",
    email: "thierry.mutombo@kayou.cd",
    phone: "+242061234574",
    city: "Brazzaville",
    country: "Congo",
    profession: "Macon",
    description: "Construction, renovation et finitions avec respect des delais.",
    experience: 20,
    hourlyRate: 18000,
    isPremium: false,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.TRUSTED,
    skills: ["Maconnerie", "Beton arme", "Renovation", "Fondations"],
    serviceZones: [{ city: "Brazzaville", commune: "Poto-Poto" }, { city: "Pointe-Noire" }],
    subcategorySlugs: ["maconnerie", "carrelage"],
  },
  {
    firstName: "Esperance",
    lastName: "Ngoma",
    email: "esperance.ngoma@kayou.cd",
    phone: "+243812345675",
    city: "Kinshasa",
    country: "RDC",
    profession: "Estheticienne",
    description: "Soins visage, manucure, pedicure et maquillage a domicile.",
    experience: 6,
    hourlyRate: 12000,
    isPremium: false,
    isVerified: false,
    verificationStatus: VerificationStatus.PENDING,
    trustLevel: TrustLevel.ESTABLISHED,
    skills: ["Manucure", "Pedicure", "Maquillage", "Soins visage"],
    serviceZones: [{ city: "Kinshasa", commune: "Kintambo" }],
    subcategorySlugs: ["esthetique"],
  },
  {
    firstName: "Dieudonne",
    lastName: "Kasongo",
    email: "dieudonne.kasongo@kayou.cd",
    phone: "+243812345676",
    city: "Lubumbashi",
    country: "RDC",
    profession: "Mecanicien auto",
    description: "Diagnostic, entretien et reparation de vehicules legers.",
    experience: 18,
    hourlyRate: 15000,
    isPremium: true,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.EXPERT,
    skills: ["Mecanique generale", "Diagnostic", "Electricite auto", "Climatisation"],
    serviceZones: [{ city: "Lubumbashi", commune: "Kamalondo" }],
    subcategorySlugs: ["mecanique-auto", "electricite-automobile", "climatisation"],
  },
  {
    firstName: "Veronique",
    lastName: "Lumumba",
    email: "veronique.lumumba@kayou.cd",
    phone: "+243812345677",
    city: "Matadi",
    country: "RDC",
    profession: "Professeure particuliere",
    description: "Soutien scolaire primaire et secondaire, mathematiques et francais.",
    experience: 10,
    hourlyRate: 10000,
    isPremium: false,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.TRUSTED,
    skills: ["Mathematiques", "Francais", "Sciences", "Preparation examens"],
    serviceZones: [{ city: "Matadi" }],
    subcategorySlugs: ["education", "support-informatique"],
  },
  {
    firstName: "Olivier",
    lastName: "Tshisekedi",
    email: "olivier.tshisekedi@kayou.cd",
    phone: "+242061234578",
    city: "Pointe-Noire",
    country: "Congo",
    profession: "Jardinier paysagiste",
    description: "Creation et entretien de jardins, taille et arrosage.",
    experience: 7,
    hourlyRate: 12000,
    isPremium: false,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.ESTABLISHED,
    skills: ["Entretien jardin", "Paysagisme", "Taille", "Arrosage"],
    serviceZones: [{ city: "Pointe-Noire" }],
    subcategorySlugs: ["jardinage"],
  },
  {
    firstName: "Grace",
    lastName: "Mwamba",
    email: "grace.mwamba@kayou.cd",
    phone: "+243812345679",
    city: "Kinshasa",
    country: "RDC",
    profession: "Cheffe cuisiniere",
    description: "Traiteur, cuisine congolaise et chef privee a domicile.",
    experience: 14,
    hourlyRate: 30000,
    isPremium: true,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.TOP_RATED,
    skills: ["Cuisine congolaise", "Traiteur", "Buffets", "Chef a domicile"],
    serviceZones: [{ city: "Kinshasa", commune: "Gombe" }],
    subcategorySlugs: ["traiteur"],
  },
  {
    firstName: "Emmanuel",
    lastName: "Kalonji",
    email: "emmanuel.kalonji@kayou.cd",
    phone: "+243812345680",
    city: "Kinshasa",
    country: "RDC",
    profession: "Technicien informatique",
    description: "Depannage, reseaux, formation et assistance a domicile.",
    experience: 9,
    hourlyRate: 18000,
    isPremium: false,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.TRUSTED,
    skills: ["Depannage PC", "Reseaux", "Formation", "Sauvegarde"],
    serviceZones: [{ city: "Kinshasa", commune: "Ngaba" }],
    subcategorySlugs: ["support-informatique", "reseaux", "developpement"],
  },
  {
    firstName: "Beatrice",
    lastName: "Nkashama",
    email: "beatrice.nkashama@kayou.cd",
    phone: "+243812345681",
    city: "Lubumbashi",
    country: "RDC",
    profession: "Organisatrice d'evenements",
    description: "Mariages, anniversaires, decoration et coordination de ceremonies.",
    experience: 8,
    hourlyRate: 25000,
    isPremium: true,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.TRUSTED,
    skills: ["Mariages", "Coordination", "Decoration", "Budget"],
    serviceZones: [{ city: "Lubumbashi" }, { city: "Kinshasa" }],
    subcategorySlugs: ["organisation-evenements", "animation"],
  },
  {
    firstName: "Firmin",
    lastName: "Mwepu",
    email: "firmin.mwepu@kayou.cd",
    phone: "+242061234582",
    city: "Brazzaville",
    country: "Congo",
    profession: "Agent de securite",
    description: "Gardiennage, controle d'acces et surveillance jour/nuit.",
    experience: 5,
    hourlyRate: 8000,
    isPremium: false,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.ESTABLISHED,
    skills: ["Gardiennage", "Surveillance", "Controle d'acces", "Rondes"],
    serviceZones: [{ city: "Brazzaville" }],
    subcategorySlugs: ["gardiennage"],
  },
  {
    firstName: "Charlene",
    lastName: "Masengu",
    email: "charlene.masengu@kayou.cd",
    phone: "+243812345683",
    city: "Kinshasa",
    country: "RDC",
    profession: "Masseuse kine",
    description: "Massages therapeutiques, sportifs et relaxation a domicile.",
    experience: 6,
    hourlyRate: 20000,
    isPremium: false,
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    trustLevel: TrustLevel.ESTABLISHED,
    skills: ["Massage therapeutique", "Kinesitherapie", "Relaxation", "Sport"],
    serviceZones: [{ city: "Kinshasa", commune: "Limete" }],
    subcategorySlugs: ["bien-etre", "soins-domicile", "sport"],
  },
  {
    firstName: "Roger",
    lastName: "Ilunga",
    email: "roger.ilunga@kayou.cd",
    phone: "+243812345684",
    city: "Kinshasa",
    country: "RDC",
    profession: "Peintre en batiment",
    description: "Peinture interieure et exterieure, finitions propres et rapides.",
    experience: 12,
    hourlyRate: 15000,
    isPremium: false,
    isVerified: false,
    verificationStatus: VerificationStatus.PENDING,
    trustLevel: TrustLevel.NEWCOMER,
    skills: ["Peinture interieure", "Peinture exterieure", "Finitions", "Decoration"],
    serviceZones: [{ city: "Kinshasa", commune: "Masina" }],
    subcategorySlugs: ["peinture", "platrerie"],
  },
];

const clientsData: DemoClient[] = [
  { firstName: "Paul", lastName: "Kabasele", email: "paul.kabasele@email.cd", phone: "+243819000001", city: "Kinshasa", country: "RDC", isVerified: true, clientTrustLevel: ClientTrustLevel.VIP_CLIENT },
  { firstName: "Michelle", lastName: "Kazadi", email: "michelle.kazadi@email.cd", phone: "+243819000002", city: "Kinshasa", country: "RDC", isVerified: true, clientTrustLevel: ClientTrustLevel.GOOD_CLIENT },
  { firstName: "Joseph", lastName: "Lomami", email: "joseph.lomami@email.cd", phone: "+243819000003", city: "Lubumbashi", country: "RDC", isVerified: true, clientTrustLevel: ClientTrustLevel.REGULAR },
  { firstName: "Annie", lastName: "Mutombo", email: "annie.mutombo@email.cd", phone: "+243819000004", city: "Kinshasa", country: "RDC", isVerified: false, clientTrustLevel: ClientTrustLevel.NEW_CLIENT },
  { firstName: "Claude", lastName: "Mwamba", email: "claude.mwamba@email.cd", phone: "+242069000005", city: "Brazzaville", country: "Congo", isVerified: true, clientTrustLevel: ClientTrustLevel.GOOD_CLIENT },
  { firstName: "Solange", lastName: "Ngoyi", email: "solange.ngoyi@email.cd", phone: "+243819000006", city: "Matadi", country: "RDC", isVerified: true, clientTrustLevel: ClientTrustLevel.REGULAR },
  { firstName: "Henri", lastName: "Kambale", email: "henri.kambale@email.cd", phone: "+243819000007", city: "Kinshasa", country: "RDC", isVerified: true, clientTrustLevel: ClientTrustLevel.VIP_CLIENT },
  { firstName: "Gisele", lastName: "Tshibanda", email: "gisele.tshibanda@email.cd", phone: "+243819000008", city: "Lubumbashi", country: "RDC", isVerified: false, clientTrustLevel: ClientTrustLevel.NEW_CLIENT },
  { firstName: "Marc", lastName: "Ndaye", email: "marc.ndaye@email.cd", phone: "+242069000009", city: "Pointe-Noire", country: "Congo", isVerified: true, clientTrustLevel: ClientTrustLevel.REGULAR },
  { firstName: "Brigitte", lastName: "Mwilo", email: "brigitte.mwilo@email.cd", phone: "+243819000010", city: "Kinshasa", country: "RDC", isVerified: true, clientTrustLevel: ClientTrustLevel.GOOD_CLIENT },
  { firstName: "Alain", lastName: "Musasa", email: "alain.musasa@email.cd", phone: "+243819000011", city: "Kinshasa", country: "RDC", isVerified: true, clientTrustLevel: ClientTrustLevel.REGULAR },
  { firstName: "Francine", lastName: "Kiese", email: "francine.kiese@email.cd", phone: "+243819000012", city: "Matadi", country: "RDC", isVerified: false, clientTrustLevel: ClientTrustLevel.NEW_CLIENT },
  { firstName: "Patrick", lastName: "Mwepu", email: "patrick.mwepu@email.cd", phone: "+242069000013", city: "Brazzaville", country: "Congo", isVerified: true, clientTrustLevel: ClientTrustLevel.GOOD_CLIENT },
];

const statusCycle = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
];

function scoreForTrustLevel(level: TrustLevel): number {
  switch (level) {
    case TrustLevel.TOP_RATED:
      return 96;
    case TrustLevel.EXPERT:
      return 90;
    case TrustLevel.TRUSTED:
      return 78;
    case TrustLevel.ESTABLISHED:
      return 64;
    case TrustLevel.NEWCOMER:
      return 42;
  }
}

function jobsForTrustLevel(level: TrustLevel, index: number): number {
  switch (level) {
    case TrustLevel.TOP_RATED:
      return 120 + index;
    case TrustLevel.EXPERT:
      return 60 + index;
    case TrustLevel.TRUSTED:
      return 24 + index;
    case TrustLevel.ESTABLISHED:
      return 8 + index;
    case TrustLevel.NEWCOMER:
      return index % 4;
  }
}

function scoreForClientTrustLevel(level: ClientTrustLevel): number {
  switch (level) {
    case ClientTrustLevel.VIP_CLIENT:
      return 96;
    case ClientTrustLevel.GOOD_CLIENT:
      return 82;
    case ClientTrustLevel.REGULAR:
      return 65;
    case ClientTrustLevel.NEW_CLIENT:
      return 25;
  }
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function authSeedId(email: string): string {
  return `seed:${email}`;
}

export async function seedDemo(prisma: SeedPrismaClient) {
  console.log("Loading seed subcategories...");
  const subcategories = await seedSubcategories(prisma);
  const subcategoryBySlug = new Map(
    subcategories.map((subcategory) => [subcategory.slug, subcategory]),
  );

  console.log("Seeding demo users and provider profiles...");
  const providers = await seedProviders(prisma, subcategoryBySlug);
  const clients = await seedClients(prisma);
  const admin = await seedAdmin(prisma);

  console.log("Seeding marketplace activity...");
  const bookings = await seedBookings(prisma, providers, clients);
  await seedReviews(prisma, bookings);
  await seedFavorites(prisma, clients, providers);
  await seedConversations(prisma, clients, providers);
  await seedNotifications(prisma, clients, providers, admin.id);
  await seedSettings(prisma);

  console.log(`Demo password for Supabase seed users: ${DEFAULT_PASSWORD}`);
  console.log(`Seeded ${providers.length} providers, ${clients.length} clients, and ${bookings.length} bookings.`);
}

async function seedSubcategories(prisma: SeedPrismaClient) {
  return prisma.subcategory.findMany({
    orderBy: { slug: "asc" },
  });
}

async function seedProviders(
  prisma: SeedPrismaClient,
  subcategoryBySlug: Map<string, Awaited<ReturnType<typeof seedSubcategories>>[number]>,
): Promise<CreatedProvider[]> {
  const created: CreatedProvider[] = [];

  for (let index = 0; index < providersData.length; index += 1) {
    const providerData = providersData[index];
    const selectedSubcategories = providerData.subcategorySlugs.map((slug) => {
      const subcategory = subcategoryBySlug.get(slug);
      if (!subcategory) throw new Error(`Missing subcategory seed data for slug ${slug}`);
      return subcategory;
    });

    const user = await prisma.user.create({
      data: {
        authUserId: authSeedId(providerData.email),
        email: providerData.email,
        phone: providerData.phone,
        firstName: providerData.firstName,
        lastName: providerData.lastName,
        role: UserRole.PROVIDER,
        roleSelectedAt: daysFromNow(-90),
        city: providerData.city,
        country: providerData.country,
        isVerified: providerData.isVerified,
        emailVerifiedAt: providerData.isVerified ? daysFromNow(-90) : null,
        phoneVerifiedAt: providerData.isVerified ? daysFromNow(-90) : null,
        clientTrustLevel: ClientTrustLevel.NEW_CLIENT,
      },
    });

    const completedJobs = jobsForTrustLevel(providerData.trustLevel, index);
    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        profession: providerData.profession,
        description: providerData.description,
        experience: providerData.experience,
        hourlyRate: providerData.hourlyRate,
        isPremium: providerData.isPremium,
        premiumExpiry: providerData.isPremium ? daysFromNow(365) : null,
        isAvailable: true,
        verificationStatus: providerData.verificationStatus,
        onboardingCompleteAt: daysFromNow(-90),
        totalJobs: completedJobs,
        totalReviews: Math.max(1, Math.floor(completedJobs / 2)),
        responseTime: 20 + index * 5,
      },
    });

    const categoryIds = Array.from(
      new Set(selectedSubcategories.map((subcategory) => subcategory.categoryId)),
    );
    const subcategoryIds = Array.from(
      new Set(selectedSubcategories.map((subcategory) => subcategory.id)),
    );
    await prisma.providerCategory.createMany({
      data: categoryIds.map((categoryId) => ({ providerId: provider.id, categoryId })),
    });

    await prisma.providerSubcategory.createMany({
      data: subcategoryIds.map((subcategoryId, subcategoryIndex) => ({
        providerId: provider.id,
        subcategoryId,
        isPrimary: subcategoryIndex === 0,
        experience: Math.max(1, providerData.experience - subcategoryIndex),
      })),
    });

    await prisma.skill.createMany({
      data: providerData.skills.map((name, skillIndex) => ({
        providerId: provider.id,
        name,
        level: Math.min(5, 3 + (skillIndex % 3)),
      })),
    });

    await prisma.serviceZone.createMany({
      data: providerData.serviceZones.map((zone) => ({
        providerId: provider.id,
        city: zone.city,
        commune: zone.commune,
      })),
    });

    await prisma.availabilitySchedule.createMany({
      data: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        providerId: provider.id,
        dayOfWeek,
        startTime: "08:00",
        endTime: dayOfWeek === 6 ? "14:00" : "18:00",
        isAvailable: true,
      })),
    });

    const baseScore = scoreForTrustLevel(providerData.trustLevel);
    const trustScore = await prisma.trustScore.create({
      data: {
        providerId: provider.id,
        overallScore: baseScore,
        reliability: Math.min(100, baseScore + 1),
        quality: Math.min(100, baseScore + 2),
        communication: Math.max(0, baseScore - 2),
        professionalism: Math.min(100, baseScore + 3),
        trustLevel: providerData.trustLevel,
        completedJobs,
        cancelledJobs: index % 4,
        avgResponseTime: 20 + index * 5,
      },
    });

    await seedProviderPortfolio(prisma, provider.id, categoryIds[0], index);
    await seedProviderBadges(prisma, trustScore.id, providerData.trustLevel, baseScore);

    if (providerData.verificationStatus === VerificationStatus.VERIFIED && index % 2 === 0) {
      await prisma.certification.create({
        data: {
          providerId: provider.id,
          title: `Certification ${providerData.profession}`,
          issuingOrg: "Ministere du Travail",
          certificateNum: `CERT-${index + 1000}`,
          status: VerificationStatus.VERIFIED,
          verifiedAt: daysFromNow(-30),
          issueDate: daysFromNow(-365),
          expiryDate: daysFromNow(365 * 2),
          categoryId: categoryIds[0],
          documents: {
            create: {
              type: "CERTIFICATE",
              fileUrl: `https://picsum.photos/seed/cert-${index}/1000/700`,
              fileName: `certification-${providerData.email}.pdf`,
            },
          },
        },
      });
    }

    created.push({
      userId: user.id,
      providerId: provider.id,
      profession: providerData.profession,
      bookingTitle: providerData.skills[0] ?? providerData.profession,
      bookingDescription: `Demande de ${providerData.profession.toLowerCase()} creee pour les donnees de demonstration.`,
      bookingDuration: 90 + (index % 4) * 30,
      bookingPrice: providerData.hourlyRate + index * 1000,
      trustScoreId: trustScore.id,
    });
  }

  return created;
}

async function seedProviderPortfolio(
  prisma: SeedPrismaClient,
  providerId: string,
  categoryId: string | undefined,
  index: number,
) {
  await prisma.portfolioItem.createMany({
    data: [0, 1, 2].map((itemIndex) => ({
      providerId,
      title: `Realisation ${itemIndex + 1}`,
      description: "Exemple de travail realise pour un client satisfait.",
      imageUrl: `https://picsum.photos/seed/kayou-provider-${index}-${itemIndex}/900/650`,
      order: itemIndex,
    })),
  });

  const project = await prisma.portfolioProject.create({
    data: {
      providerId,
      categoryId,
      title: "Projet reference",
      description: "Avant/apres d'une intervention recente.",
      duration: 8 + index,
      price: 75000 + index * 5000,
      isPublished: true,
      isFeatured: index % 3 === 0,
    },
  });

  await prisma.portfolioImage.createMany({
    data: [
      {
        projectId: project.id,
        imageType: PortfolioImageType.BEFORE,
        imageUrl: `https://picsum.photos/seed/kayou-before-${index}/900/650`,
        caption: "Avant intervention",
        displayOrder: 1,
      },
      {
        projectId: project.id,
        imageType: PortfolioImageType.AFTER,
        imageUrl: `https://picsum.photos/seed/kayou-after-${index}/900/650`,
        caption: "Apres intervention",
        displayOrder: 2,
      },
    ],
  });
}

async function seedProviderBadges(
  prisma: SeedPrismaClient,
  trustScoreId: string,
  trustLevel: TrustLevel,
  score: number,
) {
  const badges = new Set<BadgeType>();

  if (trustLevel !== TrustLevel.NEWCOMER) badges.add(BadgeType.ID_VERIFIED);
  if (score >= 75) badges.add(BadgeType.FAST_RESPONSE);
  if (score >= 85) {
    badges.add(BadgeType.QUALITY_WORK);
    badges.add(BadgeType.GREAT_COMMUNICATOR);
  }
  if (score >= 90) badges.add(BadgeType.PUNCTUAL);
  if (trustLevel === TrustLevel.TOP_RATED) {
    badges.add(BadgeType.CLIENT_FAVORITE);
    badges.add(BadgeType.CERTIFIED);
  }

  if (badges.size === 0) return;

  await prisma.providerBadge.createMany({
    data: Array.from(badges).map((badgeType) => ({
      providerId: trustScoreId,
      badgeType,
      isVisible: true,
    })),
  });
}

async function seedClients(prisma: SeedPrismaClient): Promise<CreatedClient[]> {
  const created: CreatedClient[] = [];

  for (const clientData of clientsData) {
    const user = await prisma.user.create({
      data: {
        authUserId: authSeedId(clientData.email),
        email: clientData.email,
        phone: clientData.phone,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        role: UserRole.CLIENT,
        roleSelectedAt: daysFromNow(-60),
        city: clientData.city,
        country: clientData.country,
        isVerified: clientData.isVerified,
        clientTrustLevel: clientData.clientTrustLevel,
        clientScore: scoreForClientTrustLevel(clientData.clientTrustLevel),
        emailVerifiedAt: clientData.isVerified ? daysFromNow(-60) : null,
        phoneVerifiedAt: clientData.isVerified ? daysFromNow(-60) : null,
      },
    });

    created.push({ userId: user.id, city: clientData.city });
  }

  return created;
}

async function seedAdmin(prisma: SeedPrismaClient) {
  return prisma.user.create({
    data: {
      authUserId: authSeedId("admin@kayou.cd"),
      email: "admin@kayou.cd",
      phone: "+243800000000",
      firstName: "Admin",
      lastName: "KAYOU",
      role: UserRole.ADMIN,
      roleSelectedAt: daysFromNow(-120),
      city: "Kinshasa",
      country: "RDC",
      isVerified: true,
      emailVerifiedAt: daysFromNow(-120),
      phoneVerifiedAt: daysFromNow(-120),
    },
  });
}

async function seedBookings(
  prisma: SeedPrismaClient,
  providers: CreatedProvider[],
  clients: CreatedClient[],
) {
  const bookings = [];

  for (let index = 0; index < 25; index += 1) {
    const provider = providers[index % providers.length];
    const client = clients[(index * 3) % clients.length];
    const status = statusCycle[index % statusCycle.length];
    const scheduledDate = daysFromNow(index - 12);

    const booking = await prisma.booking.create({
      data: {
        clientId: client.userId,
        providerId: provider.providerId,
        status,
        title: `${provider.bookingTitle} - intervention ${index + 1}`,
        description: provider.bookingDescription,
        address: `${100 + index}, Avenue de la Liberation`,
        city: client.city,
        scheduledDate,
        duration: provider.bookingDuration,
        price: provider.bookingPrice + index * 1000,
        clientNotes: index % 2 === 0 ? "Merci de confirmer votre disponibilite." : null,
        providerNotes: status === BookingStatus.PENDING ? null : "Intervention planifiee.",
        isPaid: status === BookingStatus.COMPLETED,
        paidAt: status === BookingStatus.COMPLETED ? daysFromNow(index - 11) : null,
        confirmedAt: status === BookingStatus.PENDING ? null : daysFromNow(index - 13),
        startedAt: status === BookingStatus.IN_PROGRESS || status === BookingStatus.COMPLETED ? scheduledDate : null,
        completedAt: status === BookingStatus.COMPLETED ? daysFromNow(index - 11) : null,
        cancelledAt: status === BookingStatus.CANCELLED ? daysFromNow(index - 10) : null,
        cancelReason: status === BookingStatus.CANCELLED ? "Report client" : null,
        cancelledBy: status === BookingStatus.CANCELLED ? client.userId : null,
      },
    });

    bookings.push({
      bookingId: booking.id,
      clientId: client.userId,
      providerId: provider.providerId,
      status,
    });
  }

  return bookings;
}

async function seedReviews(
  prisma: SeedPrismaClient,
  bookings: Awaited<ReturnType<typeof seedBookings>>,
) {
  const completedBookings = bookings.filter((booking) => booking.status === BookingStatus.COMPLETED);

  for (let index = 0; index < completedBookings.length; index += 1) {
    const booking = completedBookings[index];
    const punctuality = 4 + (index % 2);
    const quality = 4 + ((index + 1) % 2);
    const communication = 4;
    const value = 4;
    const professionalism = 5;
    const overallScore = (punctuality + quality + communication + value + professionalism) / 5;

    await prisma.review.create({
      data: {
        bookingId: booking.bookingId,
        clientId: booking.clientId,
        providerId: booking.providerId,
        punctuality,
        quality,
        communication,
        value,
        professionalism,
        overallScore,
        satisfactionTags: ["PONCTUEL", "PROFESSIONNEL", "RECOMMANDABLE"],
        comment: "Travail soigne, communication claire et resultat conforme a la demande.",
        isPublic: true,
      },
    });

    if (index % 2 === 0) {
      await prisma.clientReview.create({
        data: {
          bookingId: booking.bookingId,
          providerId: booking.providerId,
          clientId: booking.clientId,
          paymentTimeliness: PaymentRating.ONTIME,
          communication: 5,
          respectfulness: 5,
          tags: ["PONCTUEL", "CLAIR", "PAIEMENT_RAPIDE"],
          comment: "Client clair dans sa demande et paiement sans probleme.",
          isPublic: true,
        },
      });
    }
  }
}

async function seedFavorites(
  prisma: SeedPrismaClient,
  clients: CreatedClient[],
  providers: CreatedProvider[],
) {
  for (let index = 0; index < clients.length; index += 1) {
    await prisma.favorite.create({
      data: {
        userId: clients[index].userId,
        providerId: providers[index % providers.length].providerId,
      },
    });
  }
}

async function seedConversations(
  prisma: SeedPrismaClient,
  clients: CreatedClient[],
  providers: CreatedProvider[],
) {
  for (let index = 0; index < 8; index += 1) {
    const client = clients[index];
    const provider = providers[index];
    const conversation = await prisma.conversation.create({
      data: {
        user1Id: client.userId,
        user2Id: provider.userId,
        lastMessageAt: daysFromNow(-index),
      },
    });

    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderId: client.userId,
          content: "Bonjour, etes-vous disponible cette semaine ?",
          isRead: true,
          readAt: daysFromNow(-index),
          createdAt: daysFromNow(-index - 1),
        },
        {
          conversationId: conversation.id,
          senderId: provider.userId,
          content: "Bonjour, oui. Je peux passer demain pour evaluer le besoin.",
          isRead: index % 2 === 0,
          readAt: index % 2 === 0 ? daysFromNow(-index) : null,
          createdAt: daysFromNow(-index),
        },
      ],
    });
  }
}

async function seedNotifications(
  prisma: SeedPrismaClient,
  clients: CreatedClient[],
  providers: CreatedProvider[],
  adminId: string,
) {
  await prisma.notification.createMany({
    data: [
      {
        userId: adminId,
        type: NotificationType.SYSTEM,
        title: "Donnees de demonstration chargees",
        message: "Les donnees locales KAYOU sont pretes.",
        isRead: false,
      },
      ...clients.slice(0, 5).map((client, index) => ({
        userId: client.userId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: "Reservation confirmee",
        message: "Votre prestataire a confirme la reservation.",
        data: { demo: true, index },
        isRead: index % 2 === 0,
      })),
      ...providers.slice(0, 5).map((provider, index) => ({
        userId: provider.userId,
        type: NotificationType.NEW_MESSAGE,
        title: "Nouveau message",
        message: "Un client vous a envoye un message.",
        data: { demo: true, index },
        isRead: false,
      })),
    ],
  });
}

async function seedSettings(prisma: SeedPrismaClient) {
  const users = await prisma.user.findMany({ select: { id: true, role: true } });

  await prisma.visibilitySettings.createMany({
    data: users.map((user) => ({
      userId: user.id,
      profileVisible: "PUBLIC",
      showEmail: false,
      showPhone: user.role === UserRole.PROVIDER,
      showExactLocation: false,
      showHourlyRate: true,
      showPastWork: true,
      showReviews: true,
      showAvailability: true,
      showCertifications: true,
      showClientHistory: true,
      showClientReviews: true,
      allowDirectContact: true,
      allowMessages: true,
      appearInSearch: true,
      appearInCategory: true,
    })),
  });

  await prisma.systemSetting.createMany({
    data: [
      {
        key: "platform.currency",
        value: "CDF",
        description: "Default marketplace currency",
      },
      {
        key: "platform.countryScope",
        value: ["RDC", "Congo"],
        description: "Countries enabled for launch",
      },
    ],
  });
}
