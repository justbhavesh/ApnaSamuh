# ApnaSamuh — स्वयं सहायता समूह

An **offline-first Hindi PWA** for running a village **self-help savings & lending fund**
(the kind many villages keep on paper). One admin (**कोषाध्यक्ष**) records everything;
members get a read-only view of their own account and the shared fund.

🔗 **Live app:** https://apnasamuh.netlify.app
📱 Installable on Android — open the link in Chrome → menu → **Add to Home screen**.

## Features

- **Members** — per-member monthly amount (₹100–₹1,000).
- **Deposits** — record each month's deposit; automatic late fee after the group's due
  date, based on the actual payment date.
- **Loans** — give a loan (blocked if it exceeds the amount available to lend), with a
  per-loan interest-rate snapshot.
- **Interest** — monthly interest accrues on outstanding principal (idempotent, no
  double-charging).
- **Repayments** — interest-first split, principal after; the loan closes automatically
  at zero.
- **Dashboard** — कुल कोष, कर्ज देने योग्य (available to lend), कर्ज बाहर, and accumulated profit.
- **Reports** — totals, per-member statements, and **profit distribution**
  (proportional or equal, rounding-safe).
- **Member login** — the कोषाध्यक्ष sets a per-member PIN; members log in with phone + PIN.
- **WhatsApp slips** — share a deposit/report summary as text.
- **Settings** — edit group name, due date, late fee, and interest rate.
- Works **fully offline**; data is stored on the device. Installable, full-screen on mobile.

## Tech stack

React + TypeScript + Vite · Tailwind CSS · Dexie (IndexedDB) · vite-plugin-pwa (Workbox) ·
Vitest. PIN hashing uses a pure-JS SHA-256 so it works over plain HTTP on a LAN.

## Run locally

```bash
npm install
npm run dev      # dev server (add --host to reach it from a phone on the same Wi-Fi)
npm run test     # domain-logic unit tests
npm run build    # production build -> dist/
```

## Architecture

- `src/domain/` — pure, unit-tested money logic: `interest`, `deposits`, `fund`,
  `distribution`.
- `src/lib/` — paise/money helpers, Dexie store (`db.ts`), repository (`repo.ts`),
  loans (`loans.ts`), reports (`reports.ts`), auth + `sha256`, period + slip helpers.
- `src/features/` — Dashboard, Members, Deposits, Loans, Reports, Settings, and the
  member screens (Login, Account, Fund, History).
- `src/components/` — shared UI + the gullak `Logo`.
- `src/i18n/hi.ts` — all Hindi strings.
- `supabase/migrations/` — Postgres schema for the planned cloud-sync phase.

**Accounting model:** all money is stored as integer **paise** to avoid rounding errors,
and the fund balance is derived from an **append-only ledger** (never edited in place;
corrections are reversing entries). Invariant: `कुल कोष = कर्ज देने योग्य + कर्ज बाहर`.

## Roadmap

Done: deposits, loans + interest, repayments, reports, profit distribution, member PIN
login, logo, installable/offline PWA — all verified, with 19 passing unit tests.

Next: **Supabase cloud sync** so members can read their accounts on their *own* phones
(admin pushes, members pull), with server-side PIN verification and per-group row-level
security. Then: export/backup and a pilot alongside the paper register.
