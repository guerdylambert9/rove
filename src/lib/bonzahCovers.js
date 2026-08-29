/** Bonzah product copy for soft-embed POS (keep aligned with Bonzah docs). */

export const BONZAH_EXCLUDED_VEHICLES_URL =
  'https://bonzah.com/included-and-restricted-vehicle-types'

export const BONZAH_TERMS_URL = 'https://bonzah.com/terms'
export const BONZAH_PRIVACY_URL = 'https://bonzah.com/privacy'

export const DEFAULT_PICKUP_STATE = 'Florida'
export const DEFAULT_PICKUP_COUNTRY = 'United States'

/** US states Bonzah expects as full names (master list). FL-first for Rové v1. */
export const US_PICKUP_STATES = [
  'Florida',
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District of Columbia',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
]

export const DEFAULT_BONZAH_COVERS = {
  cdw: true,
  rcli: true,
  sli: false,
  pai: false,
}

export const BONZAH_PRODUCTS = [
  {
    id: 'cdw',
    name: 'Collision Damage Waiver (CDW)',
    tagline: 'Rental Vehicle Protection',
    summary:
      'Covers damages to the rental vehicle when there is an accident with another vehicle.',
    bullets: [
      'Primary insurance for accidents between vehicles',
      'Covers up to $35,000 in damage to the rental vehicle',
      '$1,000 deductible',
      'Does not cover non-rental vehicle damage or third parties',
      'Not for commercial use (Uber, Lyft, DoorDash, etc.)',
    ],
    flyer:
      'https://pablowstorageaccount.blob.core.windows.net/prod/assets/ARIG.Collision-Damage-Warranty.Brochure.pdf',
  },
  {
    id: 'rcli',
    name: "Renter's Contingent Liability Insurance (RCLI)",
    tagline: 'Protection for Damages Done to Third Parties',
    summary:
      "Covers damage to 3rd parties' property and injury when renter is at fault. Does not cover rental vehicle damage or occupants (where allowed by law).",
    bullets: [
      'Primary insurance for non-rental car damages when the renter is at fault',
      'Covers legal state minimum liability requirements',
      'Does not cover damage to the rental vehicle',
      'Not for commercial use (Uber, Lyft, DoorDash, etc.)',
    ],
    flyer:
      'https://pablowstorageaccount.blob.core.windows.net/prod/assets/ARIG.RCLI.Brochure.pdf',
  },
  {
    id: 'sli',
    name: 'Supplemental Liability Insurance (SLI)',
    tagline: 'Coverage in Excess of Any Other Primary Coverage',
    summary:
      'Secondary excess liability. Must be purchased with RCLI — not standalone.',
    bullets: [
      'Requires RCLI (primary)',
      'Excess coverage up to $100,000 per person / $500,000 aggregate (varies)',
      'Does not cover damage to the rental vehicle',
      'Not for commercial use (Uber, Lyft, DoorDash, etc.)',
    ],
    flyer:
      'https://pablowstorageaccount.blob.core.windows.net/prod/assets/ARIG.SLI.Only.Brochure.pdf',
    requires: 'rcli',
  },
  {
    id: 'pai',
    name: 'Personal Accident Insurance (PAI)',
    tagline: 'Life, medical, and personal effects',
    summary:
      'Covers life, medical expenses, and lost or damaged items. Not auto rental insurance.',
    bullets: [
      'Renter loss of life — $50,000',
      'Passenger loss of life — $5,000',
      'Accidental medical expense — $1,000',
      'Personal effects — $500',
      'Does not cover damages to the rental vehicle',
    ],
    flyer:
      'https://pablowstorageaccount.blob.core.windows.net/prod/assets/PAI.PEI.Brochure-v2.pdf',
  },
]

export function hasAnyBonzahCover(covers) {
  if (!covers) return false
  return Boolean(covers.cdw || covers.rcli || covers.sli || covers.pai)
}

export function normalizeBonzahCovers(covers) {
  const next = {
    cdw: Boolean(covers?.cdw),
    rcli: Boolean(covers?.rcli),
    sli: Boolean(covers?.sli),
    pai: Boolean(covers?.pai),
  }
  if (next.sli && !next.rcli) next.sli = false
  return next
}
