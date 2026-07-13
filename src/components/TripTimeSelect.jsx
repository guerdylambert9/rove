import { TRIP_TIME_OPTIONS } from '../lib/tripTimes.js'

export default function TripTimeSelect({ label, value, onChange, id, minValue }) {
  const options =
    minValue != null
      ? TRIP_TIME_OPTIONS.filter((o) => o.value > minValue)
      : TRIP_TIME_OPTIONS

  const safeOptions = options.length > 0 ? options : TRIP_TIME_OPTIONS

  return (
    <label className="timebox" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        className="timebox-select"
        value={safeOptions.some((o) => o.value === value) ? value : safeOptions[0].value}
        onChange={(e) => onChange(e.target.value)}
      >
        {safeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
