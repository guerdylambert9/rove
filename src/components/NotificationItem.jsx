import { formatRelativeTime } from '../lib/formatRelativeTime.js'

export default function NotificationItem({ notification, onOpen }) {
  return (
    <button
      type="button"
      className={`notify-item ${notification.unread ? 'notify-item--unread' : ''}`}
      onClick={() => onOpen(notification)}
    >
      <div className="notify-item-head">
        <span className="notify-item-title">{notification.title}</span>
        <span className="notify-item-time">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
      <p className="notify-item-body">{notification.body}</p>
    </button>
  )
}
