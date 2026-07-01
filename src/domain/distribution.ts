import type { Paise } from "../lib/money";

// Profit (लाभ) is split only when members agree. Default rule: proportional to each
// member's lifetime deposits. Equal split is also available. See BUSINESS_RULES.md §5.

export type DistributionRule = "proportional" | "equal";

export interface ShareInput {
  memberId: string;
  name: string;
  deposits: Paise; // lifetime paid deposits
}

export interface Share extends ShareInput {
  share: Paise;
}

// Splits `profit` (paise) across members with no rounding leakage: the shares always
// sum back to exactly `profit`. Leftover paise from flooring go to the largest
// depositors first (proportional) or the first members (equal).
export function computeShares(
  profit: Paise,
  members: ShareInput[],
  rule: DistributionRule
): Share[] {
  const shares: Share[] = members.map((m) => ({ ...m, share: 0 }));
  if (profit <= 0 || members.length === 0) return shares;

  const totalDeposits = members.reduce((s, m) => s + m.deposits, 0);

  if (rule === "equal" || totalDeposits === 0) {
    const base = Math.floor(profit / members.length);
    const remainder = profit - base * members.length;
    shares.forEach((s, i) => (s.share = base + (i < remainder ? 1 : 0)));
    return shares;
  }

  let allocated = 0;
  shares.forEach((s) => {
    s.share = Math.floor((profit * s.deposits) / totalDeposits);
    allocated += s.share;
  });
  let remainder = profit - allocated;
  const byDeposit = [...shares].sort((a, b) => b.deposits - a.deposits);
  for (let i = 0; remainder > 0; i++, remainder--) {
    byDeposit[i % byDeposit.length].share += 1;
  }
  return shares;
}
