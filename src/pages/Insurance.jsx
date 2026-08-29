import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useBooking } from '../state/useBooking.js'
import { useAuth } from '../state/auth.jsx'
import { bypassInsuranceGate, DEV_COVERAGE_STUB } from '../lib/bookingFlags.js'
import {
  BONZAH_EXCLUDED_VEHICLES_URL,
  BONZAH_PRIVACY_URL,
  BONZAH_PRODUCTS,
  BONZAH_TERMS_URL,
  DEFAULT_BONZAH_COVERS,
  DEFAULT_PICKUP_COUNTRY,
  DEFAULT_PICKUP_STATE,
  US_PICKUP_STATES,
  hasAnyBonzahCover,
  normalizeBonzahCovers,
} from '../lib/bonzahCovers.js'
import { fetchBonzahPremium } from '../api/bonzah.js'
import {
  uploadCoverageProof,
  validateCoverageProofFile,
} from '../api/coverageProofs.js'
import {
  EMPTY_INSURED,
  insuredFromProfile,
  isInsuredComplete,
} from '../lib/bonzahInsured.js'
import DevBookingBanner from '../components/DevBookingBanner.jsx'
import Icon from '../components/Icon.jsx'

function formatMoney(n) {
  return `$${Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function Insurance() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { trip, setCoverage } = useBooking()

  const [premiumLoading, setPremiumLoading] = useState(false)
  const [premiumError, setPremiumError] = useState('')
  const [rates, setRates] = useState(null)
  const [proofUploading, setProofUploading] = useState(false)
  const [proofError, setProofError] = useState('')

  const { coverage } = trip
  const covers = normalizeBonzahCovers(coverage.covers ?? DEFAULT_BONZAH_COVERS)
  const pickupState = coverage.pickupState || DEFAULT_PICKUP_STATE

  const insured = coverage.insured ?? EMPTY_INSURED

  useEffect(() => {
    if (coverage.type !== 'protection' || coverage.insured) return
    const base = insuredFromProfile(profile)
    setCoverage({
      insured: {
        ...base,
        state: coverage.pickupState || base.state,
        email: user?.email ?? '',
      },
    })
  }, [coverage.type, coverage.insured, coverage.pickupState, profile, user?.email, setCoverage])

  useEffect(() => {
    if (!trip.car) return
    if (coverage.type !== 'protection') return
    if (!hasAnyBonzahCover(covers)) {
      setPremiumError('Select at least one coverage product')
      setCoverage({ premiumTotal: null })
      return
    }
    if (!user) {
      setPremiumError('Sign in to get a live insurance quote')
      setCoverage({ premiumTotal: null })
      return
    }

    let cancelled = false
    const t = setTimeout(async () => {
      setPremiumLoading(true)
      setPremiumError('')
      try {
        const data = await fetchBonzahPremium({
          tripStartDate: trip.pickupDate,
          tripEndDate: trip.returnDate,
          pickupState,
          pickupCountry: DEFAULT_PICKUP_COUNTRY,
          pickupTime: trip.pickupTime,
          returnTime: trip.returnTime,
          covers,
        })
        if (cancelled) return
        setRates(data.rates ?? null)
        setCoverage({
          premiumTotal: Number(data.totalPremium),
          covers,
          pickupState,
        })
      } catch (err) {
        if (cancelled) return
        setRates(null)
        setCoverage({ premiumTotal: null })
        setPremiumError(err.message || 'Could not calculate premium')
      } finally {
        if (!cancelled) setPremiumLoading(false)
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // setCoverage is stable; covers object rebuilt each render — depend on flags
  }, [
    trip.car,
    coverage.type,
    covers.cdw,
    covers.rcli,
    covers.sli,
    covers.pai,
    pickupState,
    trip.pickupDate,
    trip.returnDate,
    trip.pickupTime,
    trip.returnTime,
    user,
    setCoverage,
  ])

  if (!trip.car) return <Navigate to="/" replace />

  const hasCoverageType = coverage.type === 'own' || coverage.type === 'protection'
  const protectionReady =
    coverage.type === 'protection' &&
    hasAnyBonzahCover(covers) &&
    coverage.premiumTotal != null &&
    Number(coverage.premiumTotal) > 0 &&
    isInsuredComplete(insured) &&
    !premiumLoading &&
    !premiumError

  const setInsuredField = (field, value) => {
    setCoverage({
      insured: { ...insured, [field]: value },
    })
  }

  const ownReady =
    coverage.type === 'own' &&
    coverage.proofUploaded &&
    Boolean(coverage.proofFileRef)

  const handleProofFile = async (file) => {
    setProofError('')
    if (!file) {
      setCoverage({ proofUploaded: false, proofFileRef: null })
      return
    }

    const validationError = validateCoverageProofFile(file)
    if (validationError) {
      setProofError(validationError)
      setCoverage({ proofUploaded: false, proofFileRef: null })
      return
    }

    if (!user) {
      setProofError('Sign in to upload proof')
      return
    }

    setProofUploading(true)
    try {
      const path = await uploadCoverageProof(file, user.id)
      setCoverage({ proofUploaded: true, proofFileRef: path })
    } catch (err) {
      setProofError(err.message || 'Upload failed')
      setCoverage({ proofUploaded: false, proofFileRef: null })
    } finally {
      setProofUploading(false)
    }
  }

  const canContinue =
    coverage.acknowledged &&
    (coverage.type === 'own' ? ownReady : protectionReady)

  const selectType = (type) => {
    if (type === 'protection') {
      setCoverage({
        type: 'protection',
        proofUploaded: false,
        covers: coverage.covers ?? DEFAULT_BONZAH_COVERS,
        pickupState: coverage.pickupState || DEFAULT_PICKUP_STATE,
        premiumTotal: null,
      })
      setRates(null)
      setPremiumError('')
    } else {
      setCoverage({
        type: 'own',
        covers: null,
        premiumTotal: null,
        proofUploaded: coverage.proofUploaded,
      })
      setRates(null)
      setPremiumError('')
    }
  }

  const toggleCover = (id) => {
    const next = { ...covers, [id]: !covers[id] }
    if (id === 'rcli' && !next.rcli) next.sli = false
    if (id === 'sli' && next.sli) next.rcli = true
    setCoverage({
      covers: normalizeBonzahCovers(next),
      premiumTotal: null,
    })
    setRates(null)
    setPremiumError('')
  }

  const skipToCheckout = () => {
    setCoverage(DEV_COVERAGE_STUB)
    navigate('/checkout')
  }

  const missing = []
  if (!hasCoverageType) missing.push('select a coverage option')
  if (coverage.type === 'own' && !coverage.proofUploaded) {
    missing.push('upload proof of insurance')
  }
  if (coverage.type === 'protection' && !protectionReady) {
    if (!hasAnyBonzahCover(covers)) missing.push('select Bonzah products')
    else if (!user) missing.push('sign in for a quote')
    else if (premiumLoading) missing.push('wait for the quote')
    else if (premiumError) missing.push('fix the quote error')
    else if (!isInsuredComplete(insured)) missing.push('complete insured details')
    else missing.push('wait for a valid premium')
  }
  if (!coverage.acknowledged) missing.push('check the acknowledgment')

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 18 }}>
          <DevBookingBanner />
          <h1 className="h1">Confirm coverage</h1>
          <p className="muted-sm">Every trip must be covered before pickup.</p>

          {bypassInsuranceGate && (
            <button type="button" className="cta outline dev-skip-btn" onClick={skipToCheckout}>
              Skip to checkout (dev bypass)
            </button>
          )}

          <button
            type="button"
            className={`insopt ${coverage.type === 'own' ? 'sel' : ''}`}
            onClick={() => selectType('own')}
          >
            <div className="hd">
              <div className="nm">Use my own auto insurance</div>
              <span className={`radio ${coverage.type === 'own' ? 'on' : ''}`} />
            </div>
            <div className="ds">
              Bring your personal policy. You’ll upload proof — we verify it covers
              rental use before the keys hand over.
            </div>

            {coverage.type === 'own' && (
              <label
                className={`upload ${coverage.proofUploaded ? 'done' : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  hidden
                  disabled={proofUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    handleProofFile(file ?? null)
                  }}
                />
                <b>
                  {proofUploading
                    ? 'Uploading…'
                    : coverage.proofUploaded
                      ? '✓ Proof uploaded'
                      : '⬆ Upload insurance card'}
                </b>
                {coverage.proofUploaded
                  ? 'Admin will verify before pickup'
                  : 'Required — image or PDF, max 10 MB'}
                {proofError && (
                  <p className="auth-note" role="alert">
                    {proofError}
                  </p>
                )}
              </label>
            )}
          </button>

          <button
            type="button"
            className={`insopt ${coverage.type === 'protection' ? 'sel' : ''}`}
            onClick={() => selectType('protection')}
          >
            <div className="hd">
              <div className="nm">Add Bonzah trip protection</div>
              <span className="hd-right">
                {coverage.type === 'protection' && coverage.premiumTotal != null ? (
                  <span className="pr">{formatMoney(coverage.premiumTotal)}</span>
                ) : (
                  <span className="pr muted-pr">Live quote</span>
                )}
                <span className={`radio ${coverage.type === 'protection' ? 'on' : ''}`} />
              </span>
            </div>
            <div className="ds">
              Embedded coverage from Bonzah (licensed broker). Rové is not the insurer.
              Premium is calculated for your trip dates.
            </div>
          </button>

          {coverage.type === 'protection' && (
            <div className="bonzah-panel" onClick={(e) => e.stopPropagation()}>
              <label className="field">
                <span>Pickup state</span>
                <select
                  value={pickupState}
                  onChange={(e) =>
                    setCoverage({
                      pickupState: e.target.value,
                      premiumTotal: null,
                    })
                  }
                >
                  {US_PICKUP_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="insured-form">
                <div className="insured-form-title">Insured details</div>
                <p className="muted-sm" style={{ marginBottom: 10 }}>
                  Required for your Bonzah policy. Must match your driver&apos;s license.
                </p>
                <div className="insured-grid">
                  <label className="field">
                    <span>First name</span>
                    <input
                      value={insured.firstName}
                      onChange={(e) => setInsuredField('firstName', e.target.value)}
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="field">
                    <span>Last name</span>
                    <input
                      value={insured.lastName}
                      onChange={(e) => setInsuredField('lastName', e.target.value)}
                      autoComplete="family-name"
                    />
                  </label>
                  <label className="field">
                    <span>Date of birth</span>
                    <input
                      type="date"
                      value={insured.dateOfBirth}
                      onChange={(e) => setInsuredField('dateOfBirth', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Phone</span>
                    <input
                      type="tel"
                      value={insured.phone}
                      onChange={(e) => setInsuredField('phone', e.target.value)}
                      placeholder="5615551234"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="field insured-full">
                    <span>Street address</span>
                    <input
                      value={insured.addressLine1}
                      onChange={(e) => setInsuredField('addressLine1', e.target.value)}
                      autoComplete="street-address"
                    />
                  </label>
                  <label className="field">
                    <span>City</span>
                    <input
                      value={insured.city}
                      onChange={(e) => setInsuredField('city', e.target.value)}
                      autoComplete="address-level2"
                    />
                  </label>
                  <label className="field">
                    <span>State</span>
                    <select
                      value={insured.state}
                      onChange={(e) => setInsuredField('state', e.target.value)}
                    >
                      {US_PICKUP_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>ZIP</span>
                    <input
                      value={insured.zipCode}
                      onChange={(e) => setInsuredField('zipCode', e.target.value)}
                      autoComplete="postal-code"
                    />
                  </label>
                </div>
              </div>

              <div className="bonzah-products">
                {BONZAH_PRODUCTS.map((product) => {
                  const on = covers[product.id]
                  const blocked =
                    product.requires === 'rcli' && !covers.rcli && !on
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className={`cover-toggle ${on ? 'on' : ''}`}
                      disabled={blocked}
                      onClick={() => toggleCover(product.id)}
                    >
                      <div className="cover-toggle-hd">
                        <span className={`check ${on ? 'on' : ''}`} />
                        <div>
                          <div className="nm">{product.name}</div>
                          <div className="tagline">{product.tagline}</div>
                        </div>
                      </div>
                      <p className="ds">{product.summary}</p>
                      <ul className="cover-bullets">
                        {product.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                      {rates?.[product.id] && on && (
                        <div className="cover-rate">{rates[product.id]}</div>
                      )}
                      <a
                        className="flyer-link"
                        href={product.flyer}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Description of coverage (PDF)
                      </a>
                    </button>
                  )
                })}
              </div>

              <div className="bonzah-premium-row">
                {premiumLoading && <span className="muted-sm">Calculating premium…</span>}
                {!premiumLoading && coverage.premiumTotal != null && (
                  <span>
                    Trip insurance total:{' '}
                    <b>{formatMoney(coverage.premiumTotal)}</b>
                  </span>
                )}
                {premiumError && (
                  <p className="auth-note" role="alert">
                    {premiumError}
                  </p>
                )}
              </div>

              <p className="bonzah-disclosure">
                By purchasing coverage through this site, you acknowledge that Pablow
                Inc. dba Bonzah.com (&quot;Bonzah&quot;) is the licensed broker of record and
                offers insurance coverage through various insurance carriers. The
                specific carrier issuing your policy will be identified at the time of
                purchase and in your policy documents. Full terms, conditions, limits,
                and exclusions are in the policy documents. See{' '}
                <a href={BONZAH_TERMS_URL} target="_blank" rel="noreferrer">
                  Bonzah Terms
                </a>{' '}
                and{' '}
                <a href={BONZAH_PRIVACY_URL} target="_blank" rel="noreferrer">
                  Privacy
                </a>
                . Review{' '}
                <a
                  href={BONZAH_EXCLUDED_VEHICLES_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  included and restricted vehicle types
                </a>{' '}
                before purchase.
              </p>
            </div>
          )}

          <label className="ackbox">
            <input
              type="checkbox"
              checked={coverage.acknowledged}
              onChange={(e) => setCoverage({ acknowledged: e.target.checked })}
            />
            <span>
              I confirm my coverage extends to renting this vehicle, and I accept
              liability for any gap. <b>Rové is not the insurer.</b>
              {coverage.type === 'protection' && (
                <> Coverage, if purchased, is brokered by Bonzah.</>
              )}
            </span>
          </label>

          {!canContinue && missing.length > 0 && (
            <p className="auth-note" style={{ marginTop: 12 }}>
              To continue: {missing.join(' and ')}.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`cta ${canContinue ? 'sky' : ''}`}
        disabled={!canContinue}
        onClick={() => navigate('/checkout')}
      >
        <span>Confirm coverage</span>
        <Icon name="chevron" size={16} />
      </button>
    </div>
  )
}
