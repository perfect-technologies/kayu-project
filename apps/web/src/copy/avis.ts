// Client reviews copy (workstream 07): /avis.

export const avisCopy = {
  meta: {
    title: "Mes avis",
    description: "Retrouvez les avis que vous avez laissés et les prestations à évaluer.",
  },
  title: "Mes avis",
  subtitle: "Vos retours aident la communauté KAYOU.",
  backLabel: "Retour à mon compte",
  summary: {
    given: (count: number) => (count === 1 ? "1 avis laissé" : `${count} avis laissés`),
    average: "note moyenne donnée",
    none: "—",
  },
  toReview: {
    title: "À évaluer",
    action: "Évaluer",
    serviceOn: (date: string) => `Prestation du ${date}`,
    empty: "Aucune prestation en attente d'évaluation.",
  },
  published: {
    title: "Avis publiés",
    serviceOn: (date: string) => `Service du ${date}`,
    reply: "Réponse du prestataire",
    empty: "Vous n'avez encore laissé aucun avis.",
    emptyAction: "Rechercher un prestataire",
  },
} as const;
