import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import NotificationItem from '../components/NotificationItem.jsx'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications.js'
import { useAuth } from '../state/auth.jsx'

export default function Inbox() {
  const navigate = useNavigate()
  const { user, loading: authLoading, navVariant } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false
    fetchNotifications(user.id)
      .then((data) => {
        if (!cancelled) setNotifications(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load notifications')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleOpen = async (notification) => {
    if (notification.unread) {
      try {
        await markNotificationRead(notification.id)
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, unread: false, readAt: new Date().toISOString() }
              : n,
          ),
        )
      } catch {
        // Still navigate even if mark-read fails
      }
    }

    const tripsPath = navVariant === 'owner' ? '/dashboard' : '/trips'
    navigate(tripsPath)
  }

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return
    try {
      await markAllNotificationsRead(user.id)
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          unread: false,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      )
    } catch (err) {
      setError(err.message || 'Could not mark notifications read')
    }
  }

  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <div className="inbox-head">
            <h1 className="h1">Inbox</h1>
            {user && unreadCount > 0 && (
              <button
                type="button"
                className="auth-switch"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {authLoading && <p className="auth-note">Loading…</p>}
          {!authLoading && !user && (
            <>
              <p className="auth-note">
                Sign in to see booking updates and trip notifications.
              </p>
              <button
                type="button"
                className="auth-switch"
                onClick={() => navigate('/account', { state: { from: '/inbox' } })}
              >
                Go to Account
              </button>
            </>
          )}
          {user && loading && <p className="auth-note">Loading notifications…</p>}
          {error && <p className="auth-error">{error}</p>}
          {user && !loading && !error && notifications.length === 0 && (
            <p className="auth-note">
              No notifications yet. You&apos;ll be notified when a trip is booked or
              updated.
            </p>
          )}
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={handleOpen}
            />
          ))}
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
