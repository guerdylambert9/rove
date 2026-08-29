import { useEffect, useState } from 'react'

function formatLocalTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: undefined, // respect locale (12h vs 24h)
  }).format(date)
}

/** Decorative phone chrome — clock follows the device timezone (where the app is open). */
export default function StatusBar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 30_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return (
    <div className="statusbar">
      <span>{formatLocalTime(now)}</span>
      <span className="signal" aria-hidden="true" />
    </div>
  )
}
