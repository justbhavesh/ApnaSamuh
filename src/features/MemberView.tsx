import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { listMembers, fundSummary } from "../lib/repo";
import { principalOutstanding } from "../lib/loans";
import { currentPeriod } from "../lib/period";
import { formatINR } from "../lib/money";
import { hi } from "../i18n/hi";
import { Card, Metric, StatusChip } from "../components/ui";

// Read-only view for the logged-in member.
export default function MemberView({ memberId }: { memberId: string }) {
  const period = currentPeriod();
  const data = useLiveQuery(async () => {
    const members = await listMembers();
    const me = members.find((m) => m.id === memberId) ?? members[0];
    if (!me) return null;
    const deposit = await db.deposits.where("[memberId+period]").equals([me.id, period]).first();
    const allMine = await db.deposits.where("memberId").equals(me.id).toArray();
    const myTotal = allMine
      .filter((d) => d.status === "paid")
      .reduce((s, d) => s + d.amount, 0);
    const activeLoans = (await db.loans.where("memberId").equals(me.id).toArray()).filter(
      (l) => l.status === "active"
    );
    let myLoan = 0;
    for (const l of activeLoans) myLoan += await principalOutstanding(l);
    const summary = await fundSummary();
    return { me, paid: deposit?.status === "paid", myTotal, myLoan, summary };
  }, [period, memberId]);

  if (!data?.me) return <div className="p-4 text-slate-500">{hi.noMembers}</div>;
  const { me, paid, myTotal, myLoan, summary } = data;

  return (
    <div className="space-y-2.5">
      <Card>
        <div className="text-[15px]">{hi.greeting(me.name)}</div>
      </Card>

      <Card>
        <div className="text-[13px] text-slate-500">{hi.thisMonthDeposit}</div>
        <div className="text-2xl font-medium">{formatINR(me.monthlyAmount)}</div>
        <StatusChip status={paid ? "paid" : "pending"} />
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        <Metric label={hi.myTotalDeposit} value={formatINR(myTotal)} />
        <Metric
          label={hi.myLoan}
          value={formatINR(myLoan)}
          color={myLoan > 0 ? "text-pending" : "text-slate-900"}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Metric label={hi.totalFund} value={formatINR(summary.totalFund)} color="text-fund" />
        <Metric label={hi.availableToLend} value={formatINR(summary.availableToLend)} color="text-paid" />
      </div>

      <div className="text-xs text-slate-400 text-center px-2">{hi.transparency}</div>
    </div>
  );
}
