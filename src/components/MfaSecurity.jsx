import { useState } from 'react'
import { useAuth } from '../state/auth.jsx'
import MfaEnroll from './MfaEnroll.jsx'

export default function MfaSecurity() {
  const { hasVerifiedTotp, requiresOwnerMfa, refreshMfaState } = useAuth()
  const [enrolling, setEnrolling] = useState(requiresOwnerMfa)

  if (enrolling && !hasVerifiedTotp) {
    return (
      <MfaEnroll
        required={requiresOwnerMfa}
        onEnrolled={() => {
          refreshMfaState()
          setEnrolling(false)
        }}
        onCancel={requiresOwnerMfa ? undefined : () => setEnrolling(false)}
      />
    )
  }

  return (
    <div className="rcard" style={{ marginTop: 16 }}>
      <div className="nm">Two-factor authentication</div>
      {hasVerifiedTotp ? (
        <>
          <div className="sm" style={{ marginTop: 6 }}>
            Enabled — your account is protected with an authenticator app.
          </div>
        </>
      ) : (
        <>
          <div className="sm" style={{ marginTop: 6 }}>
            {requiresOwnerMfa
              ? 'Required for owner access.'
              : 'Optional — recommended before your first booking.'}
          </div>
          <button
            className="cta outline"
            style={{ marginTop: 12 }}
            onClick={() => setEnrolling(true)}
          >
            Set up authenticator app
          </button>
        </>
      )}
    </div>
  )
}
