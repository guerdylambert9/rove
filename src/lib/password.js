export const PASSWORD_MIN_LENGTH = 10

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'lower',
    label: 'One lowercase letter',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'upper',
    label: 'One uppercase letter',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'digit',
    label: 'One number',
    test: (p) => /\d/.test(p),
  },
]

export function validatePassword(password) {
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password))
  return {
    valid: failed.length === 0,
    failed,
  }
}

export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' }

  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length
  const ratio = passed / PASSWORD_RULES.length

  if (ratio < 0.5) return { score: 1, label: 'Weak' }
  if (ratio < 1) return { score: 2, label: 'Almost there' }
  if (password.length >= 14) return { score: 4, label: 'Strong' }
  return { score: 3, label: 'Good' }
}

export function passwordErrorMessage(password) {
  const { failed } = validatePassword(password)
  if (failed.length === 0) return null
  return failed[0].label
}
