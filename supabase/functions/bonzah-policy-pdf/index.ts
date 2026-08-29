import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bonzahAuthToken, bonzahHost } from '../_shared/bonzah.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

async function authorizeTripAccess(
  authHeader: string,
  tripId: string,
) {
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401 as const }
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: trip, error: tripError } = await serviceClient
    .from('trips')
    .select('id, renter_id, owner_id')
    .eq('id', tripId)
    .maybeSingle()

  if (tripError || !trip) {
    return { error: 'Trip not found', status: 404 as const }
  }

  if (trip.renter_id !== user.id && trip.owner_id !== user.id) {
    return { error: 'Forbidden', status: 403 as const }
  }

  return { user, serviceClient }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let tripId: string | null = null
    let pdfKey: string | null = null

    if (req.method === 'POST') {
      const body = await req.json()
      tripId = body.tripId ?? null
      pdfKey = body.pdfKey ?? null
    } else {
      const url = new URL(req.url)
      tripId = url.searchParams.get('tripId')
      pdfKey = url.searchParams.get('pdfKey')
    }

    if (!tripId || !pdfKey) {
      return new Response(
        JSON.stringify({ error: 'tripId and pdfKey (cdw|rcli|sli|pai) required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const auth = await authorizeTripAccess(authHeader, tripId)
    if ('error' in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { serviceClient } = auth

    const { data: coverage, error: covError } = await serviceClient
      .from('coverages')
      .select('bonzah_pdf_ids, bonzah_policy_id, bonzah_raw')
      .eq('trip_id', tripId)
      .maybeSingle()

    if (covError) {
      return new Response(JSON.stringify({ error: covError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!coverage) {
      return new Response(JSON.stringify({ error: 'Coverage not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pdfIds = coverage.bonzah_pdf_ids ?? {}
    const dataId = pdfIds[pdfKey]
    if (!dataId) {
      return new Response(JSON.stringify({ error: 'PDF not available for this cover' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paymentRaw = coverage.bonzah_raw?.payment as Record<string, unknown> | undefined
    const policyId =
      coverage.bonzah_policy_id ??
      (paymentRaw?.policy_id as string | undefined) ??
      null

    if (!policyId) {
      return new Response(
        JSON.stringify({ error: 'Bonzah policy id missing for this trip' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const token = await bonzahAuthToken()
    const pdfUrl =
      `${bonzahHost()}/api/v1/policy/data/${encodeURIComponent(policyId)}` +
      `?data_id=${encodeURIComponent(String(dataId))}&download=1`

    const pdfRes = await fetch(pdfUrl, {
      headers: { 'in-auth-token': token },
    })

    if (!pdfRes.ok) {
      const detail = await pdfRes.text().catch(() => '')
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch policy PDF from Bonzah',
          detail: detail.slice(0, 200) || undefined,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const pdfBytes = await pdfRes.arrayBuffer()
    const contentType = pdfRes.headers.get('content-type') ?? 'application/pdf'

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="bonzah-${pdfKey}-${tripId.slice(0, 8)}.pdf"`,
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'PDF download failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
