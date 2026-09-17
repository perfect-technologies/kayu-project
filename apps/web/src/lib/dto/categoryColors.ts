// Mirrors `categoryColors` in packages/ui/src/tokens.ts. Declared here so Tailwind's source scan
// (apps/web only) emits the utilities; the package copy is outside the scan and its classes never build.
export const categoryColorClasses: Record<string, string> = {
  batiment_construction: "bg-amber-500",
  beaute_bien_etre: "bg-pink-500",
  cuisine_restauration: "bg-orange-500",
  maison_entretien: "bg-teal-500",
  garde_assistance: "bg-rose-500",
  transport_logistique: "bg-blue-500",
  mecanique_auto: "bg-slate-600",
  technologie_numerique: "bg-indigo-500",
  sante: "bg-red-500",
  agriculture_elevage: "bg-green-600",
  education_formation: "bg-cyan-600",
  evenementiel: "bg-fuchsia-500",
  securite: "bg-gray-700",
  energie: "bg-yellow-500",
  textile_mode: "bg-purple-500",
  communication_impression: "bg-sky-600",
  metiers_artisanat: "bg-stone-600",
  services_admin_juridique: "bg-emerald-700",
  autres: "bg-slate-400",
};
