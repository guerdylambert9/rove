const LABELS = {
  requested: 'Requested',
  coverage_pending: 'Coverage pending',
  coverage_verified: 'Coverage verified',
  agreement_signed: 'Agreement signed',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  returned: 'Returned',
  deposit_released: 'Deposit released',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
}

export function tripStateLabel(state) {
  return LABELS[state] ?? state
}
