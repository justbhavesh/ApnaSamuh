import { db, uid, type Loan } from "./db";
import type { Paise } from "./money";
import { monthlyInterest, splitRepayment } from "../domain/interest";
import { currentPeriod } from "./period";
import { GROUP_ID, fundSummary } from "./repo";

// --- Outstanding helpers ---------------------------------------------------

async function principalRepaid(loanId: string): Promise<Paise> {
  const reps = await db.repayments.where("loanId").equals(loanId).toArray();
  return reps.reduce((s, r) => s + r.principalPart, 0);
}

export async function principalOutstanding(loan: Loan): Promise<Paise> {
  return loan.principal - (await principalRepaid(loan.id));
}

export async function interestOutstanding(loanId: string): Promise<Paise> {
  const charges = await db.interestCharges.where("loanId").equals(loanId).toArray();
  return charges.reduce((s, c) => s + (c.amountDue - c.amountPaid), 0);
}

// --- Monthly interest accrual ---------------------------------------------

// Create this month's interest charge for every active loan that doesn't have
// one yet. amountDue = current outstanding principal × rate (2%).
export async function ensureMonthlyInterest(
  period: string = currentPeriod()
): Promise<void> {
  const loans = await db.loans.where("status").equals("active").toArray();
  for (const loan of loans) {
    // Deterministic id makes accrual idempotent: concurrent calls (StrictMode,
    // the loan's own call, and the live query) all target the same row, so the
    // duplicate insert fails harmlessly instead of double-charging interest.
    const id = `ic-${loan.id}-${period}`;
    if (await db.interestCharges.get(id)) continue;

    const outstanding = await principalOutstanding(loan);
    if (outstanding <= 0) continue;

    try {
      await db.interestCharges.add({
        id,
        loanId: loan.id,
        period,
        outstandingPrincipal: outstanding,
        amountDue: monthlyInterest(outstanding, loan.rate),
        amountPaid: 0,
        status: "due",
      });
    } catch {
      // ConstraintError — another concurrent call already created it
    }
  }
}

// --- Views ----------------------------------------------------------------

export interface LoanView {
  loan: Loan;
  memberName: string;
  principalOutstanding: Paise;
  interestOutstanding: Paise;
}

export async function listActiveLoans(): Promise<LoanView[]> {
  await ensureMonthlyInterest();
  const loans = await db.loans.where("status").equals("active").toArray();
  const views: LoanView[] = [];
  for (const loan of loans) {
    const member = await db.members.get(loan.memberId);
    views.push({
      loan,
      memberName: member?.name ?? "—",
      principalOutstanding: await principalOutstanding(loan),
      interestOutstanding: await interestOutstanding(loan.id),
    });
  }
  return views;
}

// --- Actions --------------------------------------------------------------

export class InsufficientFundsError extends Error {}

// Give a new loan. Blocks if the amount exceeds available-to-lend.
export async function addLoan(memberId: string, principal: Paise): Promise<void> {
  const summary = await fundSummary();
  if (principal > summary.availableToLend) {
    throw new InsufficientFundsError("कर्ज देने योग्य राशि से अधिक");
  }
  const group = await db.groups.get(GROUP_ID);
  const rate = group?.interestRate ?? 0.02;
  const today = new Date().toISOString().slice(0, 10);

  await db.transaction("rw", db.loans, db.ledger, async () => {
    const loanId = uid();
    await db.loans.add({
      id: loanId,
      memberId,
      principal,
      rate,
      startDate: today,
      status: "active",
    });
    await db.ledger.add({
      id: uid(),
      groupId: GROUP_ID,
      type: "loan_out",
      direction: "out",
      amount: principal,
      date: today,
      refTable: "loans",
      refId: loanId,
    });
  });

  await ensureMonthlyInterest();
}

// Record a repayment: clears outstanding interest first (oldest charges first),
// then reduces principal. Writes the repayment row, the ledger entries, and
// closes the loan when nothing is left owing.
export async function recordRepayment(loanId: string, payment: Paise): Promise<void> {
  await ensureMonthlyInterest();
  const loan = await db.loans.get(loanId);
  if (!loan) throw new Error("loan not found");

  const intOut = await interestOutstanding(loanId);
  const { interestPart, principalPart } = splitRepayment(payment, intOut);
  const today = new Date().toISOString().slice(0, 10);

  await db.transaction(
    "rw",
    db.interestCharges,
    db.repayments,
    db.ledger,
    db.loans,
    async () => {
      // apply interest to oldest unpaid charges first
      let rem = interestPart;
      const charges = (
        await db.interestCharges.where("loanId").equals(loanId).toArray()
      )
        .filter((c) => c.amountPaid < c.amountDue)
        .sort((a, b) => a.period.localeCompare(b.period));
      for (const c of charges) {
        if (rem <= 0) break;
        const pay = Math.min(rem, c.amountDue - c.amountPaid);
        c.amountPaid += pay;
        c.status = c.amountPaid >= c.amountDue ? "paid" : "due";
        await db.interestCharges.put(c);
        rem -= pay;
      }

      const repaymentId = uid();
      await db.repayments.add({
        id: repaymentId,
        loanId,
        date: today,
        amount: payment,
        interestPart,
        principalPart,
      });

      if (interestPart > 0) {
        await db.ledger.add({
          id: uid(),
          groupId: GROUP_ID,
          type: "interest",
          direction: "in",
          amount: interestPart,
          date: today,
          refTable: "repayments",
          refId: repaymentId,
        });
      }
      if (principalPart > 0) {
        await db.ledger.add({
          id: uid(),
          groupId: GROUP_ID,
          type: "repayment_principal",
          direction: "in",
          amount: principalPart,
          date: today,
          refTable: "repayments",
          refId: repaymentId,
        });
      }

      // close the loan if fully repaid
      const newPrincipalOut = loan.principal - (await principalRepaid(loanId));
      const newIntOut = await interestOutstanding(loanId);
      if (newPrincipalOut <= 0 && newIntOut <= 0) {
        loan.status = "closed";
        loan.closedDate = today;
        await db.loans.put(loan);
      }
    }
  );
}
