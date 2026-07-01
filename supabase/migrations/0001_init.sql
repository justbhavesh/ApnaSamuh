-- ApnaSamuh initial schema. See docs/DATABASE.md for the full rationale.
-- Money stored as integer paise (BIGINT). ledger_entries is append-only.

create extension if not exists "pgcrypto";

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  interest_rate numeric(5,4) not null default 0.02,
  interest_type text not null default 'flat',
  late_fee bigint not null default 10000,   -- ₹100
  due_day int not null default 10,
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  auth_user_id uuid,
  name text not null,
  phone text,
  photo_url text,
  monthly_amount bigint not null check (monthly_amount between 10000 and 100000),
  role text not null default 'member' check (role in ('admin','member')),
  join_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table deposits (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  period date not null,                       -- first day of the month
  amount bigint not null,
  status text not null check (status in ('paid','pending','late')),
  paid_date date,
  late_fee_charged bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (member_id, period)
);

create table loans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  principal bigint not null,
  rate numeric(5,4) not null default 0.02,
  start_date date not null default current_date,
  status text not null default 'active' check (status in ('active','closed')),
  closed_date date,
  created_at timestamptz not null default now()
);

create table interest_charges (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  period date not null,
  outstanding_principal bigint not null,
  amount_due bigint not null,
  amount_paid bigint not null default 0,
  status text not null default 'due' check (status in ('due','paid','overdue')),
  created_at timestamptz not null default now(),
  unique (loan_id, period)
);

create table repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  date date not null default current_date,
  amount bigint not null,
  interest_part bigint not null,
  principal_part bigint not null,
  created_at timestamptz not null default now()
);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  type text not null check (type in
    ('deposit','interest','late_fee','loan_out','repayment_principal',
     'distribution','capital','expense','reversal')),
  direction text not null check (direction in ('in','out')),
  amount bigint not null check (amount >= 0),
  date date not null default current_date,
  ref_table text,
  ref_id uuid,
  note text,
  created_at timestamptz not null default now()
);

-- Money still out on a loan = principal disbursed - principal repaid, per active loan.
create view v_loan_outstanding as
select
  l.id as loan_id,
  m.group_id,
  l.principal - coalesce((
    select sum(r.principal_part) from repayments r where r.loan_id = l.id
  ), 0) as outstanding_principal
from loans l
join members m on l.member_id = m.id
where l.status = 'active';

-- Fund summary view: total fund, money out on loan, available to lend, profit.
create view v_fund_summary as
select
  g.id as group_id,
  coalesce((
    select sum(case when le.direction = 'in' then le.amount else -le.amount end)
    from ledger_entries le where le.group_id = g.id
  ), 0) as total_fund,
  coalesce((
    select sum(lo.outstanding_principal) from v_loan_outstanding lo
    where lo.group_id = g.id
  ), 0) as money_out_on_loan,
  coalesce((
    select sum(le.amount) from ledger_entries le
    where le.group_id = g.id and le.direction = 'in'
      and le.type in ('interest','late_fee')
  ), 0) as accumulated_profit
from groups g;

-- NOTE: enable Row-Level Security and add policies before going live:
--   alter table members enable row level security; (and every table)
--   admin (members.role='admin')  -> full read/write within their group
--   member                        -> read own deposits/loans/repayments
--                                  + read v_fund_summary (totals incl. available_to_lend)
-- Triggers (deposit/loan/repayment -> ledger_entries) keep the ledger automatic.
