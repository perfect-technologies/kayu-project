// Notifications copy (workstream 07): /notifications.

export const notificationsCopy = {
  meta: {
    title: "Notifications",
    description: "Vos dernières activités sur KAYOU.",
  },
  title: "Notifications",
  subtitle: (count: number) => (count === 1 ? "1 activité récente" : `${count} activité(s) récente(s)`),
  backLabel: "Retour",
  markAllRead: "Tout marquer lu",
  unread: "Non lue",
  empty: {
    title: "Aucune notification",
    description: "Vous serez prévenu ici des messages, réservations et avis.",
    action: "Retour à l'accueil",
  },
  more: "Voir plus",
  bellLabel: "Notifications",
} as const;
