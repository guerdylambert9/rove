import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchUnreadCount } from '../api/notifications.js'
import { useAuth } from '../state/auth.jsx'
import BottomNav from './BottomNav.jsx'

export default function AppBottomNav() {
  const { navVariant, user } = useAuth()
  const { pathname } = useLocation()
  const [inboxUnread, setInboxUnread] = useState(0)

  useEffect(() => {
    if (!user) {
      setInboxUnread(0)
      return
    }

    let cancelled = false
    fetchUnreadCount(user.id)
      .then((count) => {
        if (!cancelled) setInboxUnread(count)
      })
      .catch(() => {
        if (!cancelled) setInboxUnread(0)
      })

    return () => {
      cancelled = true
    }
  }, [user, pathname])

  return <BottomNav variant={navVariant} inboxUnread={inboxUnread} />
}
