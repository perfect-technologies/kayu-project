export type JobStatus = "confirmed" | "en_route" | "completed";

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
