import { describe, it, expect } from "vitest";
import { monthlyInterest, splitRepayment } from "./interest";
import { rupeesToPaise } from "../lib/money";

describe("monthlyInterest (2% flat on outstanding)", () => {
  it("charges 2% of ₹10,000 = ₹200", () => {
    expect(monthlyInterest(rupeesToPaise(10000))).toBe(rupeesToPaise(200));
  });

  it("reduces with the principal: 2% of ₹7,000 = ₹140", () => {
    expect(monthlyInterest(rupeesToPaise(7000))).toBe(rupeesToPaise(140));
  });
});

describe("splitRepayment (interest first, then principal)", () => {
  it("₹3,200 against ₹200 interest → ₹200 interest + ₹3,000 principal", () => {
    const s = splitRepayment(rupeesToPaise(3200), rupeesToPaise(200));
    expect(s.interestPart).toBe(rupeesToPaise(200));
    expect(s.principalPart).toBe(rupeesToPaise(3000));
  });

  it("a payment smaller than interest goes entirely to interest", () => {
    const s = splitRepayment(rupeesToPaise(100), rupeesToPaise(200));
    expect(s.interestPart).toBe(rupeesToPaise(100));
    expect(s.principalPart).toBe(0);
  });
});
