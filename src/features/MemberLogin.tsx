import { useState } from "react";
import { verifyMemberPin } from "../lib/auth";
import { hi } from "../i18n/hi";
import { Card } from "../components/ui";

// Phone + PIN login for members. The कोषाध्यक्ष sets each member's PIN.
export default function MemberLogin({ onLogin }: { onLogin: (memberId: string) => void }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const id = await verifyMemberPin(phone, pin);
    if (id) onLogin(id);
    else setError(hi.loginFailed);
  }

  return (
    <div className="space-y-3 pt-4">
      <div className="text-center text-slate-600 text-sm">{hi.login}</div>
      <Card className="space-y-2.5">
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-[15px]"
          placeholder={hi.enterPhone}
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-[15px] tracking-widest"
          placeholder={hi.enterPin}
          inputMode="numeric"
          type="password"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        {error && <div className="text-xs text-late">{error}</div>}
        <button onClick={submit} className="w-full bg-fund text-white py-3 rounded-lg text-[15px]">
          {hi.loginBtn}
        </button>
        <div className="text-xs text-slate-400 text-center">{hi.memberLoginHint}</div>
      </Card>
    </div>
  );
}
