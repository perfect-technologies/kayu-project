// Copy shared by the signed-in spaces (workstream 07): status pills, common actions, shared blocks.

export const spacesCopy = {
  back: "Retour",
  retry: "Réessayer",
  errorTitle: "Impossible de charger cette page.",
  seeAll: "Voir tout",
  seeLess: "Réduire",
  close: "Fermer",
  cancel: "Annuler",
  confirm: "Confirmer",
  save: "Enregistrer",
  saving: "Enregistrement…",
  loading: "Chargement",
  status: {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
  },
  rating: (avg: number, count: number) => `★ ${avg.toFixed(1)} · ${count === 1 ? "1 avis" : `${count} avis`}`,
} as const;
