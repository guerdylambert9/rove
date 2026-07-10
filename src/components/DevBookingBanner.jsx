import { bypassInsuranceGate, bypassPaymentGate } from '../lib/bookingFlags.js'

export default function DevBookingBanner({ context = 'booking' }) {
  if (!bypassInsuranceGate && !bypassPaymentGate) return null

  const parts = []
  if (bypassInsuranceGate) parts.push('insurance')
  if (bypassPaymentGate) parts.push('payment')

  return (
    <div className="dev-booking-banner" role="status">
      <strong>Dev mode</strong> — {parts.join(' & ')} gate bypassed on this screen.
      {context === 'booking' && ' Remove VITE_DEV_BOOKING_BYPASS from .env before launch.'}
    </div>
  )
}
