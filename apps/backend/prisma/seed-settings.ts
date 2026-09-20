import type { PrismaClient } from "@prisma/client";

type SeedPrismaClient = Pick<PrismaClient, "systemSetting">;

// Empty strings mean "use the copy module default" on the web.
export const siteSettings: Array<{
  key: string;
  value: string | boolean | number;
  description: string;
}> = [
  { key: "hero_title", value: "", description: "Accueil : titre du hero" },
  { key: "hero_subtitle", value: "", description: "Accueil : sous-titre du hero" },
  { key: "hero_cta", value: "", description: "Accueil : libellé du bouton du hero" },
  { key: "tagline", value: "", description: "Slogan du site" },
  { key: "how1_title", value: "", description: "Comment ça marche : étape 1, titre" },
  { key: "how1_desc", value: "", description: "Comment ça marche : étape 1, description" },
  { key: "how2_title", value: "", description: "Comment ça marche : étape 2, titre" },
  { key: "how2_desc", value: "", description: "Comment ça marche : étape 2, description" },
  { key: "how3_title", value: "", description: "Comment ça marche : étape 3, titre" },
  { key: "how3_desc", value: "", description: "Comment ça marche : étape 3, description" },
  { key: "premium_title", value: "", description: "Bloc Premium : titre" },
  { key: "premium_subtitle", value: "", description: "Bloc Premium : sous-titre" },
  { key: "feat_booking", value: true, description: "Fonction : réservation de créneaux" },
  { key: "feat_reviews", value: true, description: "Fonction : avis clients" },
  { key: "feat_whatsapp", value: true, description: "Fonction : contact WhatsApp" },
  { key: "feat_jev_search", value: false, description: "Fonction : recherche comprise par Jev (TypeSafe)" },
  {
    key: "contacts_require_premium",
    value: false,
    description: "Coordonnées visibles uniquement pour les prestataires non FREE",
  },
  { key: "maintenance_mode", value: false, description: "Mode maintenance" },
  { key: "maintenance_message", value: "", description: "Message du bandeau de maintenance" },
  { key: "contact_phone", value: "", description: "Contact public : téléphone" },
  { key: "contact_email", value: "", description: "Contact public : e-mail" },
  { key: "contact_website", value: "", description: "Contact public : site web" },
  { key: "agent.maxStepsPerTurn", value: 8, description: "Assistant : étapes modèle maximum par tour" },
  { key: "agent.maxMessagesPerConversation", value: 60, description: "Assistant : messages maximum par conversation" },
  { key: "agent.maxTurnsPerUserPerDay", value: 30, description: "Assistant : tours maximum par client et par jour" },
  { key: "agent.autoArchiveDays", value: 30, description: "Assistant : archivage automatique après ce nombre de jours sans message (0 = jamais)" },
  { key: "agent.resumeWindowHours", value: 12, description: "Assistant : reprise de la dernière conversation si elle a moins de ce nombre d'heures (0 = toujours une nouvelle)" },
];

export async function seedSettings(prisma: SeedPrismaClient) {
  console.log("Seeding site settings...");

  await prisma.systemSetting.createMany({ data: siteSettings });

  console.log(`Seeded ${await prisma.systemSetting.count()} site settings.`);
}
