/** Insured fields required for Bonzah quote finalize. */

export const EMPTY_INSURED = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  addressLine1: '',
  city: '',
  state: 'Florida',
  zipCode: '',
  phone: '',
}

export function splitFullName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/** US phone → 11 digits (1 + 10-digit mobile). */
export function normalizeBonzahPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) return digits
  if (digits.length === 10) return `1${digits}`
  return ''
}

/** YYYY-MM-DD → MM/DD/YYYY */
export function toBonzahDob(isoDate) {
  const [y, m, d] = String(isoDate || '').split('-')
  if (!y || !m || !d) return ''
  return `${m}/${d}/${y}`
}

export function insuredFromProfile(profile) {
  const { firstName, lastName } = splitFullName(profile?.name)
  return {
    ...EMPTY_INSURED,
    firstName,
    lastName,
    phone: profile?.phone ?? '',
    dateOfBirth: profile?.date_of_birth ?? '',
    addressLine1: profile?.address_line_1 ?? '',
    city: profile?.city ?? '',
    state: profile?.state || 'Florida',
    zipCode: profile?.zip_code ?? '',
  }
}

export function isInsuredComplete(insured) {
  if (!insured) return false
  const phone = normalizeBonzahPhone(insured.phone)
  if (!insured.firstName?.trim() || !insured.lastName?.trim()) return false
  if (!insured.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(insured.dateOfBirth)) {
    return false
  }
  if (!insured.addressLine1?.trim() || !insured.city?.trim()) return false
  if (!insured.state?.trim() || !insured.zipCode?.trim()) return false
  if (phone.length !== 11) return false
  return true
}
