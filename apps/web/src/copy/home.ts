// Home copy (workstream 05). Admin site settings override the hero, how-it-works and premium strings.

export const homeCopy = {
  meta: {
    title: "KAYOU — Trouvez le bon professionnel près de chez vous",
  },
  hero: {
    location: "RDC · Congo-Brazzaville",
    title: "Trouvez le bon professionnel près de chez vous",
    subtitle:
      "Plombiers, électriciens, peintres, coiffeurs, garde d'enfants et plus encore, partout en RDC et au Congo-Brazzaville.",
    searchPlaceholder: "Quel service recherchez-vous ?",
    searchLabel: "Rechercher un service",
    cta: "Rechercher",
    trustVerified: "Vérifié",
    trustReviews: "Avis clients",
    trustMadeBefore: "Fait avec",
    trustMadeAfter: "pour l'Afrique",
    photoAlt: "Un artisan au travail dans son atelier",
    ratingChipTitle: "KAYOU",
    ratingChipSubtitle: "Avis clients",
  },
  stats: {
    categories: "Familles de talents",
    countries: "Pays connectés",
    cities: "Kinshasa · Brazzaville",
    citiesLabel: "Villes ouvertes",
    local: "100 %",
    localLabel: "Talents locaux",
    unavailable: "—",
  },
  categories: {
    eyebrow: "Explorez par catégorie",
    title: "Un talent pour chaque besoin",
    subtitle: "Dix-neuf familles de services, des profils vérifiés et des avis clients réels.",
    explore: "Explorer",
    viewAll: "Voir tous les services",
  },
  how: {
    eyebrow: "Comment ça marche",
    title: "Trois étapes, un professionnel chez vous",
    step: (n: number) => `Étape ${n}`,
    steps: [
      {
        title: "Cherchez",
        description: "Décrivez votre besoin, choisissez votre ville et comparez les profils.",
      },
      {
        title: "Vérifiez",
        description: "Consultez les avis, les réalisations et le badge de vérification.",
      },
      {
        title: "Contactez",
        description: "Envoyez un message, appelez ou réservez un créneau en quelques secondes.",
      },
    ],
  },
  premium: {
    title: "Vous êtes prestataire ? Faites briller votre talent.",
    subtitle:
      "Publiez votre profil gratuitement, présentez vos réalisations et recevez des demandes de clients près de chez vous.",
    cta: "Découvrir Premium",
    tiers: {
      verified: "Vérifié",
      boosted: "Boosté",
      elite: "Elite",
    },
  },
} as const;
