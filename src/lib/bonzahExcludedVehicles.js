/**
 * Client-side Bonzah eligibility check (block purchase only).
 * Source of truth for the full list remains Bonzah’s published page —
 * keep this aligned with restricted makes/models they list.
 * @see https://bonzah.com/included-and-restricted-vehicle-types
 */

import { BONZAH_EXCLUDED_VEHICLES_URL } from './bonzahCovers.js'

export { BONZAH_EXCLUDED_VEHICLES_URL }

/** Restricted makes (substring match on vehicle name / make). */
const RESTRICTED_MAKES = [
  'alfa romeo',
  'aston martin',
  'auburn',
  'avanti',
  'bentley',
  'bertone',
  'bmc',
  'leyland',
  'bmw',
  'bradley',
  'bricklin',
  'bugatti',
  'clenet',
  'corvette',
  'cosworth',
  'cybertruck',
  'de lorean',
  'delorean',
  'excalibre',
  'ferrari',
  'iso',
  'jaguar',
  'jensen',
  'koenigsegg',
  'lamborghini',
  'lancia',
  'lotus',
  'maserati',
  'maybach',
  'mclaren',
  'morgan',
  'pagani',
  'pantera',
  'panther',
  'pininfarina',
  'porsche',
  'rolls royce',
  'rolls-royce',
  'rover',
  'stutz',
  'sterling',
  'triumph',
  'tvr',
]

const RESTRICTED_MERCEDES = [
  'g-wagon',
  'g wagon',
  'g-class',
  'g class',
  's-class',
  's class',
  'amg',
]

function vehicleHaystack(vehicle) {
  return [vehicle?.make, vehicle?.model, vehicle?.name, vehicle?.trim]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/**
 * @param {{ name?: string, make?: string, model?: string, year?: number|string } | null} vehicle
 * @returns {{ excluded: boolean, reason?: string }}
 */
export function getBonzahVehicleExclusion(vehicle) {
  if (!vehicle) return { excluded: false }

  const haystack = vehicleHaystack(vehicle)
  const year = Number(vehicle.year)
  const age =
    Number.isFinite(year) && year > 1900
      ? new Date().getFullYear() - year
      : null

  if (age != null && age > 15) {
    return {
      excluded: true,
      reason: `Vehicles older than 15 years are not eligible for Bonzah coverage (this vehicle is ${age} years old).`,
    }
  }

  if (haystack.includes('mercedes')) {
    const hit = RESTRICTED_MERCEDES.find((token) => haystack.includes(token))
    if (hit) {
      return {
        excluded: true,
        reason:
          'This Mercedes model is on Bonzah’s restricted list and cannot be covered through Bonzah.',
      }
    }
  }

  for (const make of RESTRICTED_MAKES) {
    // Word-boundary-ish: avoid matching "bmwn" style noise; "bmw 330i" / "Audi" ok
    const re = new RegExp(`(?:^|[^a-z])${make.replace(/\s+/g, '\\s+')}(?:[^a-z]|$)`, 'i')
    if (re.test(haystack)) {
      return {
        excluded: true,
        reason: `This vehicle appears on Bonzah’s restricted list (${make}) and cannot be covered through Bonzah.`,
      }
    }
  }

  return { excluded: false }
}

export function isBonzahExcludedVehicle(vehicle) {
  return getBonzahVehicleExclusion(vehicle).excluded
}
