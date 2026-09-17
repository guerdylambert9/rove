# Rové — Product Requirements Document

**Version:** 0.2 · **Status:** Working draft · **Owner:** Founding team (you + Kevin)
**Product:** A private, invite-and-trust peer-to-peer car rental app for a small owner-operated fleet in Florida.
**Last updated:** August 2026

---

## 1. Purpose & context

Rové lets a small number of vehicle owners (initially just the two founders) rent their own cars to renters directly, off the major platforms, while handling the parts that make private rentals risky if done informally: coverage confirmation, a signed agreement, deposits, and a clean handoff.

This document describes **how each feature is supposed to work** — the rules, states, and acceptance criteria — so that anyone building the app (including AI coding tools) has a single source of truth. It describes the **target product**, and marks what already exists in the current scaffold.

**Design principle that overrides convenience:** the coverage step is a gate, not a checkbox. See §7.

### Status legend
- ✅ **Built** — exists and works end-to-end (may be sandbox/test mode)
- 🟡 **Partial** — UI or backend exists but acceptance criteria not fully met
- ⬜ **Planned** — not yet built

---

## 2. Scope

### In scope for v1 (the first real, money-taking version)
Owner-listed vehicles, a renter booking flow, coverage confirmation with proof + acknowledgment, deposits and payment, a signed rental agreement, booking confirmation and handoff, and an owner dashboard. Fleet is limited to the founders' own cars.

### Out of scope for v1 (deliberately deferred)
Third-party hosts listing their cars, a public open marketplace, in-app telematics/GPS, dynamic surge pricing, a native mobile app (web-first for now), and insurance underwriting by Rové itself. These are noted in §16.

### Overall build progress (August 2026)

| Area | ~% | Notes |
| --- | --- | --- |
| Auth + backend | 100% | Supabase, roles, MFA, fleet CRUD |
| Booking + trips | 100% | Persisted trips, renter/owner views |
| Payments | 95% | Stripe Checkout + deposit hold (test mode verified) |
| Coverage / Bonzah | 95% | **Sandbox complete** — BORD, PDFs, own-policy, gate, e-sign |
| E-sign agreement | 90% | Typed name + ack; JSON in Storage; attorney template review ⬜ |
| Identity screening | 5% | Column only |
| Messaging | 20% | Inbox notifications; no chat |
| Owner dashboard KPIs + payouts | 25% | Live fleet; placeholders |
| Browse / polish / deploy | 75% | Search, calendar, reviews, staging CI |

**Critical path remaining before first real customer:** Phase 0 legal sign-off and production Stripe/Bonzah credentials (Phase 4 sandbox code is complete).

---

## 3. Users & roles

| Role | Who | What they do |
| --- | --- | --- |
| **Renter** | A customer booking a car | Browses, books, confirms coverage, pays, signs the agreement, picks up/returns |
| **Owner** (host) | You and Kevin | List cars, set price/availability, approve bookings, manage handoff, view earnings |
| **Admin** | Founding team | Verify coverage proofs, resolve disputes, manage users (may be the same people as Owners early on) |

A single person can hold both Renter and Owner roles on the same account.

---

## 4. Glossary

- **Trip** — one booking of one vehicle for a date range.
- **Coverage** — the insurance arrangement for a trip: either the renter's own policy (with uploaded proof) or Bonzah trip protection (soft-embed; BORD is proof).
- **Hold / deposit** — a refundable authorization placed on the renter's card, released after return if there's no damage.
- **Handoff** — the in-person exchange of keys/vehicle at pickup and return.

---

## 5. Feature: Discovery / Browse `/` — 🟡 (~75%)

**How it works.** The home screen greets the renter with their location and lists available vehicles as cards. Each card shows a photo, name, year, distance, nightly price, and a trust badge (rating or "Instant book"). Tapping a card opens its detail screen.

**Rules & acceptance criteria.**
- Only vehicles marked available for the selected dates appear. *(🟡 — filters + availability blocks wired; verify all edge cases.)*
- Cards show price per day, rating, and distance from the renter. *(✅ rating badge from reviews.)*
- Search field filters by dates, make, or car name. *(✅.)*
- A "Map" affordance switches to a map view of the same results. *(🟡 — OSM embed + list; per-vehicle markers ⬜.)*
- Bottom navigation exposes Browse, Trips, Inbox, Account. *(✅.)*

**Remaining:** full map markers; harden date/availability filtering.

---

## 6. Feature: Car detail `/car/:id` — ✅

**How it works.** Shows a hero image, host name, key specs (seats, range, drive), the selected pick-up/return dates and times, an insurance entry point, and a price breakdown (nightly × days, service fee, refundable deposit). A primary "Continue" button advances the renter to coverage.

**Rules & acceptance criteria.**
- Price breakdown recalculates from `pricePerDay × days` plus a fixed service fee and deposit. *(✅.)*
- **Days** bill on a **24-hour cycle** from pickup time (agency-style; aligned with Bonzah). *(✅.)*
- The insurance row and the Continue button both route to the coverage step — a renter cannot reach checkout without passing coverage. *(✅.)*
- If the car ID is invalid, redirect to Browse. *(✅.)*
- Specs, host, and pricing are read from the vehicle record. *(✅.)*
- Past pickup times on "today" are blocked. *(✅.)*

---

## 7. Feature: Coverage / Insurance `/insurance` — ✅ (~95%)

**This is the most important feature in the product. Treat its rules as hard requirements.**  
**Implementation design:** [PHASE4_BONZAH.md](./PHASE4_BONZAH.md).

**How it works.** The renter must confirm coverage before they can pay. Two paths:

1. **Use my own auto insurance.** The renter must **upload proof** (photo or PDF of their insurance card/declarations). Rové marks it for verification. The renter must also tick an **acknowledgment** stating their coverage extends to renting this vehicle and that they accept liability for any gap, and that **Rové is not the insurer**.
2. **Add Bonzah trip protection** (soft-embed). Renter selects Bonzah products (CDW / RCLI / SLI / PAI) with required POS disclosures, enters **insured details**, and sees a live premium. After Stripe payment, Rové finalizes and settles via Bonzah API; **BORD `policy_no`** is stored as proof of coverage. Acknowledgment still required; Rové is not the insurer — Bonzah/Pablow is the broker of record.

**Rules & acceptance criteria.**

| Criterion | Status |
| --- | --- |
| Confirm disabled until ack + (proof upload **or** Bonzah covers + insured fields + live premium) | ✅ |
| Acknowledgment names Rové as **not the insurer** | ✅ |
| Bonzah POS disclosures, excluded-vehicle link, flyer links | ✅ |
| Insured details captured and stored on trip (`insured_snapshot`) | ✅ |
| Live Bonzah premium (`bonzah-premium` Edge Function) | ✅ |
| After Stripe paid: quote finalize + settle → BORD; trip → `coverage_verified` | ✅ sandbox verified |
| Manual retry (**Issue Bonzah policy**) on trip card | ✅ |
| Own-policy proof stored in Storage, timestamped, tied to trip | ✅ |
| Admin approve/reject own-policy → `coverage_verified` | ✅ (`/admin/coverage`) |
| Bonzah PDF / COI download for renter and owner | ✅ (`bonzah-policy-pdf`) |
| **No pickup** until coverage verified **and** agreement signed | ✅ (owner confirm pickup gated) |
| Audit trail: who acknowledged what, when | 🟡 ack + signature stored; full audit ⬜ |

> **Legal note:** soft-embed must follow Bonzah Business Partner + Integration Partner terms and embedded-insurance compliance. Fleet/lot coverage is separate from renter trip insurance. **Phase 0 still gates production launch.**

---

## 8. Feature: Checkout & payment `/checkout` — ✅ (~95%)

**How it works.** Summarizes the trip (car, dates, coverage label), itemizes the charge (days, Bonzah insurance if chosen, service fee, refundable deposit hold), and redirects to Stripe Checkout. "Pay & book" creates the trip and opens payment.

**Rules & acceptance criteria.**
- Total = (nightly × days) + Bonzah premium (if protection) + service fee; deposit hold separate. *(✅.)*
- The deposit is an **authorization/hold**, not a charge, and is released after a clean return. *(✅.)*
- Payment runs through Stripe Checkout. **Rové never collects or stores raw card numbers.** *(✅.)*
- Booking persists as `payment_pending`; after Stripe success → `coverage_pending` (or `coverage_verified` if Bonzah settles). *(✅.)*
- Resume/cancel abandoned checkout from Trips. *(✅.)*
- If own-policy coverage is pending admin review, **block release, not checkout** (renter committed; car not handed over until verified). *(✅ — pickup gate enforced.)*

**Remaining:** production Stripe + webhook on live domain; owner payouts (Phase 7).

---

## 9. Feature: Confirmation & handoff `/confirmed` — ✅ (~85%)

**How it works.** A success screen confirms the booking and surfaces the next actions: pickup location (revealed closer to the trip), the rental agreement to sign, and a link to message the host.

**Rules & acceptance criteria.**
- Shows payment status (paid, deposit held). *(✅.)*
- Exact pickup address is revealed at a set window before pickup (e.g. 24 hours), not at booking. *(🟡 — static "Downtown WPB" copy; timing logic ⬜.)*
- Copy should reflect coverage state when Bonzah BORD already issued. *(✅.)*
- The renter cannot pick up until the rental agreement is signed (§10) and coverage is verified (§7). *(✅ — enforced via trip card + owner actions.)*
- Host is notified of the new booking. *(✅ via notifications on payment.)*

---

## 10. Feature: Rental agreement & e-signature — 🟡 (~90%)

**How it works.** Before keys change hands, the renter signs a rental agreement at `/trip/:id/sign` with trip details (vehicle, dates, price, coverage acknowledgment). Signature JSON is stored in the `agreements` Storage bucket and linked on the `agreements` row; trip advances to `agreement_signed`.

**Rules & acceptance criteria.**
- The agreement is generated per trip, e-signed by the renter, and stored immutably with a timestamp. *(✅ — template `rove-rental-draft-v2`.)*
- The agreement must reflect the coverage path chosen and the acknowledgment from §7. *(✅.)*
- Template must be drafted/reviewed by an attorney before use. *(🟡 — working draft in `docs/RENTAL_AGREEMENT_DRAFT.md` + in-app draft banner; counsel sign-off still required before live customers.)*

---

## 11. Feature: Identity verification & renter screening — ⬜

**How it works.** Before a first booking is approved, a renter verifies identity (government ID + a valid driver's license) and passes basic screening.

**Rules & acceptance criteria.**
- A renter cannot complete a first trip without a verified license.
- License name should match the payment method and the coverage documents.
- Use a third-party verification provider rather than building this in-house.
- **Why it matters:** off-platform renting loses the incumbents' screening. Without this, adverse selection (renters who can't pass a major platform's checks) is a real risk.

---

## 12. Feature: Owner dashboard `/dashboard` — 🟡 (~35%)

**How it works.** The owner's home view shows month-to-date net earnings, utilization, trip count, and average daily rate, followed by the fleet list with each car's status (rented/idle) and rate.

**Rules & acceptance criteria.**
- KPIs are computed from real bookings and payouts. *(⬜ — placeholders.)*
- Fleet rows show live status: rented (with return date) or idle/available. *(✅.)*
- Owner sees incoming trips and can mark returned. *(✅.)*
- Owner tab bar exposes Home, Fleet, Trips, Payouts. *(✅ UI; Payouts ⬜.)*

---

## 13. Feature: Fleet & listing management — 🟡 (~80%)

**How it works.** Owners add and edit vehicles: photos, specs, nightly price, and an availability calendar. Blocking dates removes a car from Browse for that range.

**Rules & acceptance criteria.**
- Each vehicle has: name, year, host, price/day, specs, photos, status, and an availability calendar. *(✅.)*
- Owners add/edit vehicles and upload photos. *(✅.)*
- Availability calendar blocks dates on Edit vehicle. *(✅.)*
- A car with no availability for a date range does not appear in Browse for that range. *(🟡 — wired; verify edge cases.)*
- Price and availability changes take effect immediately for new bookings only. *(✅.)*

---

## 14. Feature: Messaging & notifications — 🟡 (~20%)

**How it works.** Renter and owner can message within a trip. Both parties get notified on key events (booking created, coverage verified, agreement signed, pickup reminder, return reminder).

**Rules & acceptance criteria.**
- In-app notification list (Inbox). *(✅.)*
- Notifications on booking created and payment received. *(✅.)*
- Messages scoped to a trip, visible only to parties (and admin). *(⬜.)*
- Notifications on coverage approved/rejected, agreement ready, pickup/return reminders, deposit released. *(⬜.)*

---

## 15. Feature: Reviews, payouts, trip lifecycle — 🟡 (~45%)

**Trip lifecycle (state machine).** Every trip moves through defined states:

`payment_pending → coverage_pending → coverage_verified → agreement_signed → confirmed → in_progress → returned → deposit_released → completed` (with `cancelled` and `disputed` as off-ramps).

**Implemented today:**
- ✅ Persisted states through `returned`; payment + deposit on trip cards
- ✅ Bonzah path auto-advances to `coverage_verified` when BORD issued
- ✅ Owner **Confirm pickup** → `in_progress`; **Mark returned** only after pickup
- ✅ Renter **Sign rental agreement** → `agreement_signed`
- ✅ Reviews after return; ratings on Browse cards
- ⬜ Owner payouts

**Payouts.** After a completed trip, the owner's earnings (trip price minus Rové's take and processing fees) are paid out on a schedule. *(⬜ Phase 7.)*

**Reviews.** After completion, renter and owner can each leave a rating; ratings feed the trust badges in Browse. *(🟡 — renter review on trip card ✅; owner review ⬜.)*

---

## 16. Non-functional requirements

- **Security:** never store raw card data; use a payment provider's tokens. Store coverage proofs and IDs encrypted, with access limited to admins.
- **Privacy:** collect only what a booking needs; don't expose exact pickup addresses before the reveal window; don't put personal data in URLs.
- **Compliance (Florida):** account for Florida's rental car surcharge and applicable sales tax, and confirm any business licensing/registration requirements. *(Needs verification with current FL rules — do not assume.)*
- **Insurance/legal:** the coverage flow must be reviewed by a broker and attorney before any real booking (see §7 and roadmap Phase 0).
- **Performance:** Browse and detail should load fast on mobile data; images optimized.
- **Accessibility:** keyboard focus visible, reduced-motion respected (already in the scaffold's CSS), sufficient color contrast.
- **Auditability:** every coverage acknowledgment, proof upload, and signed agreement is retained with a timestamp.

---

## 17. Data model (sketch)

- **User** — id, name, email, phone, role(s), identity-verified flag, license info; insured fields (DOB, address) for Bonzah.
- **Vehicle** — id, ownerId, name, year, specs, pricePerDay, photos, status, availability blocks.
- **Trip** — id, vehicleId, renterId, ownerId, pickup/return dates **and times**, days (24h billing), state, price breakdown.
- **Coverage** — id, tripId, type (own/protection), proof file ref, acknowledgment, verification status; Bonzah: `bonzah_covers`, `bonzah_premium`, `bonzah_policy_no` (BORD), `bonzah_pdf_ids`, `insured_snapshot`.
- **Agreement** — id, tripId, document ref, signed-at timestamp. *(schema ✅; app ⬜.)*
- **Payment** — id, tripId, Stripe refs, charge amount, deposit hold status, payout status.
- **Message / Review / Notification** — scoped to a trip and its parties. *(Reviews + notifications partial.)*

---

## 18. Explicitly deferred (future)

Third-party hosts, public marketplace/SEO acquisition, native apps, telematics/GPS, dynamic pricing, in-app roadside/damage claims automation, and multi-state expansion. Each of these changes the insurance and regulatory picture and should be revisited only after v1 is running profitably in Florida.

---

*This is a living document. Update the status markers as features ship, and keep §7 and §16 accurate — they are where this product's real risk lives.*
