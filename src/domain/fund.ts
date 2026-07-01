import type { Paise } from "../lib/money";

// The ledger is the single source of truth. The fund balance is always derived
// from it, never stored as an editable number. See docs/BUSINESS_RULES.md §6.

export type LedgerType =
  | "deposit"
  | "interest"
  | "late_fee"
  | "loan_out"
  | "repayment_principal"
  | "distribution"
  | "capital"
  | "expense"
  | "reversal";

export type Direction = "in" | "out";

export interface LedgerEntry {
  type: LedgerType;
  direction: Direction;
  amount: Paise; // always positive; direction gives the sign
}

// Total fund worth (कुल कोष) grows only from money that actually belongs to the
// fund: deposits, interest, late fees, capital added — less distributions/expenses.
// Loan disbursement and principal repayment are asset transfers (cash <-> receivable)
// and do NOT change the fund's worth, so they are excluded here. They are still
// written to the ledger for the audit trail.
const FUND_IN: LedgerType[] = ["deposit", "interest", "late_fee", "capital"];
const FUND_OUT: LedgerType[] = ["distribution", "expense"];

export function totalFund(ledger: LedgerEntry[]): Paise {
  return ledger.reduce((sum, e) => {
    if (e.direction === "in" && FUND_IN.includes(e.type)) return sum + e.amount;
    if (e.direction === "out" && FUND_OUT.includes(e.type)) return sum - e.amount;
    return sum;
  }, 0);
}

// Cash available to lend = total worth minus what is currently out on loan.
// Invariant: totalFund === availableToLend + moneyOutOnLoan.
export function availableToLend(
  fund: Paise,
  moneyOutOnLoan: Paise
): Paise {
  return fund - moneyOutOnLoan;
}

// Accumulated profit = interest collected + late fees collected (income only).
export function accumulatedProfit(ledger: LedgerEntry[]): Paise {
  return ledger
    .filter(
      (e) =>
        e.direction === "in" &&
        (e.type === "interest" || e.type === "late_fee")
    )
    .reduce((sum, e) => sum + e.amount, 0);
}
