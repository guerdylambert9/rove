/**
 * Rové peer-to-peer vehicle rental agreement — DRAFT for attorney review.
 *
 * NOT LEGAL ADVICE. Not attorney-reviewed. Do not use for real customer
 * bookings until Florida counsel has reviewed and approved a final version.
 *
 * Template version must stay in sync with docs/RENTAL_AGREEMENT_DRAFT.md.
 */

export const RENTAL_AGREEMENT_TEMPLATE_VERSION = 'rove-rental-draft-v2'

export const RENTAL_AGREEMENT_STATUS = 'DRAFT_FOR_ATTORNEY_REVIEW'

export const RENTAL_AGREEMENT_DISCLAIMER =
  'DRAFT FOR ATTORNEY REVIEW — Not legal advice. This template has not been ' +
  'approved by counsel and must not be relied on for live customer bookings ' +
  'until Florida counsel reviews and replaces this notice with an approved version.'

/** Short checkbox acknowledgment stored with the signature. */
export function buildAgreementAcknowledgment({ templateVersion, coverageType }) {
  const coverageLine =
    coverageType === 'protection'
      ? 'I acknowledge Bonzah/Pablow is the broker of record for any trip protection I purchased, and Rové is not the insurer.'
      : 'I acknowledge that I am relying on my own auto insurance (or other coverage I arranged), and Rové is not the insurer.'

  return (
    `I have read the Rové Peer-to-Peer Vehicle Rental Agreement ` +
    `(template ${templateVersion}), including the trip schedule, payment and deposit terms, ` +
    `vehicle care and return obligations, prohibited uses, and liability provisions. ` +
    `${coverageLine} ` +
    `By typing my full legal name, I intend to sign electronically under the ESIGN Act / UETA.`
  )
}

/**
 * Build the full agreement body for display and storage.
 * @param {{ trip: object, renterName?: string, ownerName?: string }} opts
 */
export function buildRentalAgreementDocument({
  trip,
  renterName = '',
  ownerName = '',
}) {
  const vehicle = trip?.vehicle ?? {}
  const breakdown = trip?.priceBreakdown ?? {}
  const coverage = trip?.coverage ?? {}
  const payment = trip?.payment ?? {}

  const vehicleLabel = [vehicle.year, vehicle.name].filter(Boolean).join(' ') || 'Vehicle'
  const host = vehicle.host || ownerName || 'Vehicle Owner'
  const schedule = trip?.schedule ?? `${trip?.pickup ?? '—'} – ${trip?.dropoff ?? '—'}`
  const days = trip?.days ?? '—'
  const total = formatUsd(trip?.total ?? breakdown.total)
  const deposit = formatUsd(breakdown.deposit ?? payment.depositAmount)
  const daily = formatUsd(breakdown.daily ?? vehicle.pricePerDay)
  const serviceFee = formatUsd(breakdown.serviceFee)
  const protection = formatUsd(breakdown.protection ?? coverage.bonzahPremium)
  const coverageLabel =
    coverage.type === 'protection'
      ? `Bonzah trip protection${coverage.bonzahPolicyNo ? ` (policy ${coverage.bonzahPolicyNo})` : ''}`
      : coverage.type === 'own'
        ? 'Renter’s own auto insurance (proof on file / verified)'
        : 'Coverage path not recorded'

  const sections = [
    {
      title: '0. Draft status',
      body: RENTAL_AGREEMENT_DISCLAIMER,
    },
    {
      title: '1. Parties and platform',
      body:
        `This Peer-to-Peer Vehicle Rental Agreement (“Agreement”) is between the Vehicle Owner ` +
        `(“Owner,” also shown as host: ${host}) and the Renter (“Renter”). ` +
        `Rové operates a booking and payment platform that facilitates this private rental. ` +
        `Rové is not the Owner of the Vehicle, is not a party to the rental of the Vehicle as lessor, ` +
        `and is not an insurer. Rové may collect trip charges and a refundable deposit hold on behalf of the Owner ` +
        `and may retain a platform service fee as disclosed at checkout.`,
    },
    {
      title: '2. Trip schedule and vehicle',
      body:
        `Vehicle: ${vehicleLabel}.\n` +
        `Trip ID: ${trip?.id ?? '—'}.\n` +
        `Pickup / return window: ${schedule} (${days} billable day(s); billing uses 24-hour cycles from the scheduled pickup time).\n` +
        `Pickup location details may be revealed closer to pickup as shown in the Rové app. ` +
        `Renter must return the Vehicle at the scheduled return time and place (or as otherwise agreed in writing with the Owner).`,
    },
    {
      title: '3. Charges, deposit, and fees',
      body:
        `Daily rate: ${daily}.\n` +
        `Platform service fee: ${serviceFee}.\n` +
        (protection !== '—' && Number(breakdown.protection ?? coverage.bonzahPremium) > 0
          ? `Trip protection premium (Bonzah): ${protection}.\n`
          : '') +
        `Estimated trip total charged at booking: ${total}.\n` +
        `Refundable security deposit hold (authorization, not a charge unless captured): ${deposit}.\n` +
        `Additional amounts may apply for late return, fuel/charging shortfalls, tolls, tickets, cleaning beyond normal use, ` +
        `damage, missing equipment, or other losses attributable to the Renter, subject to applicable law and the Owner’s documented costs. ` +
        `The deposit hold may be released after a clean return or applied toward documented amounts owed.`,
    },
    {
      title: '4. Coverage and insurance',
      body:
        `Coverage path for this trip: ${coverageLabel}.\n` +
        `Rové is not the insurer and does not sell, solicit, negotiate, or underwrite insurance. ` +
        `The Renter is responsible for ensuring continuous, adequate coverage for the entire rental period, ` +
        `including liability for injury to third parties and damage to the Vehicle, to the extent required by law and this Agreement.\n\n` +
        `If the Renter purchased Bonzah trip protection: Bonzah products are offered through Pablow, Inc. dba Bonzah.com, ` +
        `a licensed broker; coverage is a contract between the Renter and the insurer/broker under Bonzah’s terms and Description of Coverage. ` +
        `Bonzah products generally apply to personal use only, run in 24-hour cycles, must cover the full rental without gaps, ` +
        `and are subject to excluded-vehicle lists, deductibles, limits, and opt-outs (including UM/UIM/PIP/Med-Pay where permitted by law). ` +
        `The Bonzah Insurance Addendum provided by Bonzah is incorporated by reference when protection is purchased.\n\n` +
        `If the Renter uses their own policy: the Renter represents that their coverage extends to this peer-to-peer / non-owned rental use ` +
        `and accepts responsibility for any gap. Admin verification of proof does not guarantee that the insurer will pay any claim.`,
    },
    {
      title: '5. Authorized drivers',
      body:
        `Only the Renter named in this Agreement (and any additional drivers the Owner expressly authorizes in writing before driving) ` +
        `may operate the Vehicle. The Renter must hold a valid driver’s license. ` +
        `The Renter is responsible for any use by an unauthorized driver.`,
    },
    {
      title: '6. Care, use, and return',
      body:
        `The Renter will use the Vehicle with reasonable care, comply with all traffic and parking laws, ` +
        `and follow the Owner’s reasonable rules disclosed before pickup.\n` +
        `Prohibited uses include (without limitation): racing or off-roading; towing or pushing (unless Owner-approved); ` +
        `commercial / gig / rideshare / delivery use unless expressly allowed in writing; transporting hazardous materials; ` +
        `driving under the influence; smoking if the Owner prohibits it; or allowing pets if the Owner prohibits them.\n` +
        `Return the Vehicle with the same fuel/charge level as at pickup (unless otherwise agreed), in substantially the same condition ` +
        `aside from ordinary wear, with keys and accessories. Report accidents, damage, or mechanical issues to the Owner promptly.`,
    },
    {
      title: '7. Accidents, tickets, and claims',
      body:
        `The Renter must notify the Owner and, where required, law enforcement of any accident involving the Vehicle. ` +
        `The Renter is responsible for tolls, parking tickets, traffic citations, and similar charges incurred during the rental. ` +
        `Insurance claims are handled with the applicable insurer/broker; Rové may share booking and coverage records to assist claims handling.`,
    },
    {
      title: '8. Liability; platform disclaimer',
      body:
        `To the fullest extent permitted by law: (a) the Owner and Renter remain responsible for their own acts and omissions; ` +
        `(b) Rové provides the platform “as is” and disclaims warranties not required by law; ` +
        `(c) Rové is not liable for Owner–Renter disputes, vehicle condition beyond facilitating disclosure, ` +
        `or insurance coverage decisions by third-party insurers or Bonzah; ` +
        `(d) nothing in this Agreement limits liability that cannot be limited under Florida or other applicable law.`,
    },
    {
      title: '9. Cancellation, no-show, and early return',
      body:
        `Cancellation and refund rules follow the terms shown at booking and any Owner-stated policy in the listing. ` +
        `Early return does not automatically entitle the Renter to a refund of unused days unless agreed in writing. ` +
        `Bonzah premiums, once issued, are subject to Bonzah’s cancellation/endorsement rules.`,
    },
    {
      title: '10. Electronic signature',
      body:
        `The Renter agrees that typing their full legal name below, together with checking the acknowledgment box, ` +
        `constitutes an electronic signature under the federal ESIGN Act and Florida UETA, ` +
        `and has the same effect as a handwritten signature on a paper agreement. ` +
        `Rové will store a copy of this Agreement text, the signature name, timestamp, and template version with the trip record.`,
    },
    {
      title: '11. Governing law',
      body:
        `This Agreement is governed by the laws of the State of Florida, without regard to conflict-of-law rules, ` +
        `except where mandatory consumer or insurance laws of another jurisdiction apply. ` +
        `[ATTORNEY: confirm venue / dispute resolution — mediation, arbitration, or courts.]`,
    },
    {
      title: '12. Entire agreement',
      body:
        `This Agreement, the checkout price breakdown, coverage acknowledgments captured in the Rové app, ` +
        `and (if applicable) the Bonzah Insurance Addendum and Description of Coverage, form the entire agreement for this trip ` +
        `and supersede prior inconsistent statements about this booking. ` +
        `If any provision is unenforceable, the remainder stays in effect.`,
    },
  ]

  const fullText = sections
    .map((s) => `${s.title}\n\n${s.body}`)
    .join('\n\n')

  return {
    templateVersion: RENTAL_AGREEMENT_TEMPLATE_VERSION,
    status: RENTAL_AGREEMENT_STATUS,
    disclaimer: RENTAL_AGREEMENT_DISCLAIMER,
    sections,
    fullText,
    meta: {
      tripId: trip?.id ?? null,
      vehicleLabel,
      host,
      schedule,
      days,
      total,
      deposit,
      coverageLabel,
      renterName: renterName || null,
      ownerName: ownerName || host,
    },
  }
}

function formatUsd(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
