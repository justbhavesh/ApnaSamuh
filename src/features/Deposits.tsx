import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { monthlyDeposits, recordDeposit, fundSummary, getGroup } from "../lib/repo";
import { isLate, amountOwed, DEFAULT_LATE_FEE } from "../domain/deposits";
import { currentPeriod, periodLabelHi } from "../lib/period";
import { formatINR } from "../lib/money";
import { depositSlip, shareOnWhatsapp } from "../lib/slip";
import { hi } from "../i18n/hi";
import { Card, StatusDot, StatusChip } from "../components/ui";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};
const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function Deposits() {
  const period = currentPeriod();
  const rows = useLiveQuery(() => monthlyDeposits(period), [period]);
  const group = useLiveQuery(() => getGroup(), []);
  const [confirm, setConfirm] = useState<{ id: string; name: string; monthlyAmount: number } | null>(null);
  const [payDate, setPayDate] = useState(todayStr());
  const [lastSlip, setLastSlip] = useState<string | null>(null);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setModalRoot(document.getElementById("phone-modal-root"));
  }, []);

  const dueDay = group?.dueDay ?? 10;
  const lateFee = group?.lateFee ?? DEFAULT_LATE_FEE;

  // fine is decided by the chosen payment date vs the group's fixed due day
  const late = confirm ? isLate(dueDay, parseDate(payDate)) : false;
  const fee = late ? lateFee : 0;
  const owed = confirm ? amountOwed(confirm.monthlyAmount, late, lateFee) : 0;

  async function take() {
    if (!confirm) return;
    await recordDeposit(confirm.id, period, parseDate(payDate));
    const summary = await fundSummary();
    setLastSlip(
      depositSlip(group?.name ?? hi.appName, confirm.name, confirm.monthlyAmount, fee, summary.totalFund)
    );
    setConfirm(null);
  }

  if (!rows) return <div className="p-4 text-slate-500">…</div>;

  return (
    <div className="space-y-2.5">
      <div className="text-sm font-medium">{periodLabelHi(period)} — जमा</div>

      {rows.map((r) => (
        <Card key={r.member.id}>
          <div className="flex items-center gap-2.5">
            <StatusDot status={r.status} />
            <div className="flex-1">
              <div className="text-[15px]">{r.member.name}</div>
              <div className={`text-xs ${r.lateFee > 0 ? "text-late" : "text-slate-500"}`}>
                {formatINR(r.member.monthlyAmount)}
                {r.lateFee > 0 && ` + ${formatINR(r.lateFee)} ${hi.lateFeeLabel}`}
              </div>
            </div>
            {r.status === "paid" ? (
              <span className="text-paid text-xl">✓</span>
            ) : (
              <button
                onClick={() => {
                  setPayDate(todayStr());
                  setConfirm({
                    id: r.member.id,
                    name: r.member.name,
                    monthlyAmount: r.member.monthlyAmount,
                  });
                }}
                className="bg-paid text-white px-4 py-2 rounded-md text-sm"
              >
                {hi.take}
              </button>
            )}
          </div>
          {r.status !== "paid" && <StatusChip status={r.status} />}
        </Card>
      ))}

      {lastSlip && (
        <Card className="!bg-green-50 border-green-200">
          <div className="text-paid text-sm mb-2">{hi.recorded}</div>
          <button
            onClick={() => shareOnWhatsapp(lastSlip)}
            className="w-full border border-green-300 text-paid py-2 rounded-lg text-sm"
          >
            📲 {hi.sendWhatsapp}
          </button>
        </Card>
      )}

      {confirm &&
        modalRoot &&
        createPortal(
          <div className="absolute inset-0 bg-black/45 flex items-end z-50">
            <div className="bg-white w-full rounded-t-2xl p-4 space-y-3">
              <div className="text-[15px] text-center">
                {hi.confirmTake(confirm.name, formatINR(owed))}
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1">{hi.paymentDate}</div>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px]"
                />
              </div>

              <div
                className={`text-center text-[13px] rounded-lg py-1.5 ${
                  late ? "bg-red-50 text-late" : "bg-green-50 text-paid"
                }`}
              >
                {late ? hi.lateWithFee(formatINR(lateFee)) : hi.onTime}
              </div>

              <div className="flex gap-2">
                <button onClick={take} className="flex-1 bg-paid text-white py-3 rounded-lg">
                  {hi.yes}
                </button>
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 border border-slate-300 py-3 rounded-lg"
                >
                  {hi.no}
                </button>
              </div>
            </div>
          </div>,
          modalRoot
        )}
    </div>
  );
}
