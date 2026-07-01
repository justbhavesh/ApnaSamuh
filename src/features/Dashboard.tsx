import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { fundSummary } from "../lib/repo";
import { currentPeriod } from "../lib/period";
import { formatINR } from "../lib/money";
import { hi } from "../i18n/hi";
import { Card, Metric, PrimaryButton } from "../components/ui";

export default function Dashboard({ onRecord }: { onRecord: () => void }) {
  const summary = useLiveQuery(() => fundSummary(), []);
  const period = currentPeriod();

  const counts = useLiveQuery(async () => {
    const members = await db.members.where("groupId").equals("default-group").toArray();
    const active = members.filter((m) => m.active);
    let paid = 0;
    for (const m of active) {
      const d = await db.deposits.where("[memberId+period]").equals([m.id, period]).first();
      if (d?.status === "paid") paid++;
    }
    return { paid, total: active.length };
  }, [period]);

  if (!summary) return <div className="p-4 text-slate-500">…</div>;

  return (
    <div className="space-y-2.5">
      <Card>
        <div className="text-[13px] text-slate-500">{hi.totalFund}</div>
        <div className="text-3xl font-medium text-fund">{formatINR(summary.totalFund)}</div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        <Metric label={hi.availableToLend} value={formatINR(summary.availableToLend)} color="text-paid" />
        <Metric label={hi.outOnLoan} value={formatINR(summary.moneyOutOnLoan)} color="text-pending" />
      </div>

      <Card>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-sm">{hi.thisMonthDeposit}</span>
          <span className="text-sm font-medium">
            {counts ? `${counts.paid} / ${counts.total} ✅` : "…"}
          </span>
        </div>
        <PrimaryButton onClick={onRecord}>💰 {hi.recordDeposit}</PrimaryButton>
      </Card>

      <Metric label={hi.accumulatedProfit} value={formatINR(summary.accumulatedProfit)} color="text-paid" />
    </div>
  );
}
