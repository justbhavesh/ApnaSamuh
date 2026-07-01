# ApnaSamuh — स्वयं सहायता समूह

Village self-help fund (savings + lending) app. Hindi UI, installable PWA,
offline-first. One admin (कोषाध्यक्ष) records; members view.

Project docs live in [`../docs/`](../docs/README.md). Progress: [`../PROGRESS.md`](../PROGRESS.md).

## Run

```bash
npm install
npm run dev      # start dev server
npm run test     # run domain-logic unit tests
npm run build    # production build
```

## Phase 1 (current)

Works fully **offline on local storage (Dexie/IndexedDB)** — no backend needed yet:
- Members (per-member ₹100–₹1,000 monthly amount)
- Record monthly deposits, with automatic ₹100 late fee after the due day
- Dashboard: कुल कोष, available-to-lend, accumulated profit, this-month count
- WhatsApp slip after recording a deposit
- Member read-only view (account + fund totals incl. कर्ज देने योग्य)
- Offline banner

Sample data is seeded on first run. To reset, clear the site's IndexedDB in the browser.

## Architecture

- `src/domain/` — pure money logic (interest, deposits, fund), unit-tested.
- `src/lib/` — money/paise helpers, Dexie store (`db.ts`), repository (`repo.ts`),
  period + slip helpers.
- `src/features/` — Dashboard, Members, Deposits, MemberView screens.
- `src/i18n/hi.ts` — all Hindi strings.
- `supabase/migrations/` — Postgres schema for the cloud sync phase.

Money is stored as integer **paise** everywhere to avoid rounding errors.

## Next phases

See [`../PROGRESS.md`](../PROGRESS.md): Phase 2 (loans + interest),
Phase 3 (member login + reports + Supabase sync), Phase 4 (polish + pilot).
