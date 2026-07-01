import type { Paise } from "../lib/money";

// Flat monthly interest on the outstanding principal (default 2% / month).
// See docs/BUSINESS_RULES.md §4.
export const DEFAULT_MONTHLY_RATE = 0.02;

export function monthlyInterest(
  outstandingPrincipal: Paise,
  rate: number = DEFAULT_MONTHLY_RATE
): Paise {
  return Math.round(outstandingPrincipal * rate);
}

// A repayment clears outstanding interest first, then reduces principal.
export interface RepaymentSplit {
  interestPart: Paise;
  principalPart: Paise;
}

export function splitRepayment(
  payment: Paise,
  interestOutstanding: Paise
): RepaymentSplit {
  const interestPart = Math.min(payment, interestOutstanding);
  const principalPart = payment - interestPart;
  return { interestPart, principalPart };
}
