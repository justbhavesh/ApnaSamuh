import type { Paise } from "../lib/money";

export type DepositStatus = "paid" | "pending" | "late";

// Flat late fee charged once per missed month. See docs/BUSINESS_RULES.md §2.
export const DEFAULT_LATE_FEE: Paise = 10000; // ₹100

// Is an unpaid deposit late, given the due day of the month and "now"?
export function isLate(dueDay: number, now: Date = new Date()): boolean {
  return now.getDate() > dueDay;
}

// What a member owes this month if paying now: their amount, plus late fee if late.
export function amountOwed(
  monthlyAmount: Paise,
  late: boolean,
  lateFee: Paise = DEFAULT_LATE_FEE
): Paise {
  return monthlyAmount + (late ? lateFee : 0);
}
