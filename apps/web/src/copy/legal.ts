// Legal copy (workstream 05): CGU and privacy. The legal entity line is a placeholder until the owner
// confirms the registered name (see PROGRESS open questions).

export type LegalSection = {
  n: number;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const EDITOR = "KAYOU";

export const cguCopy = {
  meta: {
    title: "Conditions générales d'utilisation",
    description: "Les conditions d'utilisation de la plateforme KAYOU.",
  },
  back: "Retour à l'accueil",
  title: "Conditions générales d'utilisation",
  editorLine: `${EDITOR} — Kinshasa, République démocratique du Congo`,
  editorLabel: "Éditeur :",
  print: "Imprimer / Exporter en PDF",
  copyright: (year: number) => `© ${year} ${EDITOR}. Tous droits réservés.`,
  sections: [
    {
      n: 1,
      title: "Identification de l'éditeur",
      paragraphs: [
        `${EDITOR} édite et exploite la plateforme KAYOU, accessible sur le web et sur mobile. Son siège est établi à Kinshasa, en République démocratique du Congo. ${EDITOR} fournit un service de mise en relation entre des clients qui recherchent une prestation et des prestataires de services indépendants ou professionnels.`,
      ],
    },
    {
      n: 2,
      title: "Objet des CGU",
      paragraphs: [
        "Les présentes conditions générales d'utilisation (« CGU ») définissent les conditions d'accès et d'utilisation de KAYOU pour l'ensemble des utilisateurs : clients, prestataires et visiteurs. Elles précisent les droits et obligations de chacun ainsi que les règles applicables à l'inscription, à la mise en relation et à la publication de contenus.",
        "Elles s'appliquent sans préjudice des dispositions impératives en vigueur, notamment en matière de commerce électronique, de protection des données personnelles et de protection des consommateurs dans les pays où le service est proposé.",
      ],
    },
    {
      n: 3,
      title: "Acceptation des CGU",
      paragraphs: [
        "L'utilisation de KAYOU implique l'acceptation des CGU. En créant un compte ou en utilisant le service, l'utilisateur déclare :",
      ],
      bullets: [
        "disposer de la capacité juridique pour conclure un contrat ;",
        "avoir pris connaissance des CGU et de la politique de confidentialité ;",
        `accepter que ${EDITOR} puisse faire évoluer les CGU. Toute modification substantielle est portée à la connaissance de l'utilisateur avant son entrée en vigueur. S'il refuse les nouvelles conditions, il cesse d'utiliser le service et peut supprimer son compte.`,
      ],
    },
    {
      n: 4,
      title: "Rôle et responsabilité de KAYOU",
      paragraphs: [
        `Intermédiaire technique : KAYOU met en relation des clients et des prestataires. ${EDITOR} n'est pas partie aux contrats de prestation conclus entre eux et n'exécute pas les prestations. Chaque utilisateur reste responsable des engagements qu'il prend et du respect de la loi.`,
        `Vérification des utilisateurs : ${EDITOR} peut mettre en œuvre des procédures de vérification, notamment le contrôle de pièces d'identité ou de justificatifs professionnels. Ces procédures ne garantissent ni l'identité, ni la solvabilité, ni les compétences, ni la bonne foi d'un utilisateur. Avant d'accepter une prestation, chacun effectue les vérifications raisonnables adaptées à la situation.`,
        `Signalement et modération : en cas de comportement suspect, les utilisateurs peuvent signaler un compte ou un contenu depuis l'application. ${EDITOR} examine le signalement et peut avertir, suspendre ou supprimer le compte concerné selon la gravité des faits, dans le respect des droits de la défense lorsque la loi l'exige.`,
        `Limitation de responsabilité : ${EDITOR} met en œuvre des moyens raisonnables pour assurer le fonctionnement et la sécurité de la plateforme sans garantir une disponibilité continue. Dans les limites permises par la loi, sa responsabilité est limitée aux dommages directs résultant d'un manquement qui lui est imputable.`,
      ],
    },
    {
      n: 5,
      title: "Inscription et gestion de compte",
      paragraphs: [
        "Création de compte : l'inscription se fait par numéro de téléphone. L'utilisateur fournit des informations exactes (nom, téléphone, localisation) et, pour les prestataires, la description de son activité, ses compétences et, le cas échéant, un tarif indicatif. Des justificatifs peuvent être demandés et une inscription refusée pour un motif légitime.",
        "Sécurité du compte : l'utilisateur conserve ses moyens d'identification sous son contrôle, notamment l'accès à son numéro de téléphone, et signale sans délai toute utilisation non autorisée de son compte.",
        `Mise à jour des informations : l'utilisateur maintient ses informations à jour. En cas d'informations fausses ou périmées, ${EDITOR} peut suspendre ou supprimer le compte.`,
        `Résiliation : l'utilisateur peut supprimer son compte à tout moment depuis la rubrique Compte. ${EDITOR} peut suspendre ou résilier un compte en cas de violation grave ou répétée des CGU ou de la loi. La résiliation entraîne la suppression ou l'anonymisation des données qui ne sont plus nécessaires, sous réserve des durées de conservation imposées ou permises par la loi.`,
      ],
    },
    {
      n: 6,
      title: "Fonctionnement de la mise en relation",
      paragraphs: [
        "Recherche de prestataires : les clients recherchent par type de service, lieu, note et disponibilité. Les résultats sont ordonnés selon des critères de pertinence qui peuvent tenir compte du statut du prestataire (gratuit ou premium). Les informations publiées sur les profils sont fournies par les utilisateurs et ne sont pas vérifiées en temps réel.",
        `Réservation et paiement : les conditions et les tarifs des prestations sont fixés librement par les prestataires. Aucun paiement ne transite par KAYOU : le règlement se fait directement entre le client et le prestataire, en espèces ou par le moyen qu'ils conviennent. Dans les limites permises par la loi, ${EDITOR} n'est pas responsable d'un litige ou d'un défaut de paiement.`,
        "Prestation : une fois la réservation confirmée, la relation contractuelle lie exclusivement le client et le prestataire. Ils sont responsables du respect de leurs obligations, des délais convenus et de la qualité du service.",
        `Évaluations : après une prestation terminée, le client peut laisser une note et un commentaire, et le prestataire peut noter le client. Les avis doivent être sincères et ne pas contenir de propos diffamatoires, discriminatoires, injurieux ou illicites. ${EDITOR} peut masquer ou supprimer un avis contraire aux CGU ou à la loi.`,
      ],
    },
    {
      n: 7,
      title: "Obligations des prestataires",
      paragraphs: [
        "Respect des lois : le prestataire s'assure que son activité est autorisée et respecte les règles applicables, notamment en matière de fiscalité, de sécurité, d'hygiène et de protection des consommateurs. Il obtient les licences, permis et assurances requis.",
        "Qualité du service : le prestataire fournit un service conforme à ce qui a été convenu, dans les délais et selon les règles de l'art. Il honore les réservations confirmées ou les annule en indiquant un motif.",
        `Responsabilité : le prestataire est responsable des dommages causés au client par une prestation mal exécutée ou non conforme. Dans les limites permises par la loi, il garantit ${EDITOR} contre les réclamations de tiers résultant d'un manquement à ses obligations.`,
      ],
    },
    {
      n: 8,
      title: "Obligations des clients",
      paragraphs: [
        `Vérification et diligence : le client vérifie l'aptitude du prestataire à réaliser la prestation (compétences, expérience, références). Les vérifications réalisées par ${EDITOR} ne garantissent pas l'exactitude de toutes les informations fournies par les prestataires.`,
        "Paiement : le client règle le prix convenu selon les modalités convenues avec le prestataire.",
        "Comportement : le client adopte un comportement respectueux, fournit des informations claires et n'annule pas abusivement les prestations réservées.",
      ],
    },
    {
      n: 9,
      title: "Publication de contenus et propriété intellectuelle",
      paragraphs: [
        `Contenus des utilisateurs : les textes, photos, vidéos et avis publiés sur KAYOU respectent la loi et les droits d'autrui, notamment la vie privée, le droit à l'image et la propriété intellectuelle. L'utilisateur garantit disposer des droits nécessaires. Il conserve la propriété de ses contenus et accorde à ${EDITOR} une licence gratuite et non exclusive, limitée à l'hébergement, à la reproduction et à la diffusion nécessaires à l'exploitation et à la promotion du service, pendant la durée de leur publication.`,
        `Propriété de la plateforme : KAYOU, son interface, son nom, son logo, ses logiciels et ses bases de données sont protégés par les droits de propriété intellectuelle. Toute reproduction ou exploitation non autorisée est interdite.`,
      ],
    },
    {
      n: 10,
      title: "Données personnelles et confidentialité",
      paragraphs: [
        `Le traitement des données personnelles par ${EDITOR} est décrit dans la politique de confidentialité, qui précise les finalités, les destinataires, les durées de conservation et les modalités d'exercice des droits. Les utilisateurs disposent des droits reconnus par la loi applicable, notamment les droits d'accès, de rectification, d'effacement et d'opposition.`,
      ],
    },
    {
      n: 11,
      title: "Signalement et contentieux",
      paragraphs: [
        `Signalement : tout utilisateur peut signaler un comportement abusif, un compte suspect ou une information erronée depuis l'application. ${EDITOR} étudie chaque signalement et peut prendre les mesures appropriées.`,
        `Litiges entre utilisateurs : les litiges relatifs à une prestation sont d'abord réglés à l'amiable entre le client et le prestataire, puis, si nécessaire, par médiation, conciliation ou toute voie de recours prévue par la loi. ${EDITOR} n'est pas partie au contrat de prestation.`,
        "Recours : chaque utilisateur peut saisir l'autorité administrative ou judiciaire compétente dans son pays. Les présentes CGU ne privent pas les consommateurs des protections impératives que leur accorde la loi.",
      ],
    },
    {
      n: 12,
      title: "Droit applicable et juridiction compétente",
      paragraphs: [
        `Les présentes CGU sont régies par le droit de la République démocratique du Congo. Pour les utilisateurs situés dans un autre pays où KAYOU est proposé, les dispositions impératives de ce pays restent applicables. Tout litige est soumis aux juridictions compétentes selon les règles de procédure applicables ; lorsqu'une clause attributive de juridiction est autorisée, les tribunaux du ressort du siège de ${EDITOR} sont compétents.`,
      ],
    },
  ] satisfies LegalSection[],
} as const;

export const privacyCopy = {
  meta: {
    title: "Politique de confidentialité",
    description: "Ce que KAYOU fait de vos données, et comment vous gardez le contrôle.",
  },
  title: "Vos données. Votre contrôle.",
  editor: EDITOR,
  sections: [
    {
      title: "Ce que nous utilisons",
      body: "Votre nom, votre numéro de téléphone et vos informations de profil servent à gérer votre compte. Les réservations, avis et conversations servent à la mise en relation. Votre position n'est demandée que lorsque vous cherchez des services à proximité.",
    },
    {
      title: "Vos fichiers",
      body: "Les photos publiées sur un profil prestataire sont publiques. Les pièces jointes des conversations ne sont accessibles qu'aux participants et aux administrateurs chargés de la modération.",
    },
    {
      title: "Votre sécurité",
      body: "La connexion se fait par code envoyé sur votre téléphone : aucun mot de passe n'est stocké. Les sessions sont révocables. Les actions administratives sont journalisées. Vous pouvez signaler un contenu et bloquer un utilisateur à tout moment.",
    },
    {
      title: "Supprimer votre compte",
      body: "Depuis Compte → Supprimer mon compte, confirmez la suppression pour effacer votre compte et les données associées. Cette action est définitive. Les sauvegardes techniques peuvent conserver des copies jusqu'à leur expiration.",
    },
    {
      title: "Nous contacter",
      body: "Utilisez le formulaire de contact pour toute question sur vos données ou pour exercer vos droits.",
    },
  ],
  manage: "Gérer mon compte",
  contact: "Contact",
} as const;
