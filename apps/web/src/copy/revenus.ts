// Earnings copy (workstream 07): /revenus.

export const revenusCopy = {
  meta: {
    title: "Mes revenus",
    description: "Suivez vos gains nets et vos transactions récentes sur KAYOU.",
  },
  title: "Mes revenus",
  backLabel: "Retour à mon espace",
  period: "Cette semaine",
  hero: {
    total: "Total gagné",
    caption: "Net après commission",
  },
  days: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  chartLabel: "Gains nets par jour de la semaine",
  metrics: {
    interventions: { label: "interventions", sub: "cette semaine" },
    acceptance: { label: "acceptation", sub: "des demandes" },
    rating: { label: "note moyenne", sub: (count: number) => `sur ${count === 1 ? "1 avis" : `${count} avis`}` },
    none: "—",
  },
  transactions: {
    title: "Transactions récentes",
    seeAll: "Voir tout",
    seeLess: "Réduire",
    more: "Voir plus",
    empty: "Aucune transaction",
    fallbackLabel: "Prestation",
    bonus: "Bonus",
    open: (label: string) => `Ouvrir la réservation ${label}`,
  },
  withdraw: "Retirer mes gains",
  withdrawSoon: "Bientôt disponible",
} as const;
