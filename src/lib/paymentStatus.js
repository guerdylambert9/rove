const LABELS = {
  pending: 'Payment pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}

const DEPOSIT_LABELS = {
  none: null,
  authorized: 'Deposit held',
  captured: 'Deposit captured',
  released: 'Deposit released',
  failed: 'Deposit hold failed',
}

export function paymentStatusLabel(status) {
  return LABELS[status] ?? status
}

export function depositHoldLabel(status) {
  return DEPOSIT_LABELS[status] ?? null
}

export function paymentSummary(payment) {
  if (!payment) return null

  const parts = []
  if (payment.paymentStatus) {
    parts.push(paymentStatusLabel(payment.paymentStatus))
  }
  const deposit = depositHoldLabel(payment.depositHoldStatus)
  if (deposit) parts.push(deposit)

  return parts.length > 0 ? parts.join(' · ') : null
}
