import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import PasswordField from '../components/PasswordField.jsx'
import MfaSecurity from '../components/MfaSecurity.jsx'
import { useAuth } from '../state/auth.jsx'
import { validatePassword } from '../lib/password.js'

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
        <div className="pad" style={{ paddingTop: 24 }}>
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
      <AppBottomNav />
    </div>
  )
}
