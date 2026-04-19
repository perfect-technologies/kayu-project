import type { LineItemPreset } from "./types";

// Static catalog of quote presets per category. Not a data source — it's
// product configuration kept in code per PROGRESS.md decision (2026-04-19).
export const PRESET_LINE_ITEMS: Record<string, LineItemPreset[]> = {
  plomberie: [
    { label: "Diagnostic + déplacement", unit: "Forfait", unitPrice: 5000 },
    { label: "Main-d'œuvre plombier", unit: "Heure", unitPrice: 8000 },
    { label: "Remplacement joint/robinet", unit: "Pièce", unitPrice: 4500 },
    { label: "Débouchage canalisation", unit: "Forfait", unitPrice: 12000 },
  ],
  electricite: [
    { label: "Diagnostic électrique", unit: "Forfait", unitPrice: 5000 },
    { label: "Main-d'œuvre électricien", unit: "Heure", unitPrice: 8500 },
    { label: "Fourniture matériel", unit: "Pièce", unitPrice: 0 },
  ],
  default: [
    { label: "Déplacement", unit: "Forfait", unitPrice: 5000 },
    { label: "Main-d'œuvre", unit: "Heure", unitPrice: 7500 },
    { label: "Matériel", unit: "Pièce", unitPrice: 0 },
  ],
};

export function getPresets(category: string | undefined | null): LineItemPreset[] {
  if (!category) return PRESET_LINE_ITEMS.default;
  return PRESET_LINE_ITEMS[category] ?? PRESET_LINE_ITEMS.default;
}
