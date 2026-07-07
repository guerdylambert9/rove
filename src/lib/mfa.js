export async function refreshMfaState(client) {
  if (!client) {
    return {
      aal: null,
      hasVerifiedTotp: false,
      totpFactors: [],
      needsChallenge: false,
    }
  }

  const [aalResult, factorsResult] = await Promise.all([
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
    client.auth.mfa.listFactors(),
  ])

  if (aalResult.error) throw aalResult.error
  if (factorsResult.error) throw factorsResult.error

  const totpFactors = factorsResult.data?.totp ?? []
  const hasVerifiedTotp = totpFactors.some((f) => f.status === 'verified')
  const aal = aalResult.data
  const needsChallenge =
    hasVerifiedTotp &&
    aal?.nextLevel === 'aal2' &&
    aal?.currentLevel !== 'aal2'

  return { aal, hasVerifiedTotp, totpFactors, needsChallenge }
}

export async function verifyMfaCode(client, code) {
  const { data: factors, error: listError } = await client.auth.mfa.listFactors()
  if (listError) throw listError

  const factor = factors.totp.find((f) => f.status === 'verified')
  if (!factor) throw new Error('No authenticator enrolled')

  const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({
    factorId: factor.id,
  })
  if (challengeError) throw challengeError

  const { error: verifyError } = await client.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code: code.trim(),
  })
  if (verifyError) throw verifyError
}
