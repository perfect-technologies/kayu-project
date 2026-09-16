// Address book copy (workstream 07): /adresses.

export const adressesCopy = {
  meta: {
    title: "Mes adresses",
    description: "Gérez vos adresses d'intervention enregistrées.",
  },
  title: "Mes adresses",
  subtitle: (count: number) => (count === 1 ? "1 adresse enregistrée" : `${count} adresse(s) enregistrée(s)`),
  backLabel: "Retour à mon compte",
  add: "Ajouter une adresse",
  labels: {
    HOME: "Domicile",
    WORK: "Travail",
    OTHER: "Autre",
  },
  default: "Par défaut",
  setDefault: "Définir par défaut",
  edit: "Modifier",
  remove: "Supprimer",
  empty: {
    title: "Aucune adresse enregistrée",
    description: "Ajoutez une adresse pour réserver plus vite.",
  },
  sheet: {
    createTitle: "Nouvelle adresse",
    editTitle: "Modifier l'adresse",
    type: "Type d'adresse",
    recipient: "Destinataire",
    recipientPlaceholder: "Ex : Maman, Bureau Gombe",
    addressLabel: "Adresse",
    addressPlaceholder: "Rue, numéro, repère…",
    location: "Localisation",
    submitCreate: "Enregistrer",
    submitUpdate: "Mettre à jour",
    addressRequired: "Indiquez une adresse.",
  },
  confirmDelete: {
    title: "Supprimer cette adresse ?",
    description: "Cette action est définitive.",
    confirm: "Supprimer",
  },
  toasts: {
    created: "Adresse enregistrée",
    updated: "Adresse mise à jour",
    deleted: "Adresse supprimée",
    defaultSet: "Adresse par défaut mise à jour",
  },
} as const;
