// Help centre copy (workstream 07): /aide.

export const aideCopy = {
  meta: {
    title: "Aide",
    description: "Réponses aux questions fréquentes sur KAYOU.",
  },
  title: "Comment pouvons-nous vous aider ?",
  searchLabel: "Rechercher une question",
  searchPlaceholder: "Rechercher une question",
  shortcuts: {
    title: "Raccourcis",
    orders: "Mes commandes",
    space: "Mon espace",
    messages: "Messages",
    book: "Réserver",
    account: "Compte",
  },
  faq: {
    title: "FAQ",
    noResult: "Aucune question ne correspond à votre recherche.",
    items: [
      {
        question: "Comment réserver ?",
        answer:
          "Recherchez un prestataire par service et par lieu, ouvrez son profil, puis choisissez un créneau dans son planning. Le prestataire confirme ensuite la réservation depuis son espace.",
      },
      {
        question: "Comment annuler une réservation ?",
        answer:
          "Ouvrez « Mes commandes », sélectionnez la réservation en attente ou confirmée puis appuyez sur « Annuler ». Le prestataire est prévenu immédiatement.",
      },
      {
        question: "Comment contacter un prestataire ?",
        answer:
          "Depuis son profil, envoyez-lui un message dans l'application. Une fois connecté, vous pouvez aussi l'appeler ou lui écrire sur WhatsApp lorsque ses coordonnées sont visibles.",
      },
      {
        question: "Comment signaler un problème ?",
        answer:
          "Sur un profil ou dans une conversation, utilisez « Signaler ». Vous pouvez aussi bloquer un utilisateur : il ne pourra plus vous écrire ni réserver avec vous. Notre équipe examine chaque signalement.",
      },
      {
        question: "Comment supprimer mon compte ?",
        answer:
          "Dans « Mon compte », section « Sécurité & contrôle », appuyez sur « Supprimer mon compte » et confirmez. Vos données personnelles sont effacées et vous êtes déconnecté.",
      },
      {
        question: "Que signifie le badge « Vérifié » ?",
        answer:
          "Un prestataire vérifié a fourni une pièce d'identité, un selfie et un justificatif d'adresse examinés par l'équipe KAYOU. C'est un gage de confiance supplémentaire, pas une garantie de service.",
      },
    ],
  },
  support: {
    title: "Besoin d'aide maintenant ?",
    description: "Notre équipe vous répond du lundi au samedi.",
    action: "Nous contacter",
  },
} as const;
