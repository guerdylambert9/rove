import { PASSWORD_RULES, getPasswordStrength } from '../lib/password.js'

export default function PasswordField({
  value,
  onChange,
  autoComplete = 'new-password',
  showRules = true,
}) {
  const strength = getPasswordStrength(value)

  return (
    <div className="pwfield">
      <label className="authfield">
        <span>Password</span>
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Create a strong password"
          required
          autoComplete={autoComplete}
        />
      </label>

      {value && (
        <div className="pwstrength" data-score={strength.score}>
          <div className="pwstrength-bar" />
          <span className="pwstrength-label">{strength.label}</span>
        </div>
      )}

      {showRules && (
        <ul className="pwrules">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(value)
            return (
              <li key={rule.id} className={met ? 'met' : ''}>
                {rule.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
