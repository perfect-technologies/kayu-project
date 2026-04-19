// Mobile Money operators — UI-level catalog (name + brand color + initial).
// The masked phone shown in the sheet comes from the pro's profile, not here.

import type { PayoutOperator } from "@kayu/schemas";

export type MMOperator = {
  id: PayoutOperator;
  slug: "mpesa" | "airtel" | "orange" | "mtn";
  name: string;
  init: string;
  color: string;
};

export const MM_OPERATORS: MMOperator[] = [
  { id: "MPESA", slug: "mpesa", name: "M-Pesa", init: "M", color: "#10B981" },
  { id: "AIRTEL", slug: "airtel", name: "Airtel Money", init: "A", color: "#E11D48" },
  { id: "ORANGE", slug: "orange", name: "Orange Money", init: "O", color: "#F97316" },
  { id: "MTN", slug: "mtn", name: "MTN MoMo", init: "MTN", color: "#F59E0B" },
];
