import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function MfaEnroll({ required = false, onEnrolled, onCancel }) {
  const [factorId, setFactorId] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
        if (listError) throw listError

        const verified = factors.totp.find((f) => f.status === 'verified')
        if (verified) {
          onEnrolled?.()
          return
        }

        for (const factor of factors.totp.filter((f) => f.status !== 'verified')) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id })
        }

        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'Authenticator app',
        })
        if (enrollError) throw enrollError
        if (cancelled) return
        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not start 2FA setup')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [onEnrolled])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      })
      if (verifyError) throw verifyError

      onEnrolled?.()
    } catch (err) {
      setError(err.message || 'Invalid code — try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mfa-panel">
      <h2 className="h1" style={{ fontSize: 20 }}>
        {required ? 'Set up two-factor authentication' : 'Add authenticator app'}
      </h2>
      <p className="auth-note">
        {required
          ? 'Owner accounts require 2FA before accessing the dashboard.'
          : 'Scan the QR code with Google Authenticator, 1Password, or similar.'}
      </p>

      {loading && <p className="auth-note">Preparing QR code…</p>}
      {error && !loading && <p className="auth-error">{error}</p>}

      {qrCode && (
        <>
          <div className="mfa-qr">
            {qrCode.startsWith('data:') ? (
              <img
                src={qrCode}
                alt="Scan with your authenticator app"
                width={180}
                height={180}
              />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: qrCode }} />
            )}
          </div>
          {secret && (
            <div className="mfa-secret-block">
              <p className="auth-note">
                Can&apos;t scan? In Google Authenticator or 1Password, choose{' '}
                <strong>Enter a setup key</strong>, then paste:
              </p>
              <code className="mfa-secret-key">{secret}</code>
            </div>
          )}

          <form className="authform" onSubmit={handleVerify}>
            <label className="authfield">
              <span>6-digit code from your app</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                autoComplete="one-time-code"
              />
            </label>

            <button className="cta sky" type="submit" disabled={submitting || code.length < 6}>
              {submitting ? 'Verifying…' : 'Enable 2FA'}
            </button>
          </form>
        </>
      )}

      {!required && onCancel && (
        <button className="auth-switch" type="button" onClick={onCancel}>
          Maybe later
        </button>
      )}
    </div>
  )
}
