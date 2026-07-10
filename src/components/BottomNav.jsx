import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'

// `variant` switches between the renter tabs and the owner tabs.
export default function BottomNav({ variant = 'renter', inboxUnread = 0 }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tabs =
    variant === 'owner'
      ? [
          { icon: 'browse', label: 'Home', to: '/dashboard' },
          { icon: 'fleet', label: 'Fleet', to: '/fleet' },
          { icon: 'chat', label: 'Inbox', to: '/inbox', badge: inboxUnread },
          { icon: 'account', label: 'Account', to: '/account' },
        ]
      : [
          { icon: 'browse', label: 'Browse', to: '/' },
          { icon: 'trips', label: 'Trips', to: '/trips' },
          { icon: 'chat', label: 'Inbox', to: '/inbox', badge: inboxUnread },
          { icon: 'account', label: 'Account', to: '/account' },
        ]

  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const active =
          pathname === t.to ||
          (t.to === '/fleet' && pathname.startsWith('/fleet'))
        return (
          <button
            key={t.label}
            className={`tab ${active ? 'on' : ''}`}
            onClick={() => navigate(t.to)}
          >
            <span className="tab-icon-wrap">
              <Icon name={t.icon} size={22} />
              {t.badge > 0 && (
                <span className="tab-badge">
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              )}
            </span>
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
