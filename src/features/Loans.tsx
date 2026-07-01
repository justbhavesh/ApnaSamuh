import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { listMembers, fundSummary, getGroup } from "../lib/repo";
import {
  listActiveLoans,
  addLoan,
  recordRepayment,
  InsufficientFundsError,
  type LoanView,
} from "../lib/loans";
import { formatINR, rupeesToPaise } from "../lib/money";
import { splitRepayment } from "../domain/interest";
import { hi } from "../i18n/hi";
import { Card, Metric, PrimaryButton } from "../components/ui";

// A monthly rate stored as 0.02 -> "2" (or "2.5"), rounding away float noise.
const pctLabel = (rate: number) => String(Math.round(rate * 10000) / 100);

export default function Loans() {
  const loans = useLiveQuery(() => listActiveLoans(), []);
  const members = useLiveQuery(() => listMembers(), []);
  const summary = useLiveQuery(() => fundSummary(), []);
  const group = useLiveQuery(() => getGroup(), []);

  const [adding, setAdding] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const [repayFor, setRepayFor] = useState<LoanView | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => setModalRoot(document.getElementById("phone-modal-root")), []);

  async function give() {
    setError("");
    const amt = Number(amount);
    if (!memberId || !amt || amt <= 0) return;
    try {
      await addLoan(memberId, rupeesToPaise(amt));
      setAdding(false);
      setMemberId("");
      setAmount("");
    } catch (e) {
      if (e instanceof InsufficientFundsError) setError(hi.insufficientFunds);
      else throw e;
    }
  }

  function openRepay(v: LoanView) {
    setRepayFor(v);
    setRepayAmount(String(v.interestOutstanding / 100)); // default = interest due
  }

  async function doRepay() {
    if (!repayFor) return;
    const paise = rupeesToPaise(Number(repayAmount) || 0);
    if (paise <= 0) return;
    await recordRepayment(repayFor.loan.id, paise);
    setRepayFor(null);
  }

  if (!loans || !members || !summary) return <div className="p-4 text-slate-500">…</div>;

  const preview =
    repayFor && Number(repayAmount) > 0
      ? splitRepayment(rupeesToPaise(Number(repayAmount)), repayFor.interestOutstanding)
      : null;

  return (
    <div className="space-y-2.5">
      <div className="text-sm font-medium">{hi.loans}</div>

      {loans.length === 0 && (
        <div className="text-slate-500 text-sm py-4 text-center">{hi.noLoans}</div>
      )}

      {loans.map((v) => (
        <Card key={v.loan.id}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[15px]">{v.memberName}</span>
            <span className="text-xs text-pending">{hi.active}</span>
          </div>
          <div className="text-xs text-slate-500 mb-2">
            {hi.outstandingPrincipal}: <b>{formatINR(v.principalOutstanding)}</b> · {hi.ratePerMonth(pctLabel(v.loan.rate))}
          </div>
          <div className="flex justify-between text-[13px] mb-2.5">
            <span>
              {hi.thisMonthInterest}:{" "}
              <b className="text-late">{formatINR(v.interestOutstanding)}</b>
            </span>
          </div>
          <button
            onClick={() => openRepay(v)}
            className="w-full border border-slate-300 py-2.5 rounded-lg text-sm active:scale-[0.98] transition"
          >
            {hi.recordRepayment}
          </button>
        </Card>
      ))}

      <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-paid">
        {hi.availableToLend}: {formatINR(summary.availableToLend)} ✅
      </div>

      {adding ? (
        <Card className="space-y-2">
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px] bg-white"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          >
            <option value="">{hi.selectMember}</option>
            {members
              .filter((m) => m.active)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px]"
            placeholder={hi.loanAmount}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="text-xs text-slate-500">{hi.ratePerMonth(pctLabel(group?.interestRate ?? 0.02))}</div>
          {error && <div className="text-xs text-late">{error}</div>}
          <div className="flex gap-2">
            <button onClick={give} className="flex-1 bg-fund text-white py-2.5 rounded-lg">
              {hi.giveLoan}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setError("");
              }}
              className="flex-1 border border-slate-300 py-2.5 rounded-lg"
            >
              {hi.cancel}
            </button>
          </div>
        </Card>
      ) : (
        <PrimaryButton color="bg-fund" onClick={() => setAdding(true)}>
          + {hi.newLoan}
        </PrimaryButton>
      )}

      {repayFor &&
        modalRoot &&
        createPortal(
          <div className="absolute inset-0 bg-black/45 flex items-end z-50">
            <div className="bg-white w-full rounded-t-2xl p-4 space-y-3">
              <div className="text-[15px] font-medium">{repayFor.memberName}</div>
              <div className="grid grid-cols-2 gap-2.5">
                <Metric label={hi.outstandingPrincipal} value={formatINR(repayFor.principalOutstanding)} />
                <Metric
                  label={hi.thisMonthInterest}
                  value={formatINR(repayFor.interestOutstanding)}
                  color="text-late"
                />
              </div>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px]"
                placeholder={hi.repayAmount}
                inputMode="numeric"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
              />
              {preview && (
                <div className="bg-blue-50 text-fund rounded-lg p-2 text-[13px]">
                  {hi.repaySplit(formatINR(preview.interestPart), formatINR(preview.principalPart))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={doRepay} className="flex-1 bg-paid text-white py-3 rounded-lg">
                  {hi.recordRepayment}
                </button>
                <button
                  onClick={() => setRepayFor(null)}
                  className="flex-1 border border-slate-300 py-3 rounded-lg"
                >
                  {hi.cancel}
                </button>
              </div>
            </div>
          </div>,
          modalRoot
        )}
    </div>
  );
}
