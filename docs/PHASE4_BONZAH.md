# Phase 4 — Coverage + Bonzah soft-embed + e-sign

**Status:** Designed · **Companion:** [ROADMAP.md](./ROADMAP.md), [REQUIREMENTS.md](./REQUIREMENTS.md) §7  
**API source:** [insillion/bonzah/api](https://github.com/insillion/bonzah/tree/main/api)  
**Sandbox host:** `https://bonzah.sb.insillion.com`  
**Partner portal:** `https://bonzah.sb.insillion.com/bb1/`

This is the build design for Phase 4. Legal/partner sign-off (Phase 0) still gates **production** launch; sandbox integration can proceed in parallel.

---

## 1. Goal

A trip cannot become ready for pickup until:

1. **Coverage is verified** — either admin-approved own-policy proof **or** a Bonzah-issued BORD (`policy_no`) with downloadable PDFs on file, and  
2. **Rental agreement is e-signed** (plus Bonzah addendum wording when protection is purchased).

**Done when:** end-to-end sandbox booking issues a Bonzah policy, stores `policy_no` + PDF refs on the trip, blocks “ready for pickup” without them (and without a signed agreement), and the own-policy path still works with real Storage + admin verify.

---

## 2. Product decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Integration style | **Soft embed** (Rové UI → Bonzah API server-side) | Matches Integration Partner terms; we never “sell” insurance as insurer |
| Protection product | Replace flat `$24/day` stub with **live Bonzah premium** | API `premiumCalc` / quote returns real rates |
| Coverage paths | Keep **own** + **protection** | Own path for renters with valid personal coverage; protection = Bonzah |
| Who buys | **Renter** buys Bonzah coverage for the trip dates | Fleet/Roamly gap stays Phase 0 / broker conversation — not this phase’s code |
| When policy must exist | **Before pickup** (hard gate). Prefer issue at/after checkout so dates match the paid trip | Partner terms: buy before pickup; BORD = proof |
| Rental day count | **24-hour periods** from pickup time (`ceil(hours/24)`) | Matches agency-style rentals and Bonzah 24h cycles |
| Secrets | **Supabase Edge Functions only** — never `VITE_*` | Auth email/password must not ship to the browser |
| Card collection | Renter pays insurance premium via **Stripe** (same checkout) or a dedicated line item; Rové settles Bonzah via `POST …/payment` with cash/`payment_id` | Bonzah payment API is settle-to-issue, not a card form |
| Disclosure | Unaltered Bonzah POS copy, flyer links, excluded-vehicle link, broker disclosure | Required by compliance PDF + API readme |

**Credentials:** Sandbox login was confirmed working against `POST /api/v1/auth`. Store as Edge secrets `BONZAH_HOST`, `BONZAH_EMAIL`, `BONZAH_PASSWORD` — never commit passwords to git or docs.

---

## 3. Renter UX flow

```
Browse → Car detail → Insurance → Checkout → (Stripe) → Confirmed
                              │                │
                              │                └─ if protection: after paid trip,
                              │                   finalize quote + Bonzah payment
                              │                   → store BORD / PDFs
                              │
                              └─ select path + ack (+ Bonzah product UI if protection)
```

### 3.1 Insurance screen (`/insurance`)

**Path A — Own insurance**

- Upload proof to Supabase Storage (required to continue).
- Acknowledgment checkbox (Rové is not the insurer).
- Trip leaves checkout as `coverage_pending` until admin verifies → `coverage_verified`.

**Path B — Bonzah trip protection** (replaces “Rové trip protection $24/day”)

1. Show required POS content (CDW / RCLI / SLI / PAI names, italic blurbs, limits, exclusions) with links to [flyers](https://github.com/insillion/bonzah/blob/main/README.md) and [excluded vehicles](https://bonzah.com/included-and-restricted-vehicle-types).
2. Renter toggles covers (`cdw`, `rcli`, `sli` only with `rcli`, `pai` if allowed for state).
3. Call **premium preview** (Edge Function) with trip dates + pickup/residence state → show live total (not hardcoded $24).
4. Collect missing insured fields if not already on profile: DOB, address, phone (11-digit), license #/state (preferred).
5. Same acknowledgment + Bonzah disclosure / terms links.
6. On continue: store selection in booking state; create draft quote optionally at checkout time.

### 3.2 Checkout

- Line item: **Insurance premium** = Bonzah `total_premium` (Path B) instead of stub protection.
- Trip rental + service fee + deposit hold remain as today.
- Stripe Checkout: charge trip + insurance premium; deposit hold separate (unchanged).

### 3.3 After successful payment (webhook / Edge)

For Path B:

1. Auth Bonzah → finalize quote (`finalize: 1`) with trip + renter + vehicle + covers.  
2. `POST /api/v1/Bonzah/payment` with `payment_id` + `amount`.  
3. Persist `policy_no` (BORD…), `policy_id`, PDF ids, premium paid.  
4. Set coverage `verification_status = verified`, trip toward `coverage_verified` (or keep `coverage_pending` only if Bonzah call fails — surface retry to admin).

For Path A: unchanged — stay `coverage_pending` until admin approve.

### 3.4 Confirmed / Trips / pickup gate

- Show BORD number + “Download certificates” when Path B.
- **Ready for pickup** requires: `coverage_verified` **and** agreement `signed_at` set.
- Owner “Mark picked up” / reveal exact address blocked until both clear.

### 3.5 E-sign

- Generate trip agreement PDF (template + Bonzah addendum when Path B).
- Capture signature (simple canvas/typed e-sign v1 is enough if attorney OK; else HelloSign/DocuSign later).
- Store file + `signed_at`; advance trip to `agreement_signed` → `confirmed`.

---

## 4. Architecture

```
Browser (React)
  │  anon key only
  ▼
Supabase (DB + Storage + Auth)
  │
  ├─ Edge: bonzah-auth-token (internal helper)
  ├─ Edge: bonzah-premium      ← preview rates
  ├─ Edge: bonzah-quote        ← draft / finalize
  ├─ Edge: bonzah-settle       ← payment → issue policy
  ├─ Edge: bonzah-policy-pdf   ← proxy PDF download
  ├─ Edge: stripe-webhook      ← after paid: settle Bonzah if needed
  └─ Edge: admin-verify-coverage (Path A)
```

**Rules**

- All Bonzah HTTP calls use server secrets + `in-auth-token`.
- Re-auth before each Bonzah transaction (token ~15 min idle).
- Never log full license numbers or DOB in client analytics.
- Idempotency: store `bonzah_quote_id` / `bonzah_payment_id` on `coverages` so webhook retries don’t double-issue.

---

## 5. Data model (migration sketch)

Extend `coverages` (and optionally `profiles` for reusable insured fields):

```sql
-- coverages additions
alter table public.coverages
  add column if not exists bonzah_quote_id text,
  add column if not exists bonzah_payment_id text,
  add column if not exists bonzah_policy_id text,
  add column if not exists bonzah_policy_no text,           -- BORD…
  add column if not exists bonzah_covers jsonb default '{}', -- {cdw,rcli,sli,pai}
  add column if not exists bonzah_premium numeric(10,2),
  add column if not exists bonzah_pdf_ids jsonb default '{}', -- {cdw,rcli,sli,pai}
  add column if not exists bonzah_raw jsonb,                -- last successful response (audit)
  add column if not exists verified_by uuid references public.profiles(id),
  add column if not exists verified_at timestamptz,
  add column if not exists rejection_reason text;

-- profiles: insured snapshot fields used by quote
alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists phone text,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists license_no text,
  add column if not exists license_state text;

-- agreements
alter table public.agreements
  add column if not exists signer_name text,
  add column if not exists signature_ref text,  -- storage path or data hash
  add column if not exists template_version text,
  add column if not exists acknowledgment_snapshot text;
```

Storage buckets:

- `coverage-proofs` — Path A uploads (renter write own; owner/admin read).
- `agreements` — generated + signed PDFs.
- Optional cache of Bonzah PDFs under `bonzah-docs/{trip_id}/`.

Trip state machine (unchanged labels; enforcement tightens):

`payment_pending → coverage_pending → coverage_verified → agreement_signed → confirmed → …`

| Path | After Stripe paid | → verified when |
| --- | --- | --- |
| own | `coverage_pending` | Admin approves proof |
| protection | issue Bonzah → usually jump to `coverage_verified` | `policy_no` present |

---

## 6. Bonzah API mapping

| Step | Endpoint | Rové use |
| --- | --- | --- |
| Auth | `POST /api/v1/auth` | Edge helper; email/pwd secrets |
| Masters | `02 Masters` | Cache states/countries for pickers |
| Premium | `POST /api/v1/Bonzah/premiumCalc` | Insurance screen live price |
| Quote | `POST /api/v1/Bonzah/quote` | Draft at checkout; finalize after pay |
| Payment | `POST /api/v1/Bonzah/payment` | Issue policy; returns BORD + pdf ids |
| Policy | `GET /api/v1/Bonzah/policy` | Refresh / display |
| PDFs | `GET /api/v1/policy/data/{policy_id}?data_id=&download=1` | Renter/owner download COIs |
| Endorsements | 07–14 | Later: date change / cancel via portal or API |

**Quote payload (required fields we must collect):**  
`trip_start_date` / `trip_end_date` (`MM/DD/YYYY HH:mm:ss`), `pickup_country` / `pickup_state`, `residence_country` / `residence_state`, `drop_off_time` (`Same` \| `Later`), name, `dob`, email, address, zip, `phone_no` (11 digits), `policy_booking_time_zone` (e.g. `America/New_York`), `source` (`API`), cover flags, `finalize`, and for CDW `inspection_done` (`Renter` or `Rental Agency`). Vehicle year/make/model recommended from listing.

---

## 7. Payment / money flow

```
Renter Stripe charge = trip subtotal + service fee + Bonzah premium
                + separate deposit PaymentIntent (hold)

On checkout.session.completed:
  1. Mark trip paid (existing)
  2. If coverage.type = protection:
       finalize Bonzah quote → settle payment_id
       save BORD; coverage_verified
  3. Else: coverage_pending (admin)

Rové remits premium to Bonzah via their settle API / partner CD balance
(confirm with Brandon whether sandbox “cash” payment debits a CD balance).
```

**Open with Bonzah:** confirm sandbox settle behavior, production host, CD balance top-up, and whether partner portal login and API user are the same account (sandbox auth already succeeded for the portal email).

---

## 8. Compliance checklist (UI + ops)

From Bonzah API readme + Embedded Insurance Compliance docs:

- [ ] POS descriptions unaltered (CDW, RCLI, SLI, PAI)
- [ ] Link to excluded / restricted vehicles before purchase
- [ ] Links to coverage flyers for each product offered
- [ ] Broker disclosure (Pablow Inc. dba Bonzah; carrier named at purchase / in docs)
- [ ] Terms + privacy links (`bonzah.com/terms`, `bonzah.com/privacy`)
- [ ] Rové is referrer/embedded partner — not the insurer (ack + copy)
- [ ] BORD / policy docs retained and available to parties
- [ ] Business Partner + Integration Partner terms accepted
- [ ] Integration Partner Tech E&O $1M (ops / Phase 0)
- [ ] No BMW (and other excluded) listings without hard block if VIN/make excluded

---

## 9. Admin / owner surfaces

| Surface | Behavior |
| --- | --- |
| Admin coverage queue | List Path A `pending` proofs; approve / reject with reason |
| Trip detail | Show coverage type, BORD, PDF links, verify status |
| Retry Bonzah | If settle failed after Stripe paid: “Retry issue policy” (idempotent) |
| Cancel / date change | v1: Bonzah Business Partner Portal; API endorsements in a follow-up |

---

## 10. Implementation slices (build order)

1. **Secrets + thin client** — Edge `bonzah-premium` against sandbox. ✅ code  
2. **Schema migration** — coverages Bonzah columns + profile insured fields. ✅ `015` (run in Supabase)  
3. **Insurance UI** — Bonzah product picker + live premium + disclosures. ✅  
4. **Checkout pricing** — charge live premium; persist cover flags on `coverages`. ✅ partial (persist + price wired; settle later)  
5. **Webhook settle** — after Stripe paid, finalize + payment → BORD; gate trip state. ✅  
6. **Own-policy Storage + admin verify** — real upload; approve flips `coverage_verified`.  
7. **Pickup gate** — Confirmed / Trips / owner handoff require verified + signed.  
8. **E-sign** — agreement template + Bonzah addendum + signature capture.  
9. **PDF proxy** — download COIs from trip card.  
10. **Hardening** — excluded vehicle check, idempotency, error UX, staging secrets.

**First PR (slices 1–3):** code complete. Edge secrets set; `bonzah-premium` deployed; `015` applied on linked project.

---

## 11. Env / secrets

| Name | Where | Notes |
| --- | --- | --- |
| `BONZAH_HOST` | Edge secret | `https://bonzah.sb.insillion.com` (prod TBD) |
| `BONZAH_EMAIL` | Edge secret | Partner API user |
| `BONZAH_PASSWORD` | Edge secret | Never commit |
| `BONZAH_SOURCE` | Edge secret | e.g. `API` or partner source string Bonzah assigns |

Local: use `supabase secrets set` / linked project. Do not add passwords to `.env` committed files.

---

## 12. Out of scope for Phase 4

- Fleet / lot insurance (Bonzah referral only — Phase 0 broker)
- Full endorsement automation (date change / cancel) — portal first
- Stripe Connect owner payouts (Phase 7)
- Identity provider (Phase 5) — can still collect license fields for Bonzah quote

---

## 13. Acceptance tests (sandbox)

1. Auth returns `status: 0` and token.  
2. Premium calc for FL pickup + CDW+RCLI returns `total_premium > 0`.  
3. Finalize quote + payment returns `policy_no` starting with `BORD`.  
4. PDF download for at least one cover succeeds.  
5. Rové booking Path B: paid trip shows BORD; pickup blocked until agreement signed.  
6. Path A: upload proof → admin verify → pickup still needs signature.  
7. Dev bypass still works for local e2e without Bonzah.

---

*Design locked for build. Update this file when Bonzah confirms settle/CD-balance and production host.*
