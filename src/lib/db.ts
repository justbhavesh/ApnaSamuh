import Dexie, { type Table } from "dexie";
import type { Paise } from "./money";
import type { LedgerType, Direction } from "../domain/fund";

// Local (offline-first) store. Mirrors the Supabase schema in docs/DATABASE.md.
// A sync layer to Supabase is added in a later phase; the app is fully usable
// on this local store alone.

export interface Group {
  id: string;
  name: string;
  interestRate: number; // 0.02
  lateFee: Paise; // 10000
  dueDay: number; // e.g. 10
  startDate: string;
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
  phone: string;
  monthlyAmount: Paise; // ₹100–₹1,000
  role: "admin" | "member";
  pinHash?: string; // SHA-256 of the member's login PIN (set by the कोषाध्यक्ष)
  joinDate: string;
  active: boolean;
}

export interface Deposit {
  id: string;
  memberId: string;
  period: string; // "YYYY-MM"
  amount: Paise;
  status: "paid" | "pending" | "late";
  paidDate?: string;
  lateFeeCharged: Paise;
}

export interface Loan {
  id: string;
  memberId: string;
  principal: Paise;
  rate: number;
  startDate: string;
  status: "active" | "closed";
  closedDate?: string;
}

export interface InterestCharge {
  id: string;
  loanId: string;
  period: string; // "YYYY-MM"
  outstandingPrincipal: Paise; // basis at accrual time
  amountDue: Paise;
  amountPaid: Paise;
  status: "due" | "paid" | "overdue";
}

export interface Repayment {
  id: string;
  loanId: string;
  date: string;
  amount: Paise;
  interestPart: Paise;
  principalPart: Paise;
}

export interface LedgerEntryRow {
  id: string;
  groupId: string;
  type: LedgerType;
  direction: Direction;
  amount: Paise;
  date: string;
  refTable?: string;
  refId?: string;
  note?: string;
}

export class ApnaSamuhDB extends Dexie {
  groups!: Table<Group, string>;
  members!: Table<Member, string>;
  deposits!: Table<Deposit, string>;
  loans!: Table<Loan, string>;
  repayments!: Table<Repayment, string>;
  interestCharges!: Table<InterestCharge, string>;
  ledger!: Table<LedgerEntryRow, string>;

  constructor() {
    super("apnasamuh");
    this.version(1).stores({
      groups: "id",
      members: "id, groupId, active",
      deposits: "id, memberId, period, [memberId+period]",
      loans: "id, memberId, status",
      repayments: "id, loanId",
      ledger: "id, groupId, type",
    });
    this.version(2).stores({
      interestCharges: "id, loanId, period, [loanId+period]",
    });
  }
}

export const db = new ApnaSamuhDB();

export const uid = (): string =>
  (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;
