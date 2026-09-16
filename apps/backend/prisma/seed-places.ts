import type { PlaceKind, PrismaClient } from "@prisma/client";

type SeedPrismaClient = Pick<PrismaClient, "place">;

type CreatedPlace = { id: string; slug: string };

// Initial verified coverage from K-YOU server/reference-seed.mjs and
// STRUCTURED-FORMS.md (sources consulted 2026-09-14). Not a national gazetteer.
const PROVINCE_SOURCE = "https://interieur.gouv.cd/ministere/territoires";
const POSTAL_SOURCE =
  "https://www.awa-afrika.com/veillejuridique/NomenclatureDuCodePostalDeLaRDC.pdf";
const GOMBE_SOURCE =
  "https://communedelagombeword.wordpress.com/commune-2/ (publication historique, à actualiser localement)";
const CONGO_SOURCE =
  "https://www.diplomatie.gouv.fr/fr/dossiers-pays/congo/presentation-du-congo/";

const drcProvinces: Array<[province: string, capital: string]> = [
  ["Kinshasa", "Kinshasa"],
  ["Kongo Central", "Matadi"],
  ["Kwango", "Kenge"],
  ["Kwilu", "Bandundu"],
  ["Mai-Ndombe", "Inongo"],
  ["Kasaï", "Tshikapa"],
  ["Kasaï-Central", "Kananga"],
  ["Kasaï-Oriental", "Mbuji-Mayi"],
  ["Lomami", "Kabinda"],
  ["Sankuru", "Lusambo"],
  ["Bas-Uélé", "Buta"],
  ["Haut-Uélé", "Isiro"],
  ["Ituri", "Bunia"],
  ["Maniema", "Kindu"],
  ["Nord-Kivu", "Goma"],
  ["Sud-Kivu", "Bukavu"],
  ["Tshopo", "Kisangani"],
  ["Équateur", "Mbandaka"],
  ["Mongala", "Lisala"],
  ["Nord-Ubangi", "Gbadolite"],
  ["Sud-Ubangi", "Gemena"],
  ["Tshuapa", "Boende"],
  ["Haut-Katanga", "Lubumbashi"],
  ["Haut-Lomami", "Kamina"],
  ["Lualaba", "Kolwezi"],
  ["Tanganyika", "Kalemie"],
];

const kinshasaCommunes = [
  "Bandalungwa",
  "Barumbu",
  "Bumbu",
  "Gombe",
  "Kalamu",
  "Kasa-Vubu",
  "Kimbanseke",
  "Kinshasa",
  "Kintambo",
  "Kisenso",
  "Lemba",
  "Limete",
  "Lingwala",
  "Makala",
  "Maluku",
  "Masina",
  "Matete",
  "Mont-Ngafula",
  "Ndjili",
  "Ngaba",
  "Ngaliema",
  "Ngiri-Ngiri",
  "Nsele",
  "Selembao",
];

const gombeQuartiers = [
  "Batetela",
  "Haut Commandement",
  "Croix Rouge",
  "Lemera",
  "Golf",
  "Fleuve",
  "Gare",
  "Commerce",
  "Révolution",
  "Cliniques",
];

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function seedPlaces(prisma: SeedPrismaClient) {
  console.log("Seeding places...");

  const createPlace = (
    kind: PlaceKind,
    label: string,
    parent: CreatedPlace | null,
    source: string,
    options: { slug?: string; aliases?: string[] } = {},
  ): Promise<CreatedPlace> =>
    prisma.place.create({
      data: {
        kind,
        label,
        slug:
          options.slug ??
          `${parent ? `${parent.slug}-` : ""}${kind.toLowerCase()}-${slugify(label)}`,
        parentId: parent?.id,
        aliases: options.aliases ?? [],
        source,
      },
      select: { id: true, slug: true },
    });

  const drc = await createPlace("COUNTRY", "RDC", null, PROVINCE_SOURCE, {
    slug: "cd",
    aliases: ["République démocratique du Congo", "Congo-Kinshasa"],
  });

  for (const [provinceLabel, capitalLabel] of drcProvinces) {
    const province = await createPlace("PROVINCE", provinceLabel, drc, PROVINCE_SOURCE);
    const capital = await createPlace("CITY", capitalLabel, province, PROVINCE_SOURCE);

    if (provinceLabel !== "Kinshasa") continue;

    for (const communeLabel of kinshasaCommunes) {
      const commune = await createPlace("COMMUNE", communeLabel, capital, POSTAL_SOURCE);

      if (communeLabel !== "Gombe") continue;

      for (const quartierLabel of gombeQuartiers) {
        await createPlace("QUARTIER", quartierLabel, commune, GOMBE_SOURCE);
      }
    }
  }

  const congo = await createPlace("COUNTRY", "Congo", null, CONGO_SOURCE, {
    slug: "cg",
    aliases: ["République du Congo", "Congo-Brazzaville"],
  });
  await createPlace("CITY", "Brazzaville", congo, CONGO_SOURCE);

  console.log(`Seeded ${await prisma.place.count()} places.`);
}
