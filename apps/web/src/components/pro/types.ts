import type { CategorySlug } from "@kayu/ui";

export type JobStatus = "confirmed" | "en_route" | "completed";

export type ActiveJobStatus = "scheduled" | "enroute" | "arrived" | "in_progress";

export type ClientSummary = {
  name: string;
  initials: string;
  bg: string;
};

export type DashboardJob = {
  id: string;
  time: string;
  duration: string;
  client: ClientSummary;
  kind: string;
  address: string;
  status: JobStatus;
  fee: number;
  distance: number;
};

export type DashboardRequest = {
  id: string;
  client: ClientSummary;
  kind: string;
  when: string;
  address: string;
  msg: string;
  matchScore: number;
  receivedAt: string;
  distance: number;
  urgent?: boolean;
};

// DS07 — richer inbound request shape used by JobRequests + QuoteCompose.
export type InboundRequest = {
  id: string;
  client: ClientSummary & {
    rating?: number | null;
    jobs?: number;
    newClient?: boolean;
  };
  service: string;
  category: CategorySlug;
  when: string;
  address: string;
  neighborhood: string;
  distance: number;
  estimatedHours: number;
  budget: number;
  description: string;
  photos: number;
  receivedAt: string;
  expiresIn: string;
  expiresMinutes: number;
  competing?: number;
  matchScore: number;
  urgent?: boolean;
};

// DS07 — active missions in-flight, rendered as a grouped card on JobRequests.
export type ActiveJob = {
  id: string;
  client: ClientSummary;
  service: string;
  when: string;
  address: string;
  status: ActiveJobStatus;
  payout: number;
};

// DS07 — quote line item presets keyed by category slug.
export type LineItemPreset = {
  label: string;
  unit: string;
  unitPrice: number;
};
