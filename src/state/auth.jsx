import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import {
  canUseOwnerView,
  hasRole,
  isAdmin,
  isOwner,
} from '../lib/roles.js'
import { refreshMfaState, verifyMfaCode } from '../lib/mfa.js'

const VIEW_MODE_KEY = 'rove-view-mode'

const AuthContext = createContext(null)

function readStoredViewMode() {
  const stored = localStorage.getItem(VIEW_MODE_KEY)
  if (stored === 'owner' || stored === 'renter') return stored
  return null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [viewMode, setViewModeState] = useState('renter')
  const [mfa, setMfa] = useState({
    hasVerifiedTotp: false,
    needsChallenge: false,
    totpFactors: [],
  })

  const applyViewModeForProfile = useCallback((nextProfile) => {
    if (!canUseOwnerView(nextProfile)) {
      setViewModeState('renter')
      return
    }
    setViewModeState(readStoredViewMode() ?? 'owner')
  }, [])

  const loadMfaState = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user) {
      setMfa({ hasVerifiedTotp: false, needsChallenge: false, totpFactors: [] })
      return
    }
    try {
      const state = await refreshMfaState(supabase)
      setMfa(state)
    } catch {
      setMfa({ hasVerifiedTotp: false, needsChallenge: false, totpFactors: [] })
    }
  }, [session?.user])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      if (!mounted) return
      setSession(current)
      if (current?.user) {
        Promise.all([loadProfile(current.user.id)])
          .finally(() => {
            if (mounted) setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
        setViewModeState('renter')
        setMfa({ hasVerifiedTotp: false, needsChallenge: false, totpFactors: [] })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      loadMfaState()
    }
  }, [session?.user, loadMfaState])

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, roles, identity_verified')
      .eq('id', userId)
      .maybeSingle()

    if (!error && data) {
      setProfile(data)
      applyViewModeForProfile(data)
    }
  }

  async function signUp({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    await loadMfaState()
    return data
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    localStorage.removeItem(VIEW_MODE_KEY)
  }

  async function updateProfile({ name, phone }) {
    const userId = session?.user?.id
    if (!userId) throw new Error('Not signed in')

    const patch = {}
    if (name !== undefined) patch.name = name
    if (phone !== undefined) patch.phone = phone

    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('id, name, email, phone, roles, identity_verified')
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  const verifyMfaChallenge = useCallback(async (code) => {
    await verifyMfaCode(supabase, code)
    await loadMfaState()
  }, [loadMfaState])

  const setViewMode = useCallback(
    (mode) => {
      if (mode === 'owner' && !canUseOwnerView(profile)) return
      setViewModeState(mode)
      if (canUseOwnerView(profile)) {
        localStorage.setItem(VIEW_MODE_KEY, mode)
      }
    },
    [profile],
  )

  const user = session?.user ?? null

  const navVariant = useMemo(() => {
    if (canUseOwnerView(profile) && viewMode === 'owner') return 'owner'
    return 'renter'
  }, [profile, viewMode])

  const requiresOwnerMfa = canUseOwnerView(profile) && !mfa.hasVerifiedTotp

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      configured: isSupabaseConfigured,
      viewMode,
      navVariant,
      hasVerifiedTotp: mfa.hasVerifiedTotp,
      needsMfaChallenge: mfa.needsChallenge,
      requiresOwnerMfa,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      updateProfile,
      setViewMode,
      refreshMfaState: loadMfaState,
      verifyMfaChallenge,
      hasRole: (role) => hasRole(profile, role),
      isAdmin: () => isAdmin(profile),
      isOwner: () => isOwner(profile),
      canUseOwnerView: () => canUseOwnerView(profile),
    }),
    [
      user,
      profile,
      session,
      loading,
      viewMode,
      navVariant,
      mfa,
      requiresOwnerMfa,
      setViewMode,
      loadMfaState,
      verifyMfaChallenge,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
