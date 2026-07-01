import { db, uid, type Member, type Group } from "./db";
import type { Paise } from "./money";
import { amountOwed, isLate, DEFAULT_LATE_FEE } from "../domain/deposits";
import {
  totalFund,
  availableToLend,
  accumulatedProfit,
  type LedgerEntry,
} from "../domain/fund";
import { currentPeriod } from "./period";

export const GROUP_ID = "default-group";

// --- Seed -----------------------------------------------------------------

// Creates just the group record on first run (no sample members).
// The कोषाध्यक्ष renames the group in Settings and adds the real members.
export async function ensureSeed(): Promise<void> {
  const existing = await db.groups.get(GROUP_ID);
  if (existing) return;

  const group: Group = {
    id: GROUP_ID,
    name: "ग्राम कोष",
    interestRate: 0.02,
    lateFee: DEFAULT_LATE_FEE,
    dueDay: 10,
    startDate: new Date().toISOString().slice(0, 10),
  };
  await db.groups.add(group);
}

// --- Members --------------------------------------------------------------

export async function getGroup(): Promise<Group | undefined> {
  return db.groups.get(GROUP_ID);
}

export async function updateGroup(patch: Partial<Group>): Promise<void> {
  await db.groups.update(GROUP_ID, patch);
}

export async function listMembers(): Promise<Member[]> {
  return db.members.where("groupId").equals(GROUP_ID).toArray();
}

export async function addMember(
  name: string,
  phone: string,
  monthlyAmount: Paise
): Promise<void> {
  await db.members.add({
    id: uid(),
    groupId: GROUP_ID,
    name: name.trim(),
    phone: phone.trim(),
    monthlyAmount,
    role: "member",
    joinDate: new Date().toISOString().slice(0, 10),
    active: true,
  });
}

// --- Deposits -------------------------------------------------------------

export interface MonthlyDepositRow {
  member: Member;
  status: "paid" | "pending" | "late";
  owed: Paise; // monthly amount (+ late fee if applicable)
  lateFee: Paise;
}

// The deposit picture for a given month: who has paid, who owes, and how much
// (including the ₹100 late fee for anyone past the due day).
export async function monthlyDeposits(
  period: string = currentPeriod()
): Promise<MonthlyDepositRow[]> {
  const [members, group] = await Promise.all([
    listMembers(),
    db.groups.get(GROUP_ID),
  ]);
  const dueDay = group?.dueDay ?? 10;
  const lateFee = group?.lateFee ?? DEFAULT_LATE_FEE;

  const rows: MonthlyDepositRow[] = [];
  for (const member of members.filter((m) => m.active)) {
    const existing = await db.deposits
      .where("[memberId+period]")
      .equals([member.id, period])
      .first();

    if (existing?.status === "paid") {
      rows.push({ member, status: "paid", owed: 0, lateFee: existing.lateFeeCharged });
    } else {
      const late = isLate(dueDay);
      rows.push({
        member,
        status: late ? "late" : "pending",
        owed: amountOwed(member.monthlyAmount, late, lateFee),
        lateFee: late ? lateFee : 0,
      });
    }
  }
  return rows;
}

// Record a member's deposit for the month. Writes the deposit row plus the
// ledger entries (deposit income, and a late-fee income row if applicable).
// The late fee is decided by `paymentDate` (when the member actually paid) vs the
// group's fixed due day — defaults to today, but the कोषाध्यक्ष can back-date it.
export async function recordDeposit(
  memberId: string,
  period: string = currentPeriod(),
  paymentDate: Date = new Date()
): Promise<void> {
  const member = await db.members.get(memberId);
  if (!member) throw new Error("member not found");
  const group = await db.groups.get(GROUP_ID);
  const dueDay = group?.dueDay ?? 10;
  const lateFee = group?.lateFee ?? DEFAULT_LATE_FEE;
  const late = isLate(dueDay, paymentDate);
  const fee = late ? lateFee : 0;
  const today = paymentDate.toISOString().slice(0, 10);

  await db.transaction("rw", db.deposits, db.ledger, async () => {
    const depositId = uid();
    await db.deposits.put({
      id: depositId,
      memberId,
      period,
      amount: member.monthlyAmount,
      status: "paid",
      paidDate: today,
      lateFeeCharged: fee,
    });
    await db.ledger.add({
      id: uid(),
      groupId: GROUP_ID,
      type: "deposit",
      direction: "in",
      amount: member.monthlyAmount,
      date: today,
      refTable: "deposits",
      refId: depositId,
    });
    if (fee > 0) {
      await db.ledger.add({
        id: uid(),
        groupId: GROUP_ID,
        type: "late_fee",
        direction: "in",
        amount: fee,
        date: today,
        refTable: "deposits",
        refId: depositId,
      });
    }
  });
}

// --- Fund summary ---------------------------------------------------------

export interface FundSummary {
  totalFund: Paise;
  availableToLend: Paise;
  moneyOutOnLoan: Paise;
  accumulatedProfit: Paise;
}

export async function fundSummary(): Promise<FundSummary> {
  const [ledgerRows, loans, repayments] = await Promise.all([
    db.ledger.where("groupId").equals(GROUP_ID).toArray(),
    db.loans.where("status").equals("active").toArray(),
    db.repayments.toArray(),
  ]);

  const ledger: LedgerEntry[] = ledgerRows.map((r) => ({
    type: r.type,
    direction: r.direction,
    amount: r.amount,
  }));

  const principalRepaid = repayments.reduce((s, r) => s + r.principalPart, 0);
  const moneyOut =
    loans.reduce((s, l) => s + l.principal, 0) - principalRepaid;

  // Profit shown is what's still undistributed: gross interest+fees minus payouts.
  const distributed = ledgerRows
    .filter((r) => r.type === "distribution")
    .reduce((s, r) => s + r.amount, 0);

  const fund = totalFund(ledger);
  return {
    totalFund: fund,
    moneyOutOnLoan: moneyOut,
    availableToLend: availableToLend(fund, moneyOut),
    accumulatedProfit: accumulatedProfit(ledger) - distributed,
  };
}
