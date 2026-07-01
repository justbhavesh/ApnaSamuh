import { useLiveQuery } from "dexie-react-hooks";
import { fundSummary, listMembers } from "../lib/repo";
import { formatINR } from "../lib/money";
import { hi } from "../i18n/hi";
import { Card, Metric } from "../components/ui";

// Read-only fund overview for members — full transparency on the group's money.
export default function MemberFund() {
  const summary = useLiveQuery(() => fundSummary(), []);
  const memberCount = useLiveQuery(async () => (await listMembers()).filter((m) => m.active).length, []);

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
      <div className="grid grid-cols-2 gap-2.5">
        <Metric label={hi.member} value={String(memberCount ?? "…")} />
        <Metric label={hi.accumulatedProfit} value={formatINR(summary.accumulatedProfit)} color="text-paid" />
      </div>
      <div className="text-xs text-slate-400 text-center px-2">{hi.transparency}</div>
    </div>
  );
}
