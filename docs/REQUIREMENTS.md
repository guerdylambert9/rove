# Rové — Product Requirements Document

**Version:** 0.1 · **Status:** Working draft · **Owner:** Founding team (you + Kevin)
**Product:** A private, invite-and-trust peer-to-peer car rental app for a small owner-operated fleet in Florida.

---

## 1. Purpose & context

Rové lets a small number of vehicle owners (initially just the two founders) rent their own cars to renters directly, off the major platforms, while handling the parts that make private rentals risky if done informally: coverage confirmation, a signed agreement, deposits, and a clean handoff.

This document describes **how each feature is supposed to work** — the rules, states, and acceptance criteria — so that anyone building the app (including AI coding tools) has a single source of truth. It describes the **target product**, and marks what already exists in the current scaffold.

**Design principle that overrides convenience:** the coverage step is a gate, not a checkbox. See §7.

### Status legend
- ✅ **Built** — exists and works in the current React/Vite scaffold
- 🟡 **Partial** — UI exists but is not backed by real data/logic
- ⬜ **Planned** — not yet built

---

## 2. Scope

### In scope for v1 (the first real, money-taking version)
Owner-listed vehicles, a renter booking flow, coverage confirmation with proof + acknowledgment, deposits and payment, a signed rental agreement, booking confirmation and handoff, and an owner dashboard. Fleet is limited to the founders' own cars.

### Out of scope for v1 (deliberately deferred)
Third-party hosts listing their cars, a public open marketplace, in-app telematics/GPS, dynamic surge pricing, a native mobile app (web-first for now), and insurance underwriting by Rové itself. These are noted in §16.

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
- **Coverage** — the insurance arrangement for a trip: either the renter's own policy (with uploaded proof) or Rové trip protection.
- **Hold / deposit** — a refundable authorization placed on the renter's card, released after return if there's no damage.
- **Handoff** — the in-person exchange of keys/vehicle at pickup and return.

---

## 5. Feature: Discovery / Browse `/` — ✅ / 🟡

**How it works.** The home screen greets the renter with their location and lists all available vehicles as cards. Each card shows a photo, name, year, distance, nightly price, and a trust badge (rating or "Instant book"). Tapping a card opens its detail screen.

**Rules & acceptance criteria.**
- Only vehicles marked available for the selected dates appear. *(Currently shows all cars from static data — 🟡.)*
- Cards show price per day, rating, and distance from the renter.
- Search field filters by dates, make, or car name. *(UI present; filtering ⬜.)*
- A "Map" affordance switches to a map view of the same results. *(⬜.)*
- Bottom navigation exposes Browse, Trips, Inbox, Account.

---

## 6. Feature: Car detail `/car/:id` — ✅

**How it works.** Shows a hero image, host name, key specs (seats, range, drive), the selected pick-up/return dates, an insurance entry point, and a price breakdown (nightly × days, service fee, refundable deposit). A primary "Continue" button advances the renter to coverage.

**Rules & acceptance criteria.**
- Price breakdown recalculates from `pricePerDay × days` plus a fixed service fee and deposit.
- The insurance row and the Continue button both route to the coverage step — a renter cannot reach checkout without passing coverage.
- If the car ID is invalid, redirect to Browse.
- Specs, host, and pricing are read from the vehicle record.

---

## 7. Feature: Coverage / Insurance `/insurance` — ✅ (gating logic built; storage ⬜)

**This is the most important feature in the product. Treat its rules as hard requirements.**

**How it works.** The renter must confirm coverage before they can pay. Two paths:

1. **Use my own auto insurance.** The renter must **upload proof** (photo or PDF of their insurance card/declarations). Rové marks it for verification. The renter must also tick an **acknowledgment** stating their coverage extends to renting this vehicle and that they accept liability for any gap, and that **Rové is not the insurer**.
2. **Add Rové trip protection.** A per-day third-party coverage add-on. No personal policy required, but the acknowledgment is still required.

**Rules & acceptance criteria.**
- The "Confirm coverage" button is **disabled** until: the acknowledgment is checked **and** (own-policy path has a proof upload **or** protection is selected). *(Built.)*
- The acknowledgment text must name Rové as **not the insurer** and record the renter's acceptance of the liability gap.
- Uploaded proof must be stored, timestamped, and tied to the trip and renter for the audit trail. *(Storage ⬜.)*
- Own-policy coverage should not be treated as "verified" until an admin reviews the proof; until then the trip is "pending coverage review." *(Verification workflow ⬜.)*
- The system records who acknowledged what, and when, for every trip.

> **Legal note carried in the product:** this flow reduces exposure by creating a paper trail and shifting responsibility in writing. It is **not** legal cover and **not** a substitute for a real commercial/rental policy. A Florida insurance broker and an attorney must review this arrangement before launch. See the roadmap, Phase 0.

---

## 8. Feature: Checkout & payment `/checkout` — ✅ UI / ⬜ real payment

**How it works.** Summarizes the trip (car, dates, verified coverage label), shows the payment method, itemizes the charge (days, optional protection, service fee, refundable deposit hold), and displays the total. "Pay & book" confirms the booking.

**Rules & acceptance criteria.**
- Total = (nightly × days) + protection (if chosen) + service fee + refundable deposit hold.
- The deposit is an **authorization/hold**, not a charge, and is released after a clean return.
- Payment must run through a PCI-compliant provider (e.g. Stripe). **Rové must never collect or store raw card numbers.** *(⬜.)*
- A booking is only created after payment authorization succeeds.
- If coverage is "pending review," the product decides one of: (a) authorize payment but do not release the car until coverage clears, or (b) block checkout until cleared. **Recommended: block release, not checkout**, so the renter is committed while an admin verifies.

---

## 9. Feature: Confirmation & handoff `/confirmed` — ✅ / 🟡

**How it works.** A success screen confirms the booking and surfaces the next actions: pickup location (revealed closer to the trip), the rental agreement to sign, and a link to message the host.

**Rules & acceptance criteria.**
- Exact pickup address is revealed at a set window before pickup (e.g. 24 hours), not at booking. *(🟡 — copy present, timing logic ⬜.)*
- The renter cannot pick up until the rental agreement is signed (§10) and coverage is verified (§7).
- Host is notified of the new booking immediately.

---

## 10. Feature: Rental agreement & e-signature — ⬜

**How it works.** Before keys change hands, the renter signs a rental agreement generated from a template with the trip's details (parties, vehicle, dates, price, deposit, liability terms, coverage acknowledgment).

**Rules & acceptance criteria.**
- The agreement is generated per trip, e-signed by the renter, and stored immutably with a timestamp.
- The agreement must reflect the coverage path chosen and the acknowledgment from §7.
- Template must be drafted/reviewed by an attorney before use.

---

## 11. Feature: Identity verification & renter screening — ⬜

**How it works.** Before a first booking is approved, a renter verifies identity (government ID + a valid driver's license) and passes basic screening.

**Rules & acceptance criteria.**
- A renter cannot complete a first trip without a verified license.
- License name should match the payment method and the coverage documents.
- Use a third-party verification provider rather than building this in-house.
- **Why it matters:** off-platform renting loses the incumbents' screening. Without this, adverse selection (renters who can't pass a major platform's checks) is a real risk.

---

## 12. Feature: Owner dashboard `/dashboard` — ✅ UI / 🟡 static data

**How it works.** The owner's home view shows month-to-date net earnings, utilization, trip count, and average daily rate, followed by the fleet list with each car's status (rented/idle) and rate.

**Rules & acceptance criteria.**
- KPIs are computed from real bookings and payouts. *(Currently static — 🟡.)*
- Fleet rows show live status: rented (with return date) or idle/available.
- Owner tab bar exposes Home, Fleet, Trips, Payouts.

---

## 13. Feature: Fleet & listing management — ⬜

**How it works.** Owners add and edit vehicles: photos, specs, nightly price, and an availability calendar. Blocking dates removes a car from Browse for that range.

**Rules & acceptance criteria.**
- Each vehicle has: name, year, host, price/day, specs, photos, status, and an availability calendar.
- A car with no availability for a date range does not appear in Browse for that range.
- Price and availability changes take effect immediately for new bookings only.

---

## 14. Feature: Messaging & notifications — ⬜

**How it works.** Renter and owner can message within a trip. Both parties get notified on key events (booking created, coverage verified, agreement signed, pickup reminder, return reminder).

**Rules & acceptance criteria.**
- Messages are scoped to a trip and visible only to its two parties (and admin).
- Notifications fire on: new booking, coverage approved/rejected, agreement ready, pickup/return reminders, deposit released.

---

## 15. Feature: Reviews, payouts, trip lifecycle — ⬜

**Trip lifecycle (state machine).** Every trip moves through defined states:

`Requested → Coverage pending → Coverage verified → Agreement signed → Confirmed → In progress → Returned → Deposit released → Completed` (with `Cancelled` and `Disputed` as off-ramps).

**Payouts.** After a completed trip, the owner's earnings (trip price minus Rové's take and processing fees) are paid out on a schedule.

**Reviews.** After completion, renter and owner can each leave a rating; ratings feed the trust badges in Browse.

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

- **User** — id, name, email, phone, role(s), identity-verified flag, license info.
- **Vehicle** — id, ownerId, name, year, specs, pricePerDay, photos, status, availability.
- **Trip** — id, vehicleId, renterId, ownerId, pickup/return dates, days, state, price breakdown.
- **Coverage** — id, tripId, type (own/protection), proof file ref, acknowledgment (text + timestamp), verification status.
- **Agreement** — id, tripId, document ref, signed-at timestamp.
- **Payment** — id, tripId, provider reference, amount, deposit hold status, payout status.
- **Message / Review / Notification** — scoped to a trip and its parties.

---

## 18. Explicitly deferred (future)

Third-party hosts, public marketplace/SEO acquisition, native apps, telematics/GPS, dynamic pricing, in-app roadside/damage claims automation, and multi-state expansion. Each of these changes the insurance and regulatory picture and should be revisited only after v1 is running profitably in Florida.

---

*This is a living document. Update the status markers as features ship, and keep §7 and §16 accurate — they are where this product's real risk lives.*
