# Rové — Development Roadmap & Build Order

**Version:** 0.2 · **Companion to:** REQUIREMENTS.md · **Last updated:** July 2026
**Goal it serves:** get to a version that can safely take one real, paid booking from a real customer — then a handful — without over-building.

---

## 1. How to read this

This document answers three questions: **what to build first, what comes next, and why in that order.** The ordering is driven by dependencies and by risk — the riskiest, most expensive-to-get-wrong things (insurance, legal, payments) are validated early even when they aren't code, because building screens on top of an unverified insurance model is how you waste months.

The current state: **Phase 1 is complete. Phase 2 is complete in code** — bookings persist as trips; renters see them on Trips, owners on Dashboard. Run `005_phase2_trips.sql` in Supabase. Payment is still simulated (Phase 3); coverage verification is pending (Phase 4).

### Progress legend

| Symbol | Meaning |
| --- | --- |
| ✅ | **Complete** — “done when” criteria met |
| 🔄 | **In progress** — started but not done |
| ⬜ | **Not started** |
| ⏸ | **Parallel / non-code** — tracked separately; gates launch |

Percentages are **rough** — based on “done when” criteria plus visible code/schema progress. Update them as work lands.

### Phase status at a glance

| Phase | Status | % | Summary |
| --- | --- | --- | --- |
| **0** Legal & insurance | ⏸ | 0% | Parallel track; gates launch, not development |
| **1** Backend + auth | ✅ | **100%** | Supabase, auth, Browse/Detail from DB |
| **2** Persisted booking | ✅ | **100%** | Trips + coverages saved; renter & owner views |
| **3** Payments + deposits | 🔄 | **90%** | Stripe live; return handoff + Mark returned |
| **4** Coverage + e-sign | ⬜ | 10% | Insurance screen mock; no backend gate |
| **5** Identity screening | ⬜ | 5% | `identity_verified` on profiles only |
| **6** Messaging + notifications | ⬜ | 5% | Inbox placeholder only |
| **7** Dashboard + payouts | 🔄 | 15% | Real fleet list; KPIs still placeholder |
| **8** Polish + launch | 🔄 | **70%** | Calendar, browse filters/map, reviews, GH Actions |

**Critical path to first paid booking:** Phases 0–4. Phase 1 ✅ · Phase 2 ✅ · Phase 3 is next in code.

---

## 2. Guiding principles

1. **De-risk before you build.** The insurance and legal questions gate everything. Resolve them in Phase 0 while code proceeds in parallel — but do not launch until they clear.
2. **Build thin vertical slices.** One complete path (browse → book → pay → sign → confirm) working end-to-end beats ten half-features. Ship the narrowest thing that can take a real booking.
3. **Buy, don't build, the dangerous parts.** Payments, identity verification, and e-signature should use established providers. Do not hand-roll them. You never touch raw card data.
4. **Serve the real business first.** Your actual advantage is Kevin's existing repeat customers. The first users are people who already rent from you — so identity screening and public discovery matter *less* at first than a clean, trustworthy booking-and-agreement flow. Build for that, not for a cold public marketplace.
5. **Keep the scaffold's shape.** The screens are the contract. Wire real data behind them rather than redesigning.

---

## 3. Recommended stack decisions

You already have the frontend. Here's a low-cost, AI-friendly way to fill in the rest:

| Layer | Recommendation | Why |
| --- | --- | --- |
| Frontend | Keep React + Vite (built) | Already done; portable; easy to host |
| Backend + DB + Auth | A managed backend (e.g. Supabase or Firebase) | Auth, database, file storage, and APIs in one; minimal ops; generous free tier |
| Payments | Stripe | Handles card data, deposits/holds, and payouts to owners; you stay out of PCI scope |
| Identity/license | A verification provider (e.g. Stripe Identity or similar) | Don't build ID checks yourself |
| E-signature | An e-sign API, or a signed-PDF flow | Legal weight + audit trail |
| File storage | The managed backend's storage | For coverage proofs and signed agreements, encrypted |
| Hosting | A static host for the frontend (e.g. Vercel/Netlify) | Free/cheap, connects to your GitHub repo, deploys on push |

You don't have to commit to all of these now — but pick the backend + payments provider before Phase 1, because everything else hangs off them.

---

## 4. The build order at a glance

```
Phase 0  Legal + insurance validation      ⏸  0%   (parallel, non-code, GATES launch)
   │
Phase 1  Backend foundations + auth        ✅ 100%  ← DONE
   │
Phase 2  Real booking flow (persisted)     ✅ 100%  ← DONE
   │
Phase 3  Payments + deposits             🔄  90%  ← IN PROGRESS
   │
Phase 4  Coverage verification + e-sign  ⬜  10%   ← the trust core
   │
Phase 5  Identity verification             ⬜   5%
   │
Phase 6  Messaging + notifications       ⬜   5%
   │
Phase 7  Owner dashboard + payouts         🔄  15%
   │
Phase 8  Reviews, calendar, polish       🔄  25%
```

Phases 1–4 are the **critical path** to a legally launchable MVP. Phases 5–8 make it scale and feel finished.

---

## 5. Phases in detail

### Phase 0 — Legal & insurance validation *(start today, runs in parallel)*
**Status:** ⏸ Parallel · **0%**

**Goal:** confirm you can legally take money for these rentals, and that coverage actually covers.
**Do:**
- Get written confirmation from an insurance broker on how coverage works for your exact setup (owner policy vs. renter-provided vs. a real commercial/rental policy).
- Have an attorney draft/review the rental agreement and the coverage acknowledgment wording (§7/§10 of the requirements).
- Confirm business entity, Florida rental surcharge/sales tax handling, and any licensing.
- Decide the coverage rule the product will enforce (block release vs. block checkout when coverage is pending).
**Done when:** you have written answers, an approved agreement template, and a tax/licensing plan.
**Why first:** every screen after checkout assumes these answers. Building them before you have the answers risks rework and legal exposure.

### Phase 1 — Backend foundations + auth
**Status:** ✅ Complete · **100%**

**Goal:** replace static data with a real backend and let people sign in.
**Build:** the data model (User, Vehicle, Trip, Coverage, Agreement, Payment), account sign-up/login, and read APIs so Browse and Detail pull from the database instead of `src/data/cars.js`.
**Done when:** you can create an account, and Browse/Detail render real records from the backend.
**Depends on:** stack decisions (§3).

**Shipped (core):**
- [x] Supabase project + migrations (`001`–`004`)
- [x] Data model in SQL: profiles, vehicles, trips, coverages, agreements, payments
- [x] Email/password sign-up and sign-in; profile create on register
- [x] Browse and Car Detail read from `vehicles` table (not `src/data/cars.js`)
- [x] Stack chosen: React + Vite, Supabase, Vercel hosting

**Beyond Phase 1** *(not required for Phase 1 “done when,” but already built):*
- [x] Google OAuth sign-in
- [x] Password rules (length, upper/lower/digit)
- [x] TOTP MFA for owner routes
- [x] Roles: renter / owner / admin + RLS lockdown
- [x] Owner fleet: list, add, edit vehicles
- [x] Vehicle photo upload (storage bucket + collage/lightbox on Browse)
- [x] Production deploy via Vercel CLI (`rove-roan.vercel.app`, Flex business account)

**Not wired yet** *(belongs to later phases):*
- Agreement and Payment tables exist in schema but have no app APIs
- Checkout simulates payment (no Stripe yet — Phase 3)
- Coverage proof upload is UI-only; verification is Phase 4

### Phase 2 — Real booking flow (persisted)
**Status:** ✅ Complete · **100%**

**Goal:** a booking becomes a real record, not just in-memory state.
**Build:** create a Trip on booking; move it through the early lifecycle states (Requested → Coverage pending); persist dates, car, renter, price breakdown. Wire the existing `booking.jsx` context to write to the backend.
**Done when:** a renter can book a car and the owner sees the trip appear.

**Shipped:**
- [x] `src/api/trips.js` — create trip, fetch renter/owner trips
- [x] Trip + coverage row on confirm booking (`state: coverage_pending`)
- [x] Price breakdown stored in `trips.price_breakdown` (jsonb)
- [x] Renter **Trips** tab lists bookings
- [x] Owner **Dashboard → Bookings** shows incoming trips
- [x] Sign-in required to book; redirect back to checkout after login
- [x] Migration `005_phase2_trips.sql` (coverage insert + vehicle read for trip parties)

**Still simulated (later phases):**
- Real coverage proof storage & admin verify (Phase 4)

### Phase 3 — Payments + deposits
**Status:** 🔄 In progress · **90%**

**Goal:** take money safely, hold a deposit, prepare owner payouts.
**Build:** Stripe checkout for the trip total; a **hold** (authorization) for the refundable deposit; release logic after return. No raw card data touches your servers.
**Done when:** a test payment authorizes, the deposit holds, and both are visible on the trip.
**Depends on:** Phase 2 (a trip to attach payment to).

**Shipped:**
- [x] Supabase Edge Functions: `create-checkout-session`, `stripe-webhook`, `release-deposit`
- [x] Migration `010_phase3_payments.sql` — `payment_pending` state, payment columns
- [x] Checkout → Stripe redirect when `VITE_STRIPE_PUBLISHABLE_KEY` set and bypass off
- [x] Deposit authorization after successful checkout (webhook)
- [x] Trip cards show payment + deposit hold status
- [x] Return urgency + late labels; owner **Mark returned** (frees fleet; releases deposit when held)
- [ ] Owner payouts via Connect (Phase 7)

### Phase 4 — Coverage verification + e-signed agreement *(the trust core)*
**Status:** ⬜ Not started · **10%**

**Goal:** make the coverage gate and the signed agreement real.
**Build:** store the uploaded proof; an admin review step that flips coverage to "verified"; generate the rental agreement per trip from the approved template; capture an e-signature; store both immutably with timestamps. Enforce: **no pickup until coverage verified AND agreement signed.**
**Done when:** a trip cannot reach "Confirmed/ready for pickup" without a stored proof, an admin approval, and a signed agreement.
**Depends on:** Phase 0 (approved wording), Phase 2 (a trip).
**Why this ordering:** this is where your real risk lives, so it's built as soon as there's a trip and a payment to hang it on — before you widen access to new renters.

**Progress so far:** Insurance screen UI and `coverages` table in schema; proof upload is client-only mock.

### Phase 5 — Identity verification / renter screening
**Status:** ⬜ Not started · **5%**

**Goal:** protect against adverse selection once you go beyond people you already know.
**Build:** license + ID verification via a provider on first booking; match name to payment and coverage.
**Done when:** a new renter must verify before a first trip completes.
**Note:** can be light or skipped for the very first bookings from Kevin's *known* repeat customers, then turned on before opening to strangers.

**Progress so far:** `identity_verified` column on profiles; no verification flow.

### Phase 6 — Messaging + notifications
**Status:** ⬜ Not started · **5%**

**Goal:** coordinate handoff without leaving the app.
**Build:** trip-scoped messaging; notifications on booking, coverage decision, agreement ready, pickup/return reminders, deposit release.
**Done when:** the two parties can communicate and get the key reminders automatically.

**Progress so far:** `/inbox` placeholder page only.

### Phase 7 — Owner dashboard (real data) + payouts
**Status:** 🔄 In progress · **15%**

**Goal:** turn the static dashboard into the owner's real control panel.
**Build:** compute earnings, utilization, and trip counts from real bookings; show live fleet status; schedule owner payouts via Stripe.
**Done when:** the numbers on `/dashboard` are real and payouts run.

**Progress so far:** Dashboard shows owner's real fleet from DB; KPIs (earnings, utilization, trips) are placeholders. No Stripe payouts.

### Phase 8 — Reviews, availability calendar, polish, launch
**Status:** 🔄 In progress · **70%**

**Goal:** make it feel finished and ready to widen.
**Build:** availability calendar and listing management (§13), reviews/ratings feeding trust badges, search/filter and map on Browse, performance and accessibility pass, deploy pipeline from GitHub.
**Done when:** an owner can self-manage listings and availability, and the app is deployed.

**Progress so far:**
- [x] Owner listing management (add/edit fleet, photos)
- [x] Deployed to Vercel via CLI
- [x] Availability calendar (owner blocks on Edit vehicle) + migration `014`
- [x] Browse search, date/price filters, list/map toggle
- [x] Reviews after return (trip cards) → rating badge on Browse
- [x] GitHub Actions workflow `.github/workflows/deploy-staging.yml`
- [ ] Full map markers per vehicle (currently OSM embed + nearby list)
- [ ] Wire Vercel + Supabase secrets into GitHub Actions

---

## 6. What "MVP" actually means here

The smallest version that can safely take **one real paid booking**:

- Phase 0 cleared (coverage + agreement legally sound).
- Auth (Phase 1), a persisted booking (Phase 2), real payment + deposit (Phase 3), and the coverage-gate + signed agreement (Phase 4).
- Identity screening (Phase 5) can start light if the first renters are Kevin's known customers.

Everything else — messaging, live dashboard, reviews, calendars — can come after the first bookings are flowing. **Ship Phases 0–4 first.**

---

## 7. Sequencing rationale (why this order)

- **Legal/insurance is first** because it can invalidate the whole model, and it's not code — it runs in parallel and gates launch, not development.
- **Auth and data before booking** because a booking needs a user and a vehicle record to attach to.
- **Payments before the agreement gate** because the agreement/coverage step decides whether a *paid, committed* trip can proceed to pickup — the commitment (payment) should exist first.
- **Coverage/agreement before opening to strangers** because that's the risk core; you want it airtight before new renters arrive.
- **Identity, messaging, dashboard, reviews after** because they improve scale and polish but aren't required for a first safe booking among known customers.

---

## 8. Working with AI to build this

Since you're leaning on AI for development, a few practices that keep it productive:

- **Feed it REQUIREMENTS.md and this file** as context so generated code matches the intended behavior and states.
- **Build one phase per branch**, review, and merge — small diffs are easier to verify and safer to push.
- **Ask for tests on the money paths** (payment, deposit release, coverage gate) — these are the ones you cannot afford to get subtly wrong.
- **Never let AI-generated code handle raw card data or invent legal wording** — those come from providers and your attorney, not the model.
- **Keep the scaffold's routes and component shapes**; ask the AI to wire data behind them rather than redesign.

---

## 9. Rough milestones against the 12-month side-income goal

These are directional, assuming part-time effort with AI assistance:

1. **Weeks 1–3:** Phase 0 in motion (broker + attorney) and Phase 1 backend/auth. *(Phase 1 ✅)*
2. **Weeks 4–7:** Phases 2–3 — persisted bookings and real payments. *(Phase 2 ✅; Phase 3 next)*
3. **Weeks 8–11:** Phase 4 — coverage verification + signed agreement; take your **first real booking from a known customer.**
4. **Months 4–6:** Phases 5–7 — screening, messaging, live dashboard, payouts; widen to more of Kevin's customers.
5. **Months 6–12:** Phase 8 and iteration — listings/calendar, reviews, deploy pipeline, and only then consider carefully widening beyond people you already trust.

The fastest path to profit is not a bigger app — it's a trustworthy booking flow serving the repeat customers you already have. Build that, then grow.

---

*Update status, percentages, and checklists as phases complete. If Phase 0 comes back with a "no" on the insurance model, stop and re-plan before writing more code — that answer changes everything downstream.*
