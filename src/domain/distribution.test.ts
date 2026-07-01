import { describe, it, expect } from "vitest";
import { computeShares, type ShareInput } from "./distribution";
import { rupeesToPaise } from "../lib/money";

const members: ShareInput[] = [
  { memberId: "a", name: "राम", deposits: rupeesToPaise(1000) },
  { memberId: "b", name: "सीता", deposits: rupeesToPaise(300) },
  { memberId: "c", name: "मोहन", deposits: rupeesToPaise(700) },
];

describe("computeShares", () => {
  it("proportional shares always sum back to the profit (no rounding leak)", () => {
    const profit = rupeesToPaise(220);
    const shares = computeShares(profit, members, "proportional");
    expect(shares.reduce((s, x) => s + x.share, 0)).toBe(profit);
  });

  it("proportional gives more to the larger depositor", () => {
    const shares = computeShares(rupeesToPaise(200), members, "proportional");
    const a = shares.find((s) => s.memberId === "a")!.share;
    const b = shares.find((s) => s.memberId === "b")!.share;
    expect(a).toBeGreaterThan(b);
  });

  it("equal split also sums back exactly, even with indivisible amounts", () => {
    const profit = rupeesToPaise(100) + 1; // 10001 paise across 3
    const shares = computeShares(profit, members, "equal");
    expect(shares.reduce((s, x) => s + x.share, 0)).toBe(profit);
  });

  it("no profit → all zero shares", () => {
    const shares = computeShares(0, members, "proportional");
    expect(shares.every((s) => s.share === 0)).toBe(true);
  });
});
