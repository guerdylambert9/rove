import { useEffect, useMemo, useState } from 'react'
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  fetchVehicleBlocks,
} from '../api/availability.js'
import { toISODate } from '../lib/tripDates.js'

function monthMatrix(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toISODate(new Date(year, monthIndex, d)))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function isBlocked(iso, blocks) {
  return blocks.some((b) => b.startDate <= iso && b.endDate >= iso)
}

export default function AvailabilityCalendar({ vehicleId }) {
  const today = toISODate(new Date())
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectStart, setSelectStart] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    if (!vehicleId) return
    setLoading(true)
    fetchVehicleBlocks(vehicleId)
      .then(setBlocks)
      .catch((err) => setError(err.message || 'Could not load calendar'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [vehicleId])

  const cells = useMemo(
    () => monthMatrix(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )

  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' },
  )

  const shiftMonth = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
    setSelectStart(null)
  }

  const onDayClick = async (iso) => {
    if (!iso || iso < today || busy) return
    setError('')

    if (!selectStart) {
      setSelectStart(iso)
      return
    }

    const start = selectStart <= iso ? selectStart : iso
    const end = selectStart <= iso ? iso : selectStart
    setBusy(true)
    try {
      const block = await createAvailabilityBlock({
        vehicleId,
        startDate: start,
        endDate: end,
        reason: 'Owner blocked',
      })
      setBlocks((prev) => [...prev, block].sort((a, b) => a.startDate.localeCompare(b.startDate)))
      setSelectStart(null)
    } catch (err) {
      setError(err.message || 'Could not block dates')
    } finally {
      setBusy(false)
    }
  }

  const removeBlock = async (id) => {
    setBusy(true)
    setError('')
    try {
      await deleteAvailabilityBlock(id)
      setBlocks((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      setError(err.message || 'Could not remove block')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="avail-cal">
      <div className="avail-cal-head">
        <button type="button" className="avail-nav" onClick={() => shiftMonth(-1)}>
          ‹
        </button>
        <h3>{label}</h3>
        <button type="button" className="avail-nav" onClick={() => shiftMonth(1)}>
          ›
        </button>
      </div>
      <p className="auth-note avail-hint">
        Tap a day (or a start then end) to block dates. Blocked cars leave Browse for
        those days.
      </p>
      {selectStart && (
        <p className="auth-note">
          Start: {selectStart} — tap an end date, or tap again after save.
        </p>
      )}
      {loading && <p className="auth-note">Loading calendar…</p>}
      {error && <p className="auth-error">{error}</p>}

      <div className="avail-weekdays">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="avail-grid">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e-${i}`} className="avail-day avail-day--empty" />
          const blocked = isBlocked(iso, blocks)
          const past = iso < today
          const selected = iso === selectStart
          return (
            <button
              key={iso}
              type="button"
              className={[
                'avail-day',
                blocked ? 'avail-day--blocked' : '',
                past ? 'avail-day--past' : '',
                selected ? 'avail-day--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={past || busy || blocked}
              onClick={() => onDayClick(iso)}
            >
              {Number(iso.slice(-2))}
            </button>
          )
        })}
      </div>

      {blocks.length > 0 && (
        <ul className="avail-block-list">
          {blocks.map((b) => (
            <li key={b.id}>
              <span>
                {b.startDate}
                {b.endDate !== b.startDate ? ` → ${b.endDate}` : ''}
              </span>
              <button
                type="button"
                className="linkbtn"
                disabled={busy}
                onClick={() => removeBlock(b.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
