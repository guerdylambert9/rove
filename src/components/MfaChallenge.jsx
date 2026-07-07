import { useState } from 'react'
import { useAuth } from '../state/auth.jsx'

export default function MfaChallenge({ onVerified }) {
  const { verifyMfaChallenge } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await verifyMfaChallenge(code)
      onVerified?.()
    } catch (err) {
      setError(err.message || 'Invalid code — try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <div className="mfa-panel">
            <h1 className="h1">Two-factor check</h1>
            <p className="auth-note">
              Enter the 6-digit code from your authenticator app to continue.
            </p>

            <form className="authform" onSubmit={handleSubmit}>
              <label className="authfield">
                <span>Authentication code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                />
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button className="cta sky" type="submit" disabled={submitting || code.length < 6}>
                {submitting ? 'Verifying…' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
