// DS08 — earnings fixtures. Backend wiring deferred (see PROGRESS Blockers).
// Shape mirrors the v2 prototype (prototype/components/Earnings.jsx).

export type WeekDay = {
  day: string;
  amount: number;
  isToday?: boolean;
  isFuture?: boolean;
};

export type TxType = "earning" | "payout" | "bonus";
export type TxStatus = "completed" | "pending" | "failed";

export type Transaction = {
  id: string;
  type: TxType;
  at: string;
  label: string;
  amount: number;
  fee?: number;
  net?: number;
  status: TxStatus;
  ref?: string;
  paymentMethod?: "cash" | "mpesa" | "airtel" | "orange" | "mtn";
};

export type MMOperator = {
  id: "mpesa" | "airtel" | "orange" | "mtn";
  name: string;
  init: string;
  color: string;
  number: string;
};

export const EARNINGS_WEEKLY: WeekDay[] = [
  { day: "Lun", amount: 12000 },
  { day: "Mar", amount: 28000 },
  { day: "Mer", amount: 18000 },
  { day: "Jeu", amount: 22000 },
  { day: "Ven", amount: 34000 },
  { day: "Sam", amount: 10000, isToday: true },
  { day: "Dim", amount: 0, isFuture: true },
];

export const LAST_WEEK_TOTAL = 108000;

// Balances shown on the screen. Pending = earnings not yet settled.
export const BALANCES = {
  balance: 342000,
  pending: 64000,
  lifetime: 2480000,
};

export const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    type: "earning",
    at: "Il y a 2h",
    label: "Réparation fuite · Famille Mutombo",
    amount: 22000,
    fee: 1540,
    net: 20460,
    status: "pending",
    paymentMethod: "cash",
  },
  {
    id: "t2",
    type: "payout",
    at: "Hier · 16:42",
    label: "Virement vers M-Pesa",
    amount: -85000,
    status: "completed",
    ref: "MP-7X42ZC",
    paymentMethod: "mpesa",
  },
  {
    id: "t3",
    type: "earning",
    at: "Hier · 11:15",
    label: "Installation robinet · Joseph Mbuyi",
    amount: 28000,
    fee: 1960,
    net: 26040,
    status: "completed",
    paymentMethod: "mpesa",
  },
  {
    id: "t4",
    type: "earning",
    at: "Mar 15 · 14:30",
    label: "Débouchage · Marie K.",
    amount: 15000,
    fee: 1050,
    net: 13950,
    status: "completed",
    paymentMethod: "airtel",
  },
  {
    id: "t5",
    type: "bonus",
    at: "Lun 14 · 00:01",
    label: "Bonus « 10 missions ★ 4.9+ »",
    amount: 5000,
    status: "completed",
  },
  {
    id: "t6",
    type: "earning",
    at: "Lun 14 · 09:00",
    label: "Fuite chauffe-eau · Papa Léon",
    amount: 34000,
    fee: 2380,
    net: 31620,
    status: "completed",
    paymentMethod: "cash",
  },
  {
    id: "t7",
    type: "payout",
    at: "Dim 13 · 12:10",
    label: "Virement vers Airtel Money",
    amount: -45000,
    status: "completed",
    ref: "AM-2K81PL",
    paymentMethod: "airtel",
  },
];

// Four canonical Mobile Money operators for DRC / Congo-B. Plan calls for
// four tiles even though the user currently only has one configured number;
// the others are displayed with a placeholder masked number for the demo.
export const MM_OPERATORS: MMOperator[] = [
  {
    id: "mpesa",
    name: "M-Pesa",
    init: "M",
    color: "#10B981",
    number: "+243 897 ••• 456",
  },
  {
    id: "airtel",
    name: "Airtel Money",
    init: "A",
    color: "#E11D48",
    number: "+243 991 ••• 102",
  },
  {
    id: "orange",
    name: "Orange Money",
    init: "O",
    color: "#F97316",
    number: "+243 810 ••• 742",
  },
  {
    id: "mtn",
    name: "MTN MoMo",
    init: "MTN",
    color: "#F59E0B",
    number: "+243 822 ••• 918",
  },
];
