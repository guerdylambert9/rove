/** Pickup readiness: coverage verified + agreement signed. */

export function isCoverageVerified(trip) {
  const cov = trip?.coverage
  if (!cov) return false
  if (cov.verificationStatus === 'verified') return true
  if (cov.type === 'protection' && cov.bonzahPolicyNo) return true
  return trip?.state === 'coverage_verified' ||
    trip?.state === 'agreement_signed' ||
    trip?.state === 'confirmed' ||
    trip?.state === 'in_progress' ||
    trip?.state === 'returned' ||
    trip?.state === 'deposit_released' ||
    trip?.state === 'completed'
}

export function isAgreementSigned(trip) {
  if (trip?.agreement?.signedAt) return true
  return [
    'agreement_signed',
    'confirmed',
    'in_progress',
    'returned',
    'deposit_released',
    'completed',
  ].includes(trip?.state)
}

export function canProceedToPickup(trip) {
  return isCoverageVerified(trip) && isAgreementSigned(trip)
}

export function pickupGateMessage(trip) {
  if (canProceedToPickup(trip)) return null
  const parts = []
  if (!isCoverageVerified(trip)) {
    if (trip?.coverage?.type === 'own') {
      parts.push('coverage proof pending admin verification')
    } else if (trip?.coverage?.type === 'protection') {
      parts.push('Bonzah policy not issued yet')
    } else {
      parts.push('coverage not verified')
    }
  }
  if (!isAgreementSigned(trip)) {
    parts.push('rental agreement not signed')
  }
  return parts.join(' and ')
}

export function canOwnerConfirmPickup(trip) {
  return (
    canProceedToPickup(trip) &&
    ['coverage_verified', 'agreement_signed', 'confirmed'].includes(trip?.state)
  )
}

export function canOwnerMarkReturned(trip) {
  return trip?.state === 'in_progress'
}
