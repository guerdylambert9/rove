import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  bonzahConfigured,
  bonzahFetch,
  dropOffTimeLabel,
  toBonzahDate,
} from '../_shared/bonzah.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!bonzahConfigured()) {
      return new Response(
        JSON.stringify({
          error:
            'Bonzah is not configured. Set BONZAH_EMAIL and BONZAH_PASSWORD as Edge secrets.',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const {
      tripStartDate,
      tripEndDate,
      pickupCountry = 'United States',
      pickupState = 'Florida',
      pickupTime,
      returnTime,
      cdw = true,
      rcli = true,
      sli = false,
      pai = false,
    } = body ?? {}

    if (!tripStartDate || !tripEndDate) {
      return new Response(
        JSON.stringify({ error: 'tripStartDate and tripEndDate are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (sli && !rcli) {
      return new Response(
        JSON.stringify({
          error: 'Supplemental Liability (SLI) requires RCLI coverage',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!cdw && !rcli && !sli && !pai) {
      return new Response(
        JSON.stringify({ error: 'Select at least one coverage product' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const json = await bonzahFetch('/api/v1/Bonzah/premiumCalc', {
      body: {
        trip_start_date: toBonzahDate(tripStartDate),
        trip_end_date: toBonzahDate(tripEndDate),
        pickup_country: pickupCountry,
        pickup_state: pickupState,
        drop_off_time: dropOffTimeLabel(pickupTime, returnTime),
        cdw_cover: Boolean(cdw),
        rcli_cover: Boolean(rcli),
        sli_cover: Boolean(sli),
        pai_cover: Boolean(pai),
        skip_validation: true,
      },
    })

    if (json?.status !== 0) {
      return new Response(
        JSON.stringify({
          error: json?.txt || 'Premium calculation failed',
          details: json?.data?.errors ?? null,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const data = json.data ?? {}
    const totalPremium = Number(data.total_premium ?? 0)

    return new Response(
      JSON.stringify({
        totalPremium,
        totalDays: data.total_days ?? null,
        rates: {
          cdw: data.cdw_rate ?? null,
          rcli: data.rcli_rate ?? null,
          sli: data.sli_rate ?? null,
          pai: data.pai_rate ?? null,
        },
        coverageInformation: data.coverage_information ?? [],
        limits: {
          rcliBodilyPerPerson: data.f_cov_lable_prem1 ?? null,
          rcliBodilyAggregate: data.f_cov_lable_prem2 ?? null,
          rcliProperty: data.f_cov_lable_prem3 ?? null,
          sliBodilyPerPerson: data.f_sli_bodily_injury_perperson ?? null,
          sliBodilyAggregate: data.f_sli_bodily_injury_aggregate ?? null,
          sliProperty: data.f_sli_property_damage ?? null,
        },
        paiAllowed: data.pai_isallowed !== 'No',
        pickupState,
        pickupCountry,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Premium calculation failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
