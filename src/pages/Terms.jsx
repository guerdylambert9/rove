import { Link } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import {
  BONZAH_EXCLUDED_VEHICLES_URL,
  BONZAH_PRIVACY_URL,
  BONZAH_TERMS_URL,
} from '../lib/bonzahCovers.js'

/**
 * Rové Consumer / Renter Terms — DRAFT for counsel + Bonzah review.
 * Not legal advice. Replace after Florida attorney approval.
 */
export default function Terms() {
  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24, paddingBottom: 32 }}>
          <p className="muted-sm" style={{ marginBottom: 8 }}>
            <Link to="/account">← Account</Link>
          </p>
          <h1 className="h1">Renter Terms</h1>
          <p className="auth-note">
            Consumer terms for using Rové. Draft for attorney review — not legal advice.
            Last updated for Bonzah Integration Partner compliance review.
          </p>

          <div className="terms-doc">
            <section>
              <h2>1. Who we are</h2>
              <p>
                Rové is a peer-to-peer booking platform for privately owned vehicles operated
                in connection with Konnective Motors / Flex Management. Unless stated
                otherwise for a specific listing, Rové is not the vehicle owner and is not a
                traditional rental-car company in all respects. <strong>Rové is not an
                insurer</strong> and does not sell, solicit, negotiate, or underwrite
                insurance.
              </p>
            </section>

            <section>
              <h2>2. Eligibility</h2>
              <p>
                You must meet age and license requirements disclosed at booking, provide
                accurate account information, and not use vehicles for banned purposes
                (including unauthorized commercial, gig, rideshare, or delivery use unless
                expressly allowed).
              </p>
            </section>

            <section>
              <h2>3. Booking and payment</h2>
              <p>
                Trip totals include the vehicle rate and applicable platform fees. A
                refundable security deposit may be authorized separately. Payments are
                processed by Stripe. Cancellation and refund rules are shown at checkout
                and in your trip confirmation.
              </p>
            </section>

            <section>
              <h2>4. Coverage requirement</h2>
              <p>
                Every trip must have verified coverage before pickup: (a) Bonzah trip
                protection as offered in the app, and/or (b) your own insurance subject to
                Rové’s verification process. Rové does not guarantee that any insurer will
                pay a claim.
              </p>
            </section>

            <section>
              <h2>5. Bonzah products</h2>
              <p>
                When you purchase trip protection, Pablow, Inc. dba Bonzah.com is the
                licensed broker of record. Coverage is a contract between you and the
                insurer/broker under Bonzah’s terms and Description of Coverage. Products
                are generally for personal use only, run in 24-hour cycles, must cover the
                full rental without gaps, and are subject to deductibles, limits, excluded
                vehicles, and opt-outs (including UM/UIM/PIP/Med-Pay where permitted by
                law). Preferred Coverage issues Collision Damage Waiver (CDW) and Renter’s
                Contingent Liability Insurance (RCLI) together.
              </p>
              <p>
                Review{' '}
                <a href={BONZAH_TERMS_URL} target="_blank" rel="noreferrer">
                  Bonzah Terms
                </a>
                ,{' '}
                <a href={BONZAH_PRIVACY_URL} target="_blank" rel="noreferrer">
                  Bonzah Privacy
                </a>
                , and{' '}
                <a href={BONZAH_EXCLUDED_VEHICLES_URL} target="_blank" rel="noreferrer">
                  included and restricted vehicle types
                </a>
                . The Bonzah Rental Agreement Addendum is part of the rental agreement you
                e-sign when protection is purchased.
              </p>
            </section>

            <section>
              <h2>6. Vehicle care and return</h2>
              <p>
                Follow traffic laws and the owner’s rules. Return the vehicle on time with
                the agreed fuel/charge level and report damage promptly. Prohibited uses
                include racing, unauthorized commercial use, and other restrictions in the
                rental agreement.
              </p>
            </section>

            <section>
              <h2>7. Authorized drivers</h2>
              <p>
                Only you (and any drivers the owner expressly authorizes in writing) may
                drive the vehicle. You must hold a valid driver’s license.
              </p>
            </section>

            <section>
              <h2>8. Liability</h2>
              <p>
                You are responsible for coverage gaps, tickets, tolls, and damage
                attributable to your use, to the extent allowed by law. Platform liability
                limitations will be finalized with Florida counsel.
              </p>
            </section>

            <section>
              <h2>9. Privacy</h2>
              <p>
                We share data with payment and insurance partners as needed to book, cover,
                and support claims. See partner privacy policies linked at checkout and on
                the insurance screen.
              </p>
            </section>

            <section>
              <h2>10. Governing law</h2>
              <p>
                These terms are intended to be governed by the laws of the State of
                Florida, subject to attorney review and final drafting.
              </p>
            </section>

            <section>
              <h2>11. Electronic agreement</h2>
              <p>
                Completing checkout, insurance acknowledgments, and e-signing the rental
                agreement constitutes your agreement to these Renter Terms and the trip
                documents presented in the app.
              </p>
            </section>
          </div>
        </div>
      </div>
      <AppBottomNav />
    </div>
  )
}
