import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import { useAuth } from '../state/auth.jsx'

export default function Account() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    user,
    profile,
    loading,
    configured,
    viewMode,
    signIn,
    signUp,
    signOut,
    setViewMode,
    canUseOwnerView,
  } = useAuth()
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const switchView = () => {
    const next = viewMode === 'owner' ? 'renter' : 'owner'
    setViewMode(next)
    navigate(next === 'owner' ? '/dashboard' : '/')
  }

  if (!configured) {
    return (
      <div className="page">
        <div className="scroll">
          <div className="pad" style={{ paddingTop: 24 }}>
            <h1 className="h1">Account</h1>
            <p className="auth-note">
              Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code>,
              add your project URL and anon key, then run the migration in{' '}
              <code>supabase/migrations/001_initial_schema.sql</code>.
            </p>
          </div>
        </div>
        <AppBottomNav />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <div className="scroll">
          <div className="pad" style={{ paddingTop: 24 }}>
            <p className="auth-note">Loading account…</p>
          </div>
        </div>
        <AppBottomNav />
      </div>
    )
  }

  if (user) {
    const displayName = profile?.name || user.email

    return (
      <div className="page">
        <div className="scroll">
          <div className="pad" style={{ paddingTop: 24 }}>
            <h1 className="h1">Account</h1>

            <div className="rcard">
              <div className="nm">{displayName}</div>
              <div className="sm">{user.email}</div>
              {profile?.roles?.length > 0 && (
                <div className="sm" style={{ marginTop: 8 }}>
                  Roles: {profile.roles.join(', ')}
                </div>
              )}
              {canUseOwnerView() && (
                <div className="sm" style={{ marginTop: 8 }}>
                  Viewing as: {viewMode === 'owner' ? 'Owner' : 'Renter'}
                </div>
              )}
            </div>

            {canUseOwnerView() && (
              <button
                className="cta outline"
                style={{ marginTop: 16 }}
                onClick={switchView}
              >
                {viewMode === 'owner' ? 'Switch to renter view' : 'Switch to owner view'}
              </button>
            )}

            <button
              className="cta outline"
              style={{ marginTop: 12 }}
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        </div>
        <AppBottomNav />
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        await signUp({ email, password, name })
        setMessage('Check your email to confirm your account, then sign in.')
        setMode('signin')
      } else {
        await signIn({ email, password })
        const redirectTo = location.state?.from || '/'
        navigate(redirectTo)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <h1 className="h1">{mode === 'signup' ? 'Create account' : 'Sign in'}</h1>
          <p className="auth-note">
            {mode === 'signup'
              ? 'Join Rové to book cars from the fleet.'
              : 'Welcome back. Sign in to continue.'}
          </p>

          <form className="authform" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label className="authfield">
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                />
              </label>
            )}

            <label className="authfield">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>

            <label className="authfield">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </label>

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-success">{message}</p>}

            <button className="cta sky" type="submit" disabled={submitting}>
              {submitting
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup')
              setError('')
              setMessage('')
            }}
          >
            {mode === 'signup' ? (
              <>Already have an account? Sign in</>
            ) : (
              <>New to Rové? Create an account</>
            )}
          </button>
        </div>
      </div>
      <AppBottomNav />
    </div>
  )
}
