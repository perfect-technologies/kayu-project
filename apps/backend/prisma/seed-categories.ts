import type { PrismaClient } from "@prisma/client";

type SeedPrismaClient = Pick<PrismaClient, "category" | "subcategory">;

export type TaxonomyNode = {
  slug: string;
  name: string;
  subs?: TaxonomyNode[];
};

type TaxonomyCategory = TaxonomyNode & {
  icon: string;
  color: string;
};

// Tree, slugs, Lucide icons and colours follow K-YOU shared/taxonomy.json and
// src/lib/taxonomy.jsx. K-YOU reuses three level-3 slugs across branches, so
// they carry their parent prefix here (maquillage_mariage, traiteur_mariage,
// peinture_decoration) because Subcategory.slug is globally unique.
export const taxonomy: TaxonomyCategory[] = [
  {
    slug: "batiment_construction",
    name: "Bâtiment & Construction",
    icon: "Hammer",
    color: "bg-amber-500",
    subs: [
      {
        slug: "plomberie",
        name: "Plomberie",
        subs: [
          { slug: "installation_sanitaire", name: "Installation sanitaire" },
          { slug: "depannage_fuite", name: "Dépannage & fuites" },
          { slug: "chauffe_eau", name: "Chauffe-eau" },
          { slug: "assainissement", name: "Assainissement" },
        ],
      },
      {
        slug: "electricite",
        name: "Électricité",
        subs: [
          { slug: "installation_electrique", name: "Installation électrique" },
          { slug: "depannage_electrique", name: "Dépannage électrique" },
          { slug: "eclairage", name: "Éclairage" },
          { slug: "comptage", name: "Comptage & raccordement" },
        ],
      },
      {
        slug: "maconnerie",
        name: "Maçonnerie",
        subs: [
          { slug: "fondations", name: "Fondations" },
          { slug: "elevation_murs", name: "Élévation de murs" },
          { slug: "chape", name: "Chape & dallage" },
        ],
      },
      {
        slug: "menuiserie",
        name: "Menuiserie",
        subs: [
          { slug: "menuiserie_bois", name: "Menuiserie bois" },
          { slug: "metallique_soudure", name: "Métallique & soudure" },
          { slug: "alu_pvc", name: "Alu & PVC" },
        ],
      },
      {
        slug: "peinture",
        name: "Peinture",
        subs: [
          { slug: "peinture_interieure", name: "Peinture intérieure" },
          { slug: "peinture_exterieure", name: "Peinture extérieure" },
          { slug: "peinture_decoration", name: "Décoration" },
          { slug: "enduits", name: "Enduits" },
        ],
      },
      { slug: "carrelage", name: "Carrelage & Faïence" },
      {
        slug: "climatisation",
        name: "Climatisation & Froid",
        subs: [
          { slug: "installation_clim", name: "Installation" },
          { slug: "maintenance_clim", name: "Maintenance & recharge" },
          { slug: "froid_commercial", name: "Froid commercial" },
        ],
      },
      { slug: "toiture", name: "Toiture & Couverture" },
      { slug: "terrassement", name: "Terrassement & VRD" },
      { slug: "vitrerie", name: "Vitrerie & Miroiterie" },
      {
        slug: "architecture",
        name: "Architecture & Études",
        subs: [
          { slug: "plans", name: "Plans & devis" },
          { slug: "suivi_chantier", name: "Suivi de chantier" },
        ],
      },
      { slug: "genie_civil", name: "Génie civil" },
    ],
  },
  {
    slug: "beaute_bien_etre",
    name: "Beauté & Bien-être",
    icon: "Sparkles",
    color: "bg-pink-500",
    subs: [
      {
        slug: "coiffure",
        name: "Coiffure",
        subs: [
          { slug: "coiffure_femme", name: "Femme" },
          { slug: "coiffure_homme", name: "Homme" },
          { slug: "coiffure_enfant", name: "Enfant" },
          { slug: "tresses_tissages", name: "Tresses & tissages" },
        ],
      },
      {
        slug: "onglerie",
        name: "Onglerie",
        subs: [
          { slug: "manucure", name: "Manucure" },
          { slug: "prothese_ongles", name: "Prothèses d'ongles" },
          { slug: "vernis_semi_permanent", name: "Vernis semi-permanent" },
        ],
      },
      {
        slug: "maquillage",
        name: "Maquillage",
        subs: [
          { slug: "maquillage_mariage", name: "Mariée" },
          { slug: "soiree", name: "Soirée" },
          { slug: "professionnel", name: "Professionnel" },
        ],
      },
      {
        slug: "esthetique",
        name: "Esthétique & Soins visage",
        subs: [
          { slug: "soins_visage", name: "Soins du visage" },
          { slug: "gommage", name: "Gommage" },
          { slug: "epilation", name: "Épilation" },
        ],
      },
      {
        slug: "spa_massage",
        name: "Spa & Massage",
        subs: [
          { slug: "massage_relaxant", name: "Massage relaxant" },
          { slug: "massage_therapeutique", name: "Massage thérapeutique" },
          { slug: "soins_corps", name: "Soins du corps" },
        ],
      },
      { slug: "barbier", name: "Barbier" },
    ],
  },
  {
    slug: "cuisine_restauration",
    name: "Cuisine & Restauration",
    icon: "ChefHat",
    color: "bg-orange-500",
    subs: [
      {
        slug: "traiteur",
        name: "Traiteur",
        subs: [
          { slug: "traiteur_mariage", name: "Mariage" },
          { slug: "anniversaire", name: "Anniversaire" },
          { slug: "evenements", name: "Événements" },
        ],
      },
      { slug: "cuisinier_domicile", name: "Cuisinier à domicile" },
      {
        slug: "patisserie",
        name: "Pâtisserie",
        subs: [
          { slug: "gateaux", name: "Gâteaux" },
          { slug: "viennoiserie", name: "Viennoiserie" },
        ],
      },
      { slug: "boulangerie", name: "Boulangerie" },
      { slug: "plats_emporter", name: "Plats à emporter" },
      { slug: "restauration_evenementielle", name: "Restauration événementielle" },
    ],
  },
  {
    slug: "maison_entretien",
    name: "Maison & Entretien",
    icon: "House",
    color: "bg-teal-500",
    subs: [
      {
        slug: "menage",
        name: "Ménage",
        subs: [
          { slug: "menage_regulier", name: "Ménage régulier" },
          { slug: "grand_menage", name: "Grand ménage" },
          { slug: "fin_chantier", name: "Fin de chantier" },
        ],
      },
      { slug: "blanchisserie", name: "Blanchisserie & Pressing" },
      {
        slug: "jardinage",
        name: "Jardinage",
        subs: [
          { slug: "entretien_jardin", name: "Entretien" },
          { slug: "paysagisme", name: "Paysagisme" },
          { slug: "elagage", name: "Élagage" },
        ],
      },
      { slug: "desinsectisation", name: "Désinsectisation & Dératisation" },
      { slug: "conciergerie", name: "Conciergerie" },
    ],
  },
  {
    slug: "garde_assistance",
    name: "Garde & Assistance",
    icon: "HeartHandshake",
    color: "bg-rose-500",
    subs: [
      {
        slug: "garde_enfants",
        name: "Garde d'enfants",
        subs: [
          { slug: "nounou", name: "Nounou" },
          { slug: "garde_partagee", name: "Garde partagée" },
          { slug: "sorties_ecole", name: "Sorties d'école" },
        ],
      },
      { slug: "garde_personnes_agees", name: "Garde personnes âgées" },
      { slug: "aide_domicile", name: "Aide à domicile" },
      { slug: "assistance_pmr", name: "Assistance PMR" },
    ],
  },
  {
    slug: "transport_logistique",
    name: "Transport & Logistique",
    icon: "Truck",
    color: "bg-blue-500",
    subs: [
      {
        slug: "transport_personnes",
        name: "Transport de personnes",
        subs: [
          { slug: "taxi", name: "Taxi" },
          { slug: "vtc", name: "VTC" },
          { slug: "navette", name: "Navette" },
        ],
      },
      { slug: "transport_marchandises", name: "Transport de marchandises" },
      { slug: "demenagement", name: "Déménagement" },
      { slug: "location_vehicule", name: "Location de véhicule" },
      {
        slug: "livraison_coursier",
        name: "Livraison & Coursier",
        subs: [
          { slug: "colis", name: "Colis" },
          { slug: "documents", name: "Documents" },
          { slug: "repas", name: "Repas" },
        ],
      },
      { slug: "transport_evenementiel", name: "Transport événementiel / Bus" },
    ],
  },
  {
    slug: "mecanique_auto",
    name: "Mécanique & Automobile",
    icon: "Wrench",
    color: "bg-slate-600",
    subs: [
      {
        slug: "mecanique_automobile",
        name: "Mécanique auto",
        subs: [
          { slug: "diagnostic", name: "Diagnostic" },
          { slug: "revision", name: "Révision" },
          { slug: "moteur", name: "Moteur" },
        ],
      },
      { slug: "mecanique_moto", name: "Mécanique moto" },
      { slug: "carrosserie", name: "Carrosserie & Peinture auto" },
      { slug: "pneumatiques", name: "Pneumatiques" },
      {
        slug: "entretien_auto",
        name: "Entretien auto",
        subs: [
          { slug: "vidange", name: "Vidange" },
          { slug: "lavage", name: "Lavage" },
          { slug: "climatisation_auto", name: "Climatisation auto" },
        ],
      },
    ],
  },
  {
    slug: "technologie_numerique",
    name: "Technologie & Numérique",
    icon: "Cpu",
    color: "bg-indigo-500",
    subs: [
      {
        slug: "reparation_telephone",
        name: "Réparation téléphone",
        subs: [
          { slug: "ecran", name: "Écran" },
          { slug: "batterie", name: "Batterie" },
          { slug: "logiciel", name: "Logiciel" },
        ],
      },
      { slug: "reparation_ordinateur", name: "Réparation ordinateur" },
      { slug: "installation_reseau", name: "Installation réseau & Wi-Fi" },
      { slug: "developpement_web", name: "Développement web & logiciel" },
      { slug: "formation_informatique", name: "Formation informatique" },
      { slug: "electronique_hifi", name: "Électronique & Hi-Fi" },
    ],
  },
  {
    slug: "sante",
    name: "Santé",
    icon: "Stethoscope",
    color: "bg-red-500",
    subs: [
      { slug: "infirmier_domicile", name: "Infirmier à domicile" },
      { slug: "kinesitherapie", name: "Kinésithérapie" },
      { slug: "sages_femmes", name: "Sages-femmes" },
      { slug: "pharmacie_garde", name: "Pharmacie de garde" },
      { slug: "laboratoire_analyses", name: "Laboratoire d'analyses" },
      { slug: "nutrition", name: "Nutrition / Diététique" },
      { slug: "accompagnement_psy", name: "Accompagnement psychologique" },
    ],
  },
  {
    slug: "agriculture_elevage",
    name: "Agriculture & Élevage",
    icon: "Sprout",
    color: "bg-green-600",
    subs: [
      {
        slug: "agriculture",
        name: "Agriculture",
        subs: [
          { slug: "cultures", name: "Grandes cultures" },
          { slug: "maraichage", name: "Maraîchage" },
          { slug: "preparation_sol", name: "Préparation du sol" },
        ],
      },
      {
        slug: "elevage",
        name: "Élevage",
        subs: [
          { slug: "volaille", name: "Volaille" },
          { slug: "betail", name: "Bétail" },
          { slug: "porcin", name: "Porcin" },
        ],
      },
      { slug: "veterinaire", name: "Vétérinaire" },
      { slug: "pisciculture", name: "Pisciculture" },
      { slug: "amenagement_agricole", name: "Aménagement / Irrigation" },
      { slug: "transformation_produits", name: "Transformation de produits" },
    ],
  },
  {
    slug: "education_formation",
    name: "Éducation & Formation",
    icon: "GraduationCap",
    color: "bg-cyan-600",
    subs: [
      { slug: "soutien_scolaire", name: "Soutien scolaire" },
      {
        slug: "cours_particuliers",
        name: "Cours particuliers",
        subs: [
          { slug: "math_sciences", name: "Math & Sciences" },
          { slug: "langues", name: "Langues" },
        ],
      },
      { slug: "formation_pro", name: "Formation professionnelle" },
      { slug: "musique_arts", name: "Musique & Arts" },
      { slug: "coaching", name: "Coaching & Dév. personnel" },
      { slug: "formation_langues", name: "Formation en langues" },
    ],
  },
  {
    slug: "evenementiel",
    name: "Événementiel",
    icon: "PartyPopper",
    color: "bg-fuchsia-500",
    subs: [
      { slug: "organisation_evenements", name: "Organisation d'événements" },
      { slug: "decoration", name: "Décoration" },
      { slug: "son_lumiere_dj", name: "Son & Lumière / DJ" },
      { slug: "photographie", name: "Photographie" },
      { slug: "video_montage", name: "Vidéo & Montage" },
      { slug: "location_materiel", name: "Location de matériel & tentes" },
    ],
  },
  {
    slug: "securite",
    name: "Sécurité",
    icon: "ShieldCheck",
    color: "bg-gray-700",
    subs: [
      { slug: "agent_securite", name: "Agent de sécurité" },
      { slug: "gardiennage", name: "Gardiennage" },
      {
        slug: "installation_securite",
        name: "Système de sécurité",
        subs: [
          { slug: "alarmes", name: "Alarmes" },
          { slug: "cameras", name: "Caméras" },
          { slug: "controle_acces", name: "Contrôle d'accès" },
        ],
      },
      { slug: "protection_incendie", name: "Protection incendie" },
    ],
  },
  {
    slug: "energie",
    name: "Énergie",
    icon: "Zap",
    color: "bg-yellow-500",
    subs: [
      {
        slug: "panneaux_solaires",
        name: "Panneaux solaires",
        subs: [
          { slug: "installation_solaire", name: "Installation" },
          { slug: "maintenance_solaire", name: "Maintenance" },
          { slug: "onduleurs", name: "Onduleurs" },
        ],
      },
      { slug: "groupe_electrogene", name: "Groupe électrogène" },
      { slug: "batteries_stockage", name: "Batteries & stockage" },
      { slug: "audit_energie", name: "Audit / Économie d'énergie" },
      { slug: "biogaz", name: "Biogaz" },
    ],
  },
  {
    slug: "textile_mode",
    name: "Textile & Mode",
    icon: "Shirt",
    color: "bg-purple-500",
    subs: [
      {
        slug: "couture",
        name: "Couture",
        subs: [
          { slug: "sur_mesure", name: "Sur-mesure" },
          { slug: "retouches", name: "Retouches" },
          { slug: "uniformes", name: "Uniformes" },
        ],
      },
      { slug: "creation_mode", name: "Création de mode" },
      { slug: "teinture_wax", name: "Teinture / Wax" },
      { slug: "broderie", name: "Broderie personnalisée" },
      { slug: "mercerie", name: "Mercerie" },
    ],
  },
  {
    slug: "communication_impression",
    name: "Communication & Impression",
    icon: "Printer",
    color: "bg-sky-600",
    subs: [
      {
        slug: "impression",
        name: "Impression",
        subs: [
          { slug: "impression_numerique", name: "Numérique" },
          { slug: "impression_offset", name: "Offset" },
          { slug: "grand_format", name: "Grand format" },
        ],
      },
      { slug: "serigraphie", name: "Sérigraphie" },
      { slug: "signaletique", name: "Signalétique & Enseignes" },
      { slug: "design_graphique", name: "Design graphique" },
      { slug: "communication_digitale", name: "Communication digitale" },
    ],
  },
  {
    slug: "metiers_artisanat",
    name: "Métiers & Artisanat",
    icon: "Wrench",
    color: "bg-stone-600",
    subs: [
      { slug: "forge_soudure", name: "Forge & Soudure" },
      { slug: "poterie_ceramique", name: "Poterie & Céramique" },
      { slug: "vannerie", name: "Vannerie" },
      { slug: "sculpture", name: "Sculpture" },
      { slug: "maroquinerie", name: "Maroquinerie" },
      { slug: "bijouterie", name: "Bijouterie" },
    ],
  },
  {
    slug: "services_admin_juridique",
    name: "Services administratifs & Juridiques",
    icon: "Scale",
    color: "bg-emerald-700",
    subs: [
      { slug: "comptabilite", name: "Comptabilité" },
      { slug: "conseil_juridique", name: "Conseil juridique" },
      { slug: "fiscalite", name: "Fiscalité" },
      { slug: "secretariat_saisie", name: "Secrétariat / Saisie" },
      { slug: "traduction", name: "Traduction" },
      { slug: "formalites_admin", name: "Formalités administratives" },
    ],
  },
  {
    slug: "autres",
    name: "Autres services",
    icon: "Ellipsis",
    color: "bg-slate-400",
    subs: [],
  },
];

export async function seedCategories(prisma: SeedPrismaClient) {
  console.log("Seeding categories and subcategories...");

  for (const [categoryIndex, categoryData] of taxonomy.entries()) {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
        icon: categoryData.icon,
        color: categoryData.color,
        order: categoryIndex + 1,
        isActive: true,
      },
    });

    for (const [subIndex, subData] of (categoryData.subs ?? []).entries()) {
      const subcategory = await prisma.subcategory.create({
        data: {
          categoryId: category.id,
          name: subData.name,
          slug: subData.slug,
          order: subIndex + 1,
          isActive: true,
        },
      });

      if (!subData.subs?.length) continue;

      await prisma.subcategory.createMany({
        data: subData.subs.map((leaf, leafIndex) => ({
          categoryId: category.id,
          parentId: subcategory.id,
          name: leaf.name,
          slug: leaf.slug,
          order: leafIndex + 1,
          isActive: true,
        })),
      });
    }
  }

  const [categoryCount, subcategoryCount] = await Promise.all([
    prisma.category.count(),
    prisma.subcategory.count(),
  ]);

  console.log(`Seeded ${categoryCount} categories and ${subcategoryCount} subcategories.`);
}
