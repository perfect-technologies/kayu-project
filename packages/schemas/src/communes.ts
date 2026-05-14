export const KIN_COMMUNES = [
  "Bandalungwa",
  "Barumbu",
  "Bumbu",
  "Gombe",
  "Kalamu",
  "Kasa-Vungu",
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
  "Mont Ngafula",
  "Ndjili",
  "Ngaba",
  "Ngaliema",
  "Ngiri-Ngiri",
  "Nsele",
  "Selembao",
] as const;

export type KinCommune = (typeof KIN_COMMUNES)[number];

// Tuple form for Zod's z.enum() which wants a non-empty string-tuple; cast to
// the literal-union-preserving shape so z.enum() infers KinCommune, not string.
export const KIN_COMMUNES_TUPLE = KIN_COMMUNES as unknown as [KinCommune, ...KinCommune[]];
