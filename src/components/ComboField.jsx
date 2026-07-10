import { useEffect, useId, useRef, useState } from 'react'

export default function ComboField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    const close = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const pick = (option) => {
    onChange(option)
    setOpen(false)
  }

  return (
    <div className="authfield combofield" ref={wrapRef}>
      <span>{label}</span>
      <div className="combofield-row">
        <input
          type="text"
          className="combofield-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          role="combobox"
        />
        <button
          type="button"
          className="combofield-toggle"
          aria-label={`${open ? 'Hide' : 'Show'} ${label} options`}
          aria-expanded={open}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          ▾
        </button>
      </div>

      {open && (
        <ul id={listId} className="combofield-list" role="listbox">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                className={`combofield-option${option === value ? ' is-selected' : ''}`}
                onClick={() => pick(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}

      <span className="combofield-hint">Pick a suggestion or type your own</span>
    </div>
  )
}
