# Bonzah production meeting prep — Rové

**Purpose:** Walk Brandon through compliance + confirm production readiness.  
**Companion files:** Partner terms (business.bonzah.com), `Bonzah_Rental_Agreement_Addendum_v2.pdf`, `Embedded Insurance Compliance Requirements.pdf`, Insurance UI, e-sign flow.

---

## 1. Business Partner Terms — summary

**Who:** Rental operators who offer Bonzah to *their* renters (Kevin/Rové as fleet operators).

**Core idea:** You **refer** renters to Bonzah. You are **not** the insurer and must **not** sell, solicit, negotiate, or advise on insurance. **Pablow, Inc. dba Bonzah.com** is broker of record.

**Your main obligations:**
- Complete Bonzah orientation/training before offering products
- Show required POS content unaltered (descriptions, flyers, disclosure, TOS/privacy, UM/UIM/PIP/Med-Pay opt-out notice)
- Do **not** mark up/discount Bonzah premiums without approval
- Verify coverage in the **Business Portal** (BORD active) **before releasing keys**; coverage must be continuous for the whole rental
- Monitor **excluded vehicles**; don’t rely on Bonzah for excluded cars
- Cooperate on claims (DL, rental contract, timestamps, VIN, etc.)
- Never call products “full coverage”
- Premiums are **due on receipt** (no credit to the customer)

**Accept at:** [business.bonzah.com/business-partner-terms](https://business.bonzah.com/business-partner-terms)

---

## 2. Integration Partner Terms — summary

**Who:** Platforms that embed Bonzah via API (Rové the app).

**Core idea:** Same insurance role limits (no unlicensed sale/advice). You build/maintain the Integration and keep POS content current.

**Extra obligations vs Business Partner:**
- Keep API accurate; BORD is source of truth for coverage
- Flow-down: any Connected Rental Company must accept Business Partner terms + orientation
- **§4.14 Tech E&O $1M** (see below)
- If you also rent cars yourself (§4.16), you must comply with **both** Integration + Business Partner terms (Rové almost certainly does)

**Accept at:** [business.bonzah.com/integration-partner-terms](https://business.bonzah.com/integration-partner-terms)

---

## 3. Tech E&O $1M (Integration Partner §4.14)

| Requirement | Detail |
| --- | --- |
| Coverage | Technology Errors & Omissions, **including cyber / network security** |
| Limits | **≥ $1M per claim** and **≥ $1M aggregate** |
| Additional insureds | **Pablow, Inc.** and **Bonzah, Inc.** |
| Other | Primary & non-contributory for Integration-related claims; carrier reasonably acceptable to Bonzah |
| Proof | Certificate of insurance **before** agreement effective date / on request |
| Notice | 30 days’ prior written notice of cancel / material reduction |
| Risk | Lapse can trigger **immediate termination** |

**Action before / for the call:** Ask your broker for a cert naming those additional insureds, or ask Brandon exactly how they want the cert worded and when to send it.

---

## 4. CDW & RCLI — summary (use Bonzah wording; don’t invent)

### Collision Damage Waiver (CDW) — *Rental Vehicle Protection*
- Covers damage to the **rental vehicle** when there is an accident with another vehicle
- Primary for vehicle-to-vehicle accidents
- Up to **~$35,000** damage to rental vehicle; **~$1,000 deductible** (confirm on flyer/COI)
- Does **not** cover third parties / non-rental vehicles
- Personal use only — not Uber/Lyft/DoorDash-type commercial use
- Flyer in app: ARIG Collision Damage Warranty brochure

### Renter’s Contingent Liability Insurance (RCLI)
- Covers damage to **3rd parties’ property and injury** when renter is at fault
- Does **not** cover rental vehicle damage or occupants (where allowed by law)
- Aimed at **state minimum** liability requirements (varies by state)
- Personal use only
- Flyer in app: ARIG RCLI brochure

**Together:** Closest Bonzah “package” for vehicle + liability — still **not “full coverage”** (limits, deductible, exclusions, UM/UIM/PIP/Med-Pay opt-out where allowed, personal use only).

**Brandon’s guidance for Rové:** You can present as **“Preferred Coverage”** (one UI choice) and issue **both** policies via API. Keep vehicle cost and insurance cost **broken out**. Premiums are flat per-day products from Bonzah (no %-of-trip).

---

## 5. Rental agreement addendum — summary

Source: `docs/Bonzah_Rental_Agreement_Addendum_v2.pdf` (Pablow / Bonzah).

| § | Point |
| --- | --- |
| 1 | Renter may need minimum auto coverage (own, card benefit, or referral partner including Bonzah) |
| 2 | Bonzah is a **referral partner / broker**; platform is **not** the insurer and does not sell/solicit/advise |
| 3 | Personal use only |
| 4 | Excluded vehicles — renter must confirm eligibility |
| 5 | Coverage in **24-hour cycles**, continuous for full rental; buy before pickup; extensions before lapse; no gap fill after lapse |
| 6 | Renter must read Description of Coverage |
| 7 | Not “full coverage”; PAI is travel, not rental car coverage |
| 8 | Opt-out of UM / UIM / PIP / Med-Pay where permitted |
| 9 | Only authorized drivers on the rental agreement |
| 10 | Timestamps drive coverage alignment |

**App status:** PDF exists in repo; e-sign mentions Bonzah themes but does **not** yet show/attach this addendum as a required readable document. Gap for compliance walkthrough.

---

## 6. Potential Renter Terms content (draft for attorney + Brandon)

> **DRAFT — not legal advice.** Have Florida counsel review. Align with Bonzah POS rules (don’t alter product descriptions).

### Suggested sections for a public `/terms` or “Renter Terms” page

1. **Who we are** — Rové is a peer-to-peer booking platform for privately owned vehicles. Rové is not the vehicle owner (unless stated), not a traditional rental company in all respects, and **not an insurer**.

2. **Eligibility** — Age, valid license, account accuracy, banned uses.

3. **Booking & payment** — Trip total, service fee, refundable deposit hold (authorization), Stripe processing, cancellations.

4. **Coverage requirement** — Every trip needs verified coverage before pickup: (a) Bonzah trip protection as offered, and/or (b) own insurance subject to Rové’s verification process. Rové does not guarantee any insurer will pay a claim.

5. **Bonzah products** — Optional/required as configured; Pablow/Bonzah is broker; links to Bonzah TOS, privacy, excluded vehicles, flyers; not “full coverage”; UM/UIM/PIP/Med-Pay opt-out where allowed; personal use only. Incorporate **Bonzah Rental Agreement Addendum**.

6. **Vehicle care & return** — Traffic laws, Owner rules, fuel/charge, damage reporting, prohibited uses (racing, unauthorized commercial/gig use, etc.).

7. **Authorized drivers** — Only named/authorized drivers.

8. **Liability** — Renter responsibility for gaps, tickets, tolls; platform limitations (counsel rewrite).

9. **Privacy** — Link to privacy policy; data shared with payment and insurance partners as needed to book/cover/claim.

10. **Disputes / governing law** — Florida placeholder for counsel.

11. **Electronic agreement** — Checkout, insurance ack, and e-sign constitute agreement to these terms.

---

## 7. Questions to ask Brandon on the call

### Production / ops
1. Exact steps to accept Business + Integration Partner Terms (portal vs email)?
2. Who sends production host URL + API credentials after the walkthrough?
3. CD balance / auto-withdraw: cadence, how we fund, failure if balance low mid-trip?
4. Mandatory orientation — who takes it (founders)? Link/schedule?
5. How do we send Tech E&O cert (email? portal?) and exact additional-insured wording?

### Pricing (you specifically wanted this)
6. **Do premiums fluctuate by vehicle value / cheap vs expensive cars, or only by dates, state, and products selected?**  
   (Sandbox has looked flat per product per day — confirm for production.)
7. Does year/make/model (or VIN) change premiumCalc in production?
8. Any Florida-specific rate or product differences?

### Product / UX
9. Confirm “Preferred Coverage” UI (one choice → CDW+RCLI both true) is compliant as long as both descriptions/flyers show.
10. Must UM/UIM/PIP/Med-Pay opt-out be a **separate checkbox**, or is disclosure text enough?
11. BMW / excluded list: hard-block booking or only block Bonzah path?
12. Own-insurance path: any Bonzah concern if we still allow it for some trips?

### Compliance content
13. Is our Insurance screen disclosure wording acceptable, or must we paste a specific Bonzah paragraph?
14. Where must the **Rental Agreement Addendum** appear (sign page, checkout, both)?
15. Do we need a standalone **Renter Terms** URL, or is e-sign agreement + Bonzah links enough?
16. Staging URL vs production URL for the walkthrough — which should we demo?

---

## 8. Full meeting checklist — in app vs missing

| Item | Status | Where / notes |
| --- | --- | --- |
| Business Partner Terms accepted | ⬜ | Accept in Bonzah onboarding |
| Integration Partner Terms accepted | ⬜ | Accept in Bonzah onboarding |
| Tech E&O $1M + cert naming Pablow + Bonzah | ⬜ | Broker; bring status to call |
| Orientation / training completed | ⬜ | Ask Brandon for link |
| Product descriptions (CDW/RCLI/SLI/PAI) | ✅ | `/insurance` — Bonzah-aligned copy |
| Flyer PDF links | ✅ | Per product on Insurance |
| Excluded vehicles link | ✅ | Insurance disclosure area |
| Bonzah Terms + Privacy links | ✅ | Insurance disclosure |
| Broker disclosure (Pablow / Bonzah) | ✅ | Insurance disclosure text |
| “Rové is not the insurer” ack | ✅ | Insurance checkbox |
| Insurance broken out from vehicle cost | ✅ | Checkout line items |
| Live premium → settle → BORD | ✅ | Sandbox verified |
| Policy PDF download | ✅ | Trip card |
| UM/UIM/PIP/Med-Pay opt-out explicit UI | 🟡 | Mentioned in agreement draft; **no dedicated POS checkbox** — confirm with Brandon |
| Rental Agreement Addendum shown to renter | 🟡 | PDF in `docs/`; **not wired into e-sign UI yet** |
| Dedicated Renter Terms page | ⬜ | Need draft + counsel; not in app |
| Attorney-approved rental agreement | 🟡 | `rove-rental-draft-v2` with draft banner |
| Excluded vehicle hard-block (e.g. BMW) | ⬜ | Not enforced in booking |
| Production host + credentials | ⬜ | After compliance meeting |
| Portal verification before key handoff (ops process) | 🟡 | App shows BORD; train owners to confirm portal |

### Screen-share order (suggested)
1. `/insurance` — products, flyers, disclosure, excluded link, ack  
2. Checkout — vehicle vs insurance breakout  
3. Trips — BORD + PDF download  
4. `/trip/:id/sign` — agreement (note draft + addendum gap)  
5. Admin own-policy queue (if relevant)  
6. Open `Bonzah_Rental_Agreement_Addendum_v2.pdf` and ask where it must live  
7. Ask about Renter Terms + E&O cert next steps  
8. Confirm production credential handoff

---

## 9. One-liner for the call open

> “We’ve completed sandbox quote → settle → BORD + PDFs. We’ll accept both partner agreements and bring Tech E&O. Today we want you to review our POS compliance screens, tell us what’s still missing (especially addendum, renter terms, and UM opt-out), confirm whether premiums vary by car value, and then issue production credentials.”
