import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ensureSeed, getGroup } from "./lib/repo";
import { hi } from "./i18n/hi";
import Dashboard from "./features/Dashboard";
import Members from "./features/Members";
import Deposits from "./features/Deposits";
import Loans from "./features/Loans";
import Reports from "./features/Reports";
import Settings from "./features/Settings";
import MemberLogin from "./features/MemberLogin";
import MemberView from "./features/MemberView";
import MemberFund from "./features/MemberFund";
import MemberHistory from "./features/MemberHistory";
import Logo from "./components/Logo";

type Role = "admin" | "member";
type AdminTab = "home" | "members" | "loans" | "deposits" | "reports";
type MemberTab = "account" | "fund" | "history";

export default function App() {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const [adminTab, setAdminTab] = useState<AdminTab>("home");
  const [memberTab, setMemberTab] = useState<MemberTab>("account");
  const [memberSession, setMemberSession] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const group = useLiveQuery(() => getGroup(), []);

  useEffect(() => {
    ensureSeed().then(() => setReady(true));
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const adminTabs: [AdminTab, string, string][] = [
    ["home", hi.home, "🏠"],
    ["members", hi.members, "👥"],
    ["loans", hi.loans, "🪙"],
    ["reports", hi.reports, "📊"],
  ];
  const memberTabs: [MemberTab, string, string][] = [
    ["account", hi.myAccount, "👤"],
    ["fund", hi.fund, "🏦"],
    ["history", hi.history, "🕘"],
  ];

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-100 sm:h-auto sm:min-h-screen sm:overflow-visible sm:items-center sm:gap-3 sm:py-4 sm:px-3">
      {/* role toggle */}
      <div className="shrink-0 self-center flex gap-2 bg-slate-200 p-1 rounded-lg mt-3 mb-2 sm:my-0">
        {(["admin", "member"] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-md text-sm ${
              role === r ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            {r === "admin" ? hi.admin : hi.member}
          </button>
        ))}
      </div>

      {/* phone frame — full-screen on mobile, framed card on desktop */}
      <div className="relative flex flex-col flex-1 w-full min-h-0 bg-white overflow-hidden sm:flex-none sm:w-[360px] sm:max-w-full sm:rounded-[28px] sm:border sm:border-slate-200 sm:shadow-lg">
        <header className="shrink-0 bg-fund text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div>
            <div className="text-[15px] font-medium">{hi.appName}</div>
            <div className="text-[11px] opacity-85">
              {role === "admin" ? group?.name ?? hi.group : hi.member}
            </div>
            </div>
          </div>
          {role === "member" && memberSession ? (
            <button
              onClick={() => setMemberSession(null)}
              className="text-xs opacity-90 underline"
            >
              {hi.logout}
            </button>
          ) : role === "admin" ? (
            <button
              onClick={() => setShowSettings((s) => !s)}
              aria-label={hi.settings}
              className="opacity-90 text-lg"
            >
              ⚙️
            </button>
          ) : (
            <span className="opacity-90">⚙️</span>
          )}
        </header>

        {!online && (
          <div className="bg-amber-100 text-amber-800 text-xs px-4 py-1.5 text-center">
            {hi.offline}
          </div>
        )}

        <main className="flex-1 min-h-0 overflow-y-auto p-3.5 bg-slate-50 sm:flex-none sm:h-[440px]">
          {!ready ? (
            <div className="p-4 text-slate-500">…</div>
          ) : role === "admin" ? (
            showSettings ? (
              <Settings onClose={() => setShowSettings(false)} />
            ) : adminTab === "home" ? (
              <Dashboard onRecord={() => setAdminTab("deposits")} />
            ) : adminTab === "members" ? (
              <Members />
            ) : adminTab === "loans" ? (
              <Loans />
            ) : adminTab === "deposits" ? (
              <Deposits />
            ) : (
              <Reports />
            )
          ) : !memberSession ? (
            <MemberLogin onLogin={setMemberSession} />
          ) : memberTab === "account" ? (
            <MemberView memberId={memberSession} />
          ) : memberTab === "fund" ? (
            <MemberFund />
          ) : (
            <MemberHistory memberId={memberSession} />
          )}
        </main>

        {/* tab bar */}
        <nav className="shrink-0 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
          {role === "admin"
            ? adminTabs.map(([t, label, icon]) => {
                const active = adminTab === t && !showSettings;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setAdminTab(t);
                      setShowSettings(false);
                    }}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 border-t-2 ${
                      active ? "border-fund bg-blue-50" : "border-transparent"
                    }`}
                  >
                    <span className="text-2xl leading-none">{icon}</span>
                    <span
                      className={`text-[13px] font-medium ${
                        active ? "text-fund" : "text-slate-500"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })
            : memberSession
            ? memberTabs.map(([t, label, icon]) => {
                const active = memberTab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setMemberTab(t)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 border-t-2 ${
                      active ? "border-fund bg-blue-50" : "border-transparent"
                    }`}
                  >
                    <span className="text-2xl leading-none">{icon}</span>
                    <span
                      className={`text-[13px] font-medium ${
                        active ? "text-fund" : "text-slate-500"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })
            : null}
        </nav>

        {/* portal target for in-frame modals / sheets */}
        <div id="phone-modal-root" />
      </div>

      <div className="hidden sm:block text-xs text-slate-400 text-center max-w-[360px]">
        ApnaSamuh · डेटा फ़ोन में सुरक्षित (offline-first)
      </div>
    </div>
  );
}
