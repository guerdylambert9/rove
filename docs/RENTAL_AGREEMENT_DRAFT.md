# Rové Peer-to-Peer Vehicle Rental Agreement — DRAFT for attorney review

**Status:** `DRAFT_FOR_ATTORNEY_REVIEW`  
**Template version (in app):** `rove-rental-draft-v2`  
**Source of truth in code:** `src/lib/rentalAgreementTemplate.js`  
**E-sign UI:** `/trip/:id/sign` (`src/pages/SignAgreement.jsx`)

---

## Important notice (read first)

This document is a **working draft** prepared so Florida counsel can review and revise it. It is:

- **Not legal advice**
- **Not attorney-reviewed or approved**
- **Not suitable for live customer bookings** until counsel replaces the draft banner and signs off

Rové should keep the in-app draft banner visible until an approved version is checked in.

Companion materials for counsel:

- [REQUIREMENTS.md](./REQUIREMENTS.md) §7 (coverage gate) and §10 (e-sign)
- [PHASE4_BONZAH.md](./PHASE4_BONZAH.md)
- [Bonzah_Rental_Agreement_Addendum_v2.pdf](./Bonzah_Rental_Agreement_Addendum_v2.pdf) (incorporate when Bonzah protection is purchased)
- Bonzah Embedded Insurance Compliance Requirements (if provided separately)

---

## How the app uses this template

1. After coverage is verified, the renter opens **Sign rental agreement**.
2. The app fills trip-specific fields (vehicle, schedule, totals, coverage path / BORD).
3. The renter scrolls the full text, types their legal name, checks an acknowledgment, and signs.
4. Rové stores: full agreement text snapshot, acknowledgment text, signer name, timestamp, and `template_version` in Storage + `agreements` row.

---

## Draft agreement body (same substance as in-app)

### 0. Draft status

DRAFT FOR ATTORNEY REVIEW — Not legal advice. This template has not been approved by counsel and must not be relied on for live customer bookings until Florida counsel reviews and replaces this notice with an approved version.

### 1. Parties and platform

This Peer-to-Peer Vehicle Rental Agreement (“Agreement”) is between the Vehicle Owner (“Owner,” also shown as host) and the Renter (“Renter”). Rové operates a booking and payment platform that facilitates this private rental. Rové is not the Owner of the Vehicle, is not a party to the rental of the Vehicle as lessor, and is not an insurer. Rové may collect trip charges and a refundable deposit hold on behalf of the Owner and may retain a platform service fee as disclosed at checkout.

### 2. Trip schedule and vehicle

Filled at signing from the trip record: vehicle year/name, trip ID, pickup/return window (24-hour billable days from scheduled pickup), and note that exact pickup address may be revealed closer to pickup.

### 3. Charges, deposit, and fees

Filled at signing: daily rate, service fee, Bonzah premium (if any), trip total, refundable deposit hold. Additional amounts may apply for late return, fuel/charging shortfalls, tolls, tickets, cleaning beyond normal use, damage, missing equipment, or other documented losses attributable to the Renter, subject to applicable law.

### 4. Coverage and insurance

States the coverage path for the trip (own policy vs Bonzah BORD). Emphasizes Rové is not the insurer. Incorporates Bonzah broker disclosure, personal-use / 24-hour cycle / excluded vehicles / limits themes from the Bonzah Insurance Addendum when protection is purchased. Own-policy path: renter represents coverage extends to this use; admin verification ≠ claim guarantee.

### 5. Authorized drivers

Only the named renter (and Owner-authorized additional drivers in writing) may drive; valid license required; renter responsible for unauthorized drivers.

### 6. Care, use, and return

Reasonable care; traffic laws; Owner rules. Prohibited uses (racing, unauthorized commercial/gig use, DUI, etc.). Return with same fuel/charge, ordinary wear only; prompt damage reporting.

### 7. Accidents, tickets, and claims

Notify Owner / police as required; renter responsible for tolls/tickets; claims with insurer/broker; Rové may share records.

### 8. Liability; platform disclaimer

Owner/Renter responsible for their acts; platform “as is”; Rové not liable for insurance decisions or Owner–Renter disputes beyond facilitating the booking — **subject to attorney rewrite for enforceability and Florida consumer law**.

### 9. Cancellation, no-show, and early return

Points to booking-time rules; early return ≠ automatic refund; Bonzah subject to Bonzah endorsement rules.

### 10. Electronic signature

Typed name + checkbox = electronic signature under ESIGN / Florida UETA; storage of text, name, timestamp, template version.

### 11. Governing law

Florida law placeholder — **attorney must confirm venue / dispute resolution**.

### 12. Entire agreement

Agreement + checkout breakdown + coverage acks + Bonzah addendum (if applicable).

---

## Checkbox acknowledgment (stored with signature)

> I have read the Rové Peer-to-Peer Vehicle Rental Agreement (template `rove-rental-draft-v2`), including the trip schedule, payment and deposit terms, vehicle care and return obligations, prohibited uses, and liability provisions. [Coverage-specific sentence: Bonzah broker / own policy.] By typing my full legal name, I intend to sign electronically under the ESIGN Act / UETA.

---

## Attorney review checklist

Please mark or rewrite as needed:

- [ ] Party definitions (Owner / Renter / Platform) match Florida P2P reality
- [ ] Whether Rové should be a party, agent, or disclosed facilitator only
- [ ] Deposit hold / capture / release language vs Stripe auth model
- [ ] Insurance / coverage gate wording (own policy + Bonzah soft-embed)
- [ ] Incorporation of Bonzah Insurance Addendum (scope, personal use, UM/UIM/PIP opt-out)
- [ ] Authorized drivers and age / license requirements
- [ ] Damage, cleaning, mileage, fuel — any Owner-specific addenda
- [ ] Limitation of liability / indemnity (Owner ↔ Renter ↔ Platform)
- [ ] Cancellation / refund / no-show policy (or pointer to published policy)
- [ ] Electronic signature enforceability (ESIGN / Florida UETA)
- [ ] Governing law, venue, arbitration vs courts
- [ ] Required Florida disclosures (rental surcharge, tax, consumer notices)
- [ ] Replace **§0 Draft status** with approved effective date and version id
- [ ] Confirm UI must show full text (not summary-only) before signature

When approved, ask engineering to:

1. Replace `RENTAL_AGREEMENT_DISCLAIMER` / §0 with approved notice (or remove draft banner).
2. Bump `RENTAL_AGREEMENT_TEMPLATE_VERSION` (e.g. `rove-rental-v3-counsel-2026-__-__`).
3. Update this file to **Approved** and archive the draft.
