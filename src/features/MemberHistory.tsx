import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { listMembers } from "../lib/repo";
import { periodLabelHi } from "../lib/period";
import { formatINR } from "../lib/money";
import { hi } from "../i18n/hi";
import { Card, StatusChip } from "../components/ui";

// Deposit history for the logged-in member.
export default function MemberHistory({ memberId }: { memberId: string }) {
  const data = useLiveQuery(async () => {
    const members = await listMembers();
    const me = members.find((m) => m.id === memberId) ?? members[0];
    if (!me) return null;
    const deposits = (await db.deposits.where("memberId").equals(me.id).toArray()).sort(
      (a, b) => b.period.localeCompare(a.period)
    );
    return { me, deposits };
  }, [memberId]);

  if (!data?.me) return <div className="p-4 text-slate-500">{hi.noMembers}</div>;

  return (
    <div className="space-y-2.5">
      <div className="text-sm font-medium">{data.me.name} — {hi.history}</div>
      {data.deposits.length === 0 && (
        <div className="text-slate-500 text-sm py-4 text-center">—</div>
      )}
      {data.deposits.map((d) => (
        <Card key={d.id}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[14px]">{periodLabelHi(d.period)}</div>
              <div className="text-xs text-slate-500">
                {hi.thisMonthDeposit}
                {d.lateFeeCharged > 0 && ` · ${hi.lateFeeLabel} ${formatINR(d.lateFeeCharged)}`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[15px] font-medium">
                {d.status === "paid" ? "+" : ""}
                {formatINR(d.amount)}
              </div>
              <StatusChip status={d.status} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
