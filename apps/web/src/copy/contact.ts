// Contact page copy (workstream 05).

export const contactCopy = {
  meta: {
    title: "Nous contacter",
    description: "Une question, une remarque ou un besoin ? Écrivez à l'équipe KAYOU.",
  },
  back: "Retour",
  title: "Nous contacter",
  subtitle: "Une question, une remarque ou un besoin ? Écrivez-nous, nous vous répondons rapidement.",
  channels: {
    phone: "Téléphone",
    email: "Email",
    website: "Site web",
    zone: "Zone",
    zoneValue: "Kinshasa, RDC · Congo-Brazzaville",
    fallbackPhone: "+243 000 000 000",
    fallbackEmail: "contact@kayou.app",
    fallbackWebsite: "www.kayou.app",
  },
  form: {
    name: "Nom complet",
    namePlaceholder: "Votre nom",
    phone: "Téléphone",
    phonePlaceholder: "+243 …",
    email: "Email",
    emailPlaceholder: "vous@exemple.com",
    subject: "Sujet",
    subjectPlaceholder: "Objet de votre message",
    message: "Message",
    messagePlaceholder: "Décrivez votre demande…",
    required: "obligatoire",
    submit: "Envoyer le message",
    submitting: "Envoi en cours…",
  },
  errors: {
    name: "Indiquez votre nom (2 caractères minimum).",
    email: "Adresse e-mail invalide.",
    subject: "Indiquez un sujet (3 caractères minimum).",
    message: "Votre message doit contenir au moins 10 caractères.",
    rateLimited: "Trop de messages, réessayez plus tard.",
  },
  success: {
    title: "Message envoyé !",
    body: "Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.",
    again: "Envoyer un autre message",
  },
} as const;
