import { describe, it, expect } from "vitest";
import { isLate, amountOwed, DEFAULT_LATE_FEE } from "./deposits";
import { rupeesToPaise } from "../lib/money";

describe("late detection by due day", () => {
  it("not late on or before the due day", () => {
    expect(isLate(10, new Date(2026, 5, 10))).toBe(false);
    expect(isLate(10, new Date(2026, 5, 5))).toBe(false);
  });
  it("late after the due day", () => {
    expect(isLate(10, new Date(2026, 5, 11))).toBe(true);
  });
});

describe("amount owed", () => {
  it("just the monthly amount when on time", () => {
    expect(amountOwed(rupeesToPaise(500), false)).toBe(rupeesToPaise(500));
  });
  it("monthly amount + ₹100 late fee when late", () => {
    expect(amountOwed(rupeesToPaise(500), true)).toBe(rupeesToPaise(600));
    expect(DEFAULT_LATE_FEE).toBe(rupeesToPaise(100));
  });
});
