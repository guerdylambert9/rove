import { TRIP_TIME_OPTIONS } from '../lib/tripTimes.js'

export default function TripTimeSelect({
  label,
  value,
  onChange,
  id,
  minValue,
  options: optionsProp,
  emptyLabel = 'No times available',
}) {
  const base = optionsProp ?? TRIP_TIME_OPTIONS
  const options =
    minValue != null
      ? base.filter((o) => o.value > minValue)
      : base

  if (options.length === 0) {
    return (
      <label className="timebox timebox--disabled" htmlFor={id}>
        <span>{label}</span>
        <span className="timebox-empty">{emptyLabel}</span>
      </label>
    )
  }

  const selected = options.some((o) => o.value === value)
    ? value
    : options[0].value

  return (
    <label className="timebox" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        className="timebox-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
