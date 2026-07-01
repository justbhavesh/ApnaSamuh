import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-3 ${className}`}>
      {children}
    </div>
  );
}

export function Metric({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-slate-100 rounded-lg p-2.5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-medium ${color}`}>{value}</div>
    </div>
  );
}

type Status = "paid" | "pending" | "late";

const statusMeta: Record<Status, { dot: string; text: string; label: string }> = {
  paid: { dot: "bg-paid", text: "text-paid", label: "भुगतान हुआ" },
  pending: { dot: "bg-pending", text: "text-pending", label: "बाकी है" },
  late: { dot: "bg-late", text: "text-late", label: "देर" },
};

export function StatusDot({ status }: { status: Status }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusMeta[status].dot}`} />;
}

export function StatusChip({ status }: { status: Status }) {
  const m = statusMeta[status];
  return <span className={`text-xs ${m.text}`}>{m.label}</span>;
}

export function PrimaryButton({
  children,
  onClick,
  color = "bg-paid",
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full ${color} text-white py-3 rounded-lg text-[15px] active:scale-[0.98] transition`}
    >
      {children}
    </button>
  );
}
