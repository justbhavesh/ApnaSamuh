import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getGroup, updateGroup } from "../lib/repo";
import { formatINR, rupeesToPaise } from "../lib/money";
import { hi } from "../i18n/hi";
import { Card } from "../components/ui";

export default function Settings({ onClose }: { onClose: () => void }) {
  const group = useLiveQuery(() => getGroup(), []);
  const [name, setName] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [rate, setRate] = useState("");
  const [saved, setSaved] = useState(false);

  // seed the form once the group loads
  useEffect(() => {
    if (!group) return;
    setName(group.name);
    setDueDay(String(group.dueDay));
    setLateFee(String(group.lateFee / 100));
    setRate(String(group.interestRate * 100));
  }, [group]);

  async function save() {
    const day = Math.min(28, Math.max(1, Number(dueDay) || 1));
    await updateGroup({
      name: name.trim() || "ग्राम कोष",
      dueDay: day,
      lateFee: rupeesToPaise(Number(lateFee) || 0),
      interestRate: (Number(rate) || 0) / 100,
    });
    setSaved(true);
    // brief confirmation, then return to the screen the ⚙️ was opened from
    setTimeout(() => onClose(), 700);
  }

  if (!group) return <div className="p-4 text-slate-500">…</div>;

  const label = "text-xs text-slate-500 mb-1";
  const input = "w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px]";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{hi.settings}</div>
        <button onClick={onClose} className="text-xs text-fund">
          {hi.back}
        </button>
      </div>

      <Card className="space-y-3">
        <div>
          <div className={label}>{hi.groupName}</div>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <div className={label}>{hi.dueDate}</div>
          <input
            className={input}
            inputMode="numeric"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
        </div>
        <div>
          <div className={label}>{hi.lateFeeAmount}</div>
          <input
            className={input}
            inputMode="numeric"
            value={lateFee}
            onChange={(e) => setLateFee(e.target.value)}
          />
        </div>
        <div>
          <div className={label}>{hi.interestRatePercent}</div>
          <input
            className={input}
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>

        <div className="bg-blue-50 text-fund rounded-lg p-2.5 text-xs">
          {hi.dueDateHint(
            Math.min(28, Math.max(1, Number(dueDay) || 1)),
            formatINR(rupeesToPaise(Number(lateFee) || 0))
          )}
        </div>

        <button onClick={save} className="w-full bg-fund text-white py-3 rounded-lg text-[15px]">
          {saved ? hi.saved : hi.save}
        </button>
      </Card>
    </div>
  );
}
