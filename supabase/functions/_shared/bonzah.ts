/** Shared Bonzah API helpers for Edge Functions. Secrets must stay server-side. */

export type BonzahCovers = {
  cdw: boolean
  rcli: boolean
  sli: boolean
  pai: boolean
}

export function bonzahHost(): string {
  return (
    Deno.env.get('BONZAH_HOST')?.replace(/\/$/, '') ||
    'https://bonzah.sb.insillion.com'
  )
}

export function bonzahConfigured(): boolean {
  return Boolean(Deno.env.get('BONZAH_EMAIL') && Deno.env.get('BONZAH_PASSWORD'))
}

export async function bonzahAuthToken(): Promise<string> {
  const email = Deno.env.get('BONZAH_EMAIL')
  const pwd = Deno.env.get('BONZAH_PASSWORD')
  if (!email || !pwd) {
    throw new Error('BONZAH_EMAIL and BONZAH_PASSWORD must be set as Edge secrets')
  }

  const res = await fetch(`${bonzahHost()}/api/v1/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pwd }),
  })

  const json = await res.json()
  if (!res.ok || json?.status !== 0 || !json?.data?.token) {
    throw new Error(json?.txt || 'Bonzah authentication failed')
  }

  return json.data.token as string
}

/** YYYY-MM-DD → MM/DD/YYYY */
export function toBonzahDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) throw new Error(`Invalid date: ${isoDate}`)
  return `${m}/${d}/${y}`
}

export function dropOffTimeLabel(
  pickupTime?: string | null,
  returnTime?: string | null,
): 'Same' | 'Later' {
  if (!pickupTime || !returnTime) return 'Same'
  return pickupTime === returnTime ? 'Same' : 'Later'
}

export async function bonzahFetch(
  path: string,
  {
    method = 'POST',
    body,
    token,
  }: {
    method?: string
    body?: unknown
    token?: string
  } = {},
) {
  const auth = token ?? (await bonzahAuthToken())
  const res = await fetch(`${bonzahHost()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'in-auth-token': auth,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.txt || `Bonzah HTTP ${res.status}`)
  }
  return json
}
