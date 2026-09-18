import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import PasswordField from '../components/PasswordField.jsx'
import MfaSecurity from '../components/MfaSecurity.jsx'
import { useAuth } from '../state/auth.jsx'
import { validatePassword } from '../lib/password.js'
import { isAdmin } from '../lib/roles.js'

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
    signInWithGoogle,
    signOut,
    updateProfile,
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
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (profile) {
      setEditName(profile.name ?? '')
      setEditPhone(profile.phone ?? '')
    }
  }, [profile])

  const switchView = () => {
    const next = viewMode === 'owner' ? 'renter' : 'owner'
    setViewMode(next)
    navigate(next === 'owner' ? '/dashboard' : '/')
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'Could not start Google sign-in')
    }
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
    const handleSaveProfile = async (e) => {
      e.preventDefault()
      setProfileError('')
      setProfileMessage('')
      setSavingProfile(true)

      try {
        const trimmedName = editName.trim()
        if (!trimmedName) {
          setProfileError('Name is required.')
          return
        }
        await updateProfile({
          name: trimmedName,
          phone: editPhone.trim() || null,
        })
        setProfileMessage('Profile saved.')
      } catch (err) {
        setProfileError(err.message || 'Could not save profile')
      } finally {
        setSavingProfile(false)
      }
    }

    return (
      <div className="page">
        <div className="scroll">
          <div className="pad" style={{ paddingTop: 24 }}>
            <h1 className="h1">Account</h1>

            <form className="authform" onSubmit={handleSaveProfile}>
              <div className="sectitle" style={{ marginBottom: 4 }}>
                Profile
              </div>

              <label className="authfield">
                <span>Name</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                />
              </label>

              <label className="authfield">
                <span>Email</span>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input-disabled"
                />
              </label>

              <label className="authfield">
                <span>Phone</span>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="(555) 555-0100"
                  autoComplete="tel"
                />
              </label>

              {profile?.roles?.length > 0 && (
                <p className="auth-note">Roles: {profile.roles.join(', ')}</p>
              )}
              {canUseOwnerView() && (
                <p className="auth-note">
                  Viewing as: {viewMode === 'owner' ? 'Owner' : 'Renter'}
                </p>
              )}

              {profileError && <p className="auth-error">{profileError}</p>}
              {profileMessage && <p className="auth-success">{profileMessage}</p>}

              <button className="cta sky" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
            </form>

            <MfaSecurity />

            {isAdmin(profile) && (
              <Link
                to="/admin/coverage"
                className="cta outline auth-cta"
                style={{ marginTop: 16, display: 'flex', textAlign: 'center' }}
              >
                Coverage review queue
              </Link>
            )}

            {canUseOwnerView() && (
              <button
                className="cta outline auth-cta"
                style={{ marginTop: 16 }}
                onClick={switchView}
              >
                {viewMode === 'owner' ? 'Switch to renter view' : 'Switch to owner view'}
              </button>
            )}

            <button
              className="cta outline auth-cta"
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
        const { valid } = validatePassword(password)
        if (!valid) {
          setError('Please meet all password requirements below.')
          return
        }
        await signUp({ email, password, name })
        setMessage('Check your email to confirm your account, then sign in.')
        setMode('signin')
        setPassword('')
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
        <div className="pad" style={{ paddingTop: 28 }}>
          <div className="auth-panel">
            <h1 className="h1">{mode === 'signup' ? 'Create account' : 'Sign in'}</h1>
            <p className="auth-note">
              {mode === 'signup'
                ? 'Join Rové to book cars from the fleet.'
                : 'Welcome back. Sign in to continue.'}
            </p>

            <button
              className="cta outline oauth-btn"
              type="button"
              onClick={handleGoogleSignIn}
            >
              <svg className="oauth-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>or use email</span>
            </div>

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

              {mode === 'signup' ? (
                <PasswordField value={password} onChange={setPassword} />
              ) : (
                <label className="authfield">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                  />
                </label>
              )}

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
                setPassword('')
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
      </div>
      <AppBottomNav />
    </div>
  )
}
