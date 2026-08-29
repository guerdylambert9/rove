import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchPendingCoverages,
  verifyCoverage,
} from '../api/coverage.js'
import { getCoverageProofUrl } from '../api/coverageProofs.js'
import { formatTripDate } from '../lib/tripDates.js'
import AppBottomNav from '../components/AppBottomNav.jsx'

export default function AdminCoverage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [proofUrls, setProofUrls] = useState({})

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await fetchPendingCoverages()
      setRows(data)
      const urls = {}
      await Promise.all(
        data.map(async (row) => {
          if (!row.proof_file_ref) return
          try {
            urls[row.id] = await getCoverageProofUrl(row.proof_file_ref)
          } catch {
            urls[row.id] = null
          }
        }),
      )
      setProofUrls(urls)
    } catch (err) {
      setError(err.message || 'Could not load queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleVerify = async (coverageId, approved) => {
    let reason = ''
    if (!approved) {
      reason = window.prompt('Rejection reason (optional):') ?? 'Coverage proof rejected'
      if (reason === null) return
    }

    setBusyId(coverageId)
    setError('')
    try {
      await verifyCoverage(coverageId, { approved, reason })
      await load()
    } catch (err) {
      setError(err.message || 'Could not update coverage')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 18, paddingBottom: 100 }}>
          <Link to="/account" className="muted-sm admin-back">
            ← Account
          </Link>
          <h1 className="h1">Coverage review</h1>
          <p className="muted-sm">
            Approve own-policy proofs so renters can sign the rental agreement.
          </p>

          {loading && <p className="auth-note">Loading queue…</p>}
          {error && (
            <p className="auth-note" role="alert">
              {error}
            </p>
          )}

          {!loading && rows.length === 0 && (
            <p className="auth-note">No pending proofs — you&apos;re caught up.</p>
          )}

          <div className="admin-coverage-list">
            {rows.map((row) => {
              const trip = row.trip
              const renter = trip?.renter
              const vehicle = trip?.vehicle?.name ?? 'Vehicle'
              const schedule =
                trip?.pickup_date && trip?.return_date
                  ? `${formatTripDate(trip.pickup_date)} – ${formatTripDate(trip.return_date)}`
                  : '—'

              return (
                <div key={row.id} className="admin-coverage-card">
                  <div className="nm">{vehicle}</div>
                  <div className="sm">{schedule}</div>
                  <div className="sm">
                    Renter: {renter?.name ?? renter?.email ?? trip?.renter_id?.slice(0, 8)}
                  </div>
                  <div className="sm">Trip state: {trip?.state ?? '—'}</div>
                  {proofUrls[row.id] && (
                    <a
                      href={proofUrls[row.id]}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-proof-link"
                    >
                      View proof
                    </a>
                  )}
                  <div className="trip-card-actions">
                    <button
                      type="button"
                      className="trip-return-btn trip-return-btn--primary"
                      disabled={busyId === row.id}
                      onClick={() => handleVerify(row.id, true)}
                    >
                      {busyId === row.id ? 'Saving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="trip-return-btn"
                      disabled={busyId === row.id}
                      onClick={() => handleVerify(row.id, false)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <AppBottomNav active="account" />
    </div>
  )
}
