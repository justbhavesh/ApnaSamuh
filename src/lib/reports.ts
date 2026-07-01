import { db, uid } from "./db";
import type { Paise } from "./money";
import { GROUP_ID } from "./repo";
import { principalOutstanding } from "./loans";
import {
  computeShares,
  type DistributionRule,
  type Share,
} from "../domain/distribution";

// --- Headline report numbers ----------------------------------------------

export interface ReportData {
  totalDeposits: Paise;
  totalInterest: Paise;
  totalLateFees: Paise;
  totalDistributed: Paise;
  undistributedProfit: Paise;
  activeLoanCount: number;
}

export async function reportData(): Promise<ReportData> {
  const ledger = await db.ledger.where("groupId").equals(GROUP_ID).toArray();
  const sumIn = (type: string) =>
    ledger
      .filter((r) => r.type === type && r.direction === "in")
      .reduce((s, r) => s + r.amount, 0);

  const totalInterest = sumIn("interest");
  const totalLateFees = sumIn("late_fee");
  const totalDistributed = ledger
    .filter((r) => r.type === "distribution")
    .reduce((s, r) => s + r.amount, 0);
  const activeLoans = await db.loans.where("status").equals("active").count();

  return {
    totalDeposits: sumIn("deposit"),
    totalInterest,
    totalLateFees,
    totalDistributed,
    undistributedProfit: totalInterest + totalLateFees - totalDistributed,
    activeLoanCount: activeLoans,
  };
}

// --- Per-member statement -------------------------------------------------

export interface MemberStatement {
  memberId: string;
  name: string;
  totalDeposits: Paise;
  depositCount: number;
  outstandingLoan: Paise;
}

export async function memberStatements(): Promise<MemberStatement[]> {
  const members = await db.members.where("groupId").equals(GROUP_ID).toArray();
  const out: MemberStatement[] = [];
  for (const m of members) {
    const deps = (await db.deposits.where("memberId").equals(m.id).toArray()).filter(
      (d) => d.status === "paid"
    );
    const loans = (await db.loans.where("memberId").equals(m.id).toArray()).filter(
      (l) => l.status === "active"
    );
    let outstandingLoan = 0;
    for (const l of loans) outstandingLoan += await principalOutstanding(l);
    out.push({
      memberId: m.id,
      name: m.name,
      totalDeposits: deps.reduce((s, d) => s + d.amount, 0),
      depositCount: deps.length,
      outstandingLoan,
    });
  }
  return out;
}

// --- Profit distribution --------------------------------------------------

export interface DistributionPreview {
  profit: Paise;
  shares: Share[];
}

export async function previewDistribution(
  rule: DistributionRule
): Promise<DistributionPreview> {
  const rd = await reportData();
  const profit = rd.undistributedProfit;
  const members = (
    await db.members.where("groupId").equals(GROUP_ID).toArray()
  ).filter((m) => m.active);

  const inputs = [];
  for (const m of members) {
    const deposits = (await db.deposits.where("memberId").equals(m.id).toArray())
      .filter((d) => d.status === "paid")
      .reduce((s, d) => s + d.amount, 0);
    inputs.push({ memberId: m.id, name: m.name, deposits });
  }

  return { profit: Math.max(profit, 0), shares: computeShares(profit, inputs, rule) };
}

// Records the distribution as one ledger payout (out) per member. This reduces the
// fund worth and resets the undistributed-profit figure. Not reversible by design.
export async function distributeProfit(rule: DistributionRule): Promise<void> {
  const { profit, shares } = await previewDistribution(rule);
  if (profit <= 0) return;
  const today = new Date().toISOString().slice(0, 10);

  await db.transaction("rw", db.ledger, async () => {
    for (const s of shares) {
      if (s.share <= 0) continue;
      await db.ledger.add({
        id: uid(),
        groupId: GROUP_ID,
        type: "distribution",
        direction: "out",
        amount: s.share,
        date: today,
        refTable: "members",
        refId: s.memberId,
        note: `लाभ वितरण (${rule})`,
      });
    }
  });
}
