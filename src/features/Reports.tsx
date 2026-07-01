import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { fundSummary, getGroup } from "../lib/repo";
import {
  reportData,
  memberStatements,
  previewDistribution,
  distributeProfit,
} from "../lib/reports";
import type { DistributionRule } from "../domain/distribution";
import { formatINR } from "../lib/money";
import { shareOnWhatsapp } from "../lib/slip";
import { hi } from "../i18n/hi";
import { Card, Metric } from "../components/ui";

export default function Reports() {
  const summary = useLiveQuery(() => fundSummary(), []);
  const report = useLiveQuery(() => reportData(), []);
  const statements = useLiveQuery(() => memberStatements(), []);
  const group = useLiveQuery(() => getGroup(), []);

  const [rule, setRule] = useState<DistributionRule>("proportional");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewDistribution>> | null>(null);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => setModalRoot(document.getElementById("phone-modal-root")), []);

  async function openPreview() {
    setPreview(await previewDistribution(rule));
  }

  async function confirmDistribute() {
    await distributeProfit(rule);
    setPreview(null);
  }

  function share() {
    if (!report || !summary) return;
    const text =
      `📊 ${group?.name ?? hi.appName}\n` +
      `कुल कोष: ${formatINR(summary.totalFund)}\n` +
      `कर्ज देने योग्य: ${formatINR(summary.availableToLend)}\n` +
      `कर्ज बाहर: ${formatINR(summary.moneyOutOnLoan)}\n` +
      `कुल जमा: ${formatINR(report.totalDeposits)}\n` +
      `कुल ब्याज लाभ: ${formatINR(report.totalInterest)}\n` +
      `विलंब शुल्क: ${formatINR(report.totalLateFees)}\n` +
      `बाँटने योग्य लाभ: ${formatINR(report.undistributedProfit)}`;
    shareOnWhatsapp(text);
  }

  if (!summary || !report || !statements)
    return <div className="p-4 text-slate-500">…</div>;

  return (
    <div className="space-y-2.5">
      <div className="text-sm font-medium">{hi.reports}</div>

      <div className="grid grid-cols-2 gap-2.5">
        <Metric label={hi.totalFund} value={formatINR(summary.totalFund)} color="text-fund" />
        <Metric label={hi.availableToLend} value={formatINR(summary.availableToLend)} color="text-paid" />
        <Metric label={hi.totalDeposits} value={formatINR(report.totalDeposits)} />
        <Metric label={hi.totalInterestProfit} value={formatINR(report.totalInterest)} color="text-paid" />
        <Metric label={hi.totalLateFeesLabel} value={formatINR(report.totalLateFees)} color="text-paid" />
        <Metric label={hi.activeLoansLabel} value={String(report.activeLoanCount)} />
      </div>

      <button
        onClick={share}
        className="w-full border border-slate-300 py-2.5 rounded-lg text-sm active:scale-[0.98] transition"
      >
        📲 {hi.shareReport}
      </button>

      {/* profit distribution */}
      <Card>
        <div className="text-sm font-medium mb-1">{hi.profitDistribution}</div>
        <div className="text-xs text-slate-500 mb-1">{hi.undistributedProfit}</div>
        <div className="text-2xl font-medium text-paid mb-2">
          {formatINR(report.undistributedProfit)}
        </div>

        {report.undistributedProfit > 0 ? (
          <>
            <div className="flex gap-2 mb-2">
              {(["proportional", "equal"] as DistributionRule[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRule(r)}
                  className={`flex-1 py-2 rounded-lg text-[13px] border ${
                    rule === r
                      ? "bg-fund text-white border-fund"
                      : "border-slate-300 text-slate-600"
                  }`}
                >
                  {r === "proportional" ? hi.ruleProportional : hi.ruleEqual}
                </button>
              ))}
            </div>
            <button
              onClick={openPreview}
              className="w-full border border-slate-300 py-2.5 rounded-lg text-sm"
            >
              {hi.previewDistribution}
            </button>
          </>
        ) : (
          <div className="text-xs text-slate-400">{hi.noProfitToShare}</div>
        )}
      </Card>

      {/* per-member statements */}
      <div className="text-sm font-medium pt-1">{hi.memberStatements}</div>
      {statements.map((s) => (
        <Card key={s.memberId}>
          <div className="flex justify-between items-center">
            <span className="text-[15px]">{s.name}</span>
            <span className="text-xs text-slate-500">{s.depositCount} {hi.history}</span>
          </div>
          <div className="flex justify-between text-[13px] mt-1">
            <span className="text-slate-500">
              {hi.totalDeposits}: <b className="text-slate-900">{formatINR(s.totalDeposits)}</b>
            </span>
            <span className="text-slate-500">
              {hi.loanOutstanding}:{" "}
              <b className={s.outstandingLoan > 0 ? "text-pending" : "text-slate-900"}>
                {formatINR(s.outstandingLoan)}
              </b>
            </span>
          </div>
        </Card>
      ))}

      {/* distribution preview / confirm */}
      {preview &&
        modalRoot &&
        createPortal(
          <div className="absolute inset-0 bg-black/45 flex items-end z-50">
            <div className="bg-white w-full rounded-t-2xl p-4 space-y-3 max-h-[90%] overflow-y-auto">
              <div className="text-[15px] font-medium">
                {hi.profitDistribution}: {formatINR(preview.profit)}
              </div>
              <div className="space-y-1.5">
                {preview.shares.map((s) => (
                  <div key={s.memberId} className="flex justify-between text-[14px]">
                    <span>{s.name}</span>
                    <b>{formatINR(s.share)}</b>
                  </div>
                ))}
              </div>
              <div className="text-xs text-late">{hi.confirmDistribute}</div>
              <div className="flex gap-2">
                <button onClick={confirmDistribute} className="flex-1 bg-paid text-white py-3 rounded-lg">
                  {hi.distribute}
                </button>
                <button onClick={() => setPreview(null)} className="flex-1 border border-slate-300 py-3 rounded-lg">
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
