import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { listMembers, addMember } from "../lib/repo";
import { setMemberPin } from "../lib/auth";
import { formatINR, rupeesToPaise } from "../lib/money";
import { hi } from "../i18n/hi";
import { Card, StatusDot } from "../components/ui";

export default function Members() {
  const members = useLiveQuery(() => listMembers(), []);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [pinFor, setPinFor] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");

  async function savePin(id: string) {
    if (pinValue.trim().length < 4) return;
    await setMemberPin(id, pinValue);
    setPinFor(null);
    setPinValue("");
  }

  async function submit() {
    const amt = Number(amount);
    if (!name.trim() || !amt || amt < 100 || amt > 1000) return;
    await addMember(name, phone, rupeesToPaise(amt));
    setName("");
    setPhone("");
    setAmount("");
    setAdding(false);
  }

  if (!members) return <div className="p-4 text-slate-500">…</div>;

  return (
    <div className="space-y-2.5">
      <div className="text-sm font-medium">{hi.memberCount(members.length)}</div>

      {members.length === 0 && !adding && (
        <div className="text-slate-500 text-sm py-6 text-center">{hi.noMembers}</div>
      )}

      {members.map((m) => (
        <Card key={m.id}>
          <div className="flex items-center gap-2.5">
            <StatusDot status={m.pinHash ? "paid" : "pending"} />
            <div className="flex-1">
              <div className="text-[15px]">{m.name}</div>
              <div className="text-xs text-slate-500">
                {hi.monthly}: {formatINR(m.monthlyAmount)} · {m.phone}
              </div>
            </div>
            <button
              onClick={() => {
                setPinFor(pinFor === m.id ? null : m.id);
                setPinValue("");
              }}
              className="text-xs border border-slate-300 rounded-md px-2 py-1"
            >
              {hi.setPin}
              {m.pinHash ? " ✓" : ""}
            </button>
          </div>
          {pinFor === m.id && (
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-[15px] tracking-widest"
                placeholder={hi.newPin}
                inputMode="numeric"
                type="password"
                maxLength={6}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value)}
              />
              <button onClick={() => savePin(m.id)} className="bg-paid text-white px-4 rounded-lg text-sm">
                {hi.save}
              </button>
            </div>
          )}
        </Card>
      ))}

      {adding ? (
        <Card className="space-y-2">
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px]"
            placeholder={hi.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px]"
            placeholder={hi.phone}
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px]"
            placeholder={hi.monthlyAmount}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-paid text-white py-2.5 rounded-lg">
              {hi.save}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="flex-1 border border-slate-300 py-2.5 rounded-lg"
            >
              {hi.cancel}
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-slate-400 text-fund py-3 rounded-lg text-sm"
        >
          + {hi.addMember}
        </button>
      )}
    </div>
  );
}
