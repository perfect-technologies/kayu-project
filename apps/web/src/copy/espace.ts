// Provider space copy (workstream 07): /mon-espace and components/espace/*.

export const espaceCopy = {
  meta: {
    title: "Mon espace",
    description: "Gérez vos demandes, votre disponibilité et vos réservations sur KAYOU.",
  },
  greeting: {
    hello: "Bonjour,",
    fallbackName: "Prestataire",
    available: "Disponible",
    unavailable: "Indisponible",
    notifications: "Notifications",
  },
  banner: {
    visibleTitle: "Vous êtes visible par les clients",
    visibleSubtitle: "Plus de demandes, plus d'opportunités !",
    hiddenTitle: "Vous êtes masqué",
    hiddenSubtitle: "Les clients ne peuvent pas vous trouver pour le moment.",
    adminHiddenSubtitle: "Votre profil a été masqué par un administrateur.",
    goUnavailable: "Passer indisponible",
    goAvailable: "Passer disponible",
    toastAvailable: "Vous êtes de nouveau disponible.",
    toastUnavailable: "Vous êtes indisponible.",
  },
  metrics: {
    pending: { label: "Demandes", sub: "à traiter" },
    completed: { label: "Terminées", sub: "au total" },
    rating: { label: "Note moyenne", sub: (count: number) => (count === 1 ? "1 avis" : `${count} avis`) },
    noRating: "—",
  },
  requests: {
    title: "Nouvelles demandes",
    empty: "Aucune réservation pour l'instant.",
    expand: "Voir la demande",
    collapse: "Réduire la demande",
    phone: "Téléphone",
    notes: "Notes du client",
    noNotes: "Aucune note.",
    clientRating: (avg: number, count: number) => `${avg.toFixed(1)} · ${count === 1 ? "1 avis" : `${count} avis`}`,
    newClient: "Nouveau client",
  },
  profile: {
    title: "Mon profil",
    edit: "Modifier",
    view: "Voir mon profil public",
    noRating: "Pas encore de note",
  },
  history: {
    title: "Réservations reçues",
    empty: "Aucune réservation terminée ou confirmée pour l'instant.",
  },
  noProvider: {
    title: "Créer mon profil",
    description: "Publiez votre profil prestataire pour recevoir des demandes.",
    action: "Créer mon profil",
  },
} as const;
