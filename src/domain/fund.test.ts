import { describe, it, expect } from "vitest";
import {
  totalFund,
  availableToLend,
  accumulatedProfit,
  type LedgerEntry,
} from "./fund";
import { rupeesToPaise } from "../lib/money";

const led = (
  type: LedgerEntry["type"],
  direction: LedgerEntry["direction"],
  rupees: number
): LedgerEntry => ({ type, direction, amount: rupeesToPaise(rupees) });

describe("fund totals from the ledger", () => {
  const ledger: LedgerEntry[] = [
    led("deposit", "in", 98000),
    led("interest", "in", 9100),
    led("late_fee", "in", 700),
    led("loan_out", "out", 40000), // audit only — must NOT reduce fund worth
    led("repayment_principal", "in", 0),
  ];

  it("total fund worth ignores loan transfers (only deposits/interest/fees)", () => {
    expect(totalFund(ledger)).toBe(rupeesToPaise(107800));
  });

  it("available to lend = fund - money out on loan", () => {
    const fund = totalFund(ledger);
    expect(availableToLend(fund, rupeesToPaise(40000))).toBe(
      rupeesToPaise(67800)
    );
  });

  it("invariant: totalFund === availableToLend + moneyOutOnLoan", () => {
    const fund = totalFund(ledger);
    const out = rupeesToPaise(40000);
    expect(availableToLend(fund, out) + out).toBe(fund);
  });

  it("accumulated profit = interest + late fees only", () => {
    expect(accumulatedProfit(ledger)).toBe(rupeesToPaise(9800));
  });
});
