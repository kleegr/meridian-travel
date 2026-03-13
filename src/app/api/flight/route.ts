import { NextRequest, NextResponse } from 'next/server';

// AviationStack API proxy — fetches live flight data server-side
// FREE plan: 100 requests/month, no credit card
// Sign up at: https://aviationstack.com/signup/free
// Endpoint: GET /api/flight?ident=DL401&date=2026-03-18

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ident = searchParams.get('ident')?.trim().toUpperCase();
  const date = searchParams.get('date'); // optional: YYYY-MM-DD

  if (!ident) {
    return NextResponse.json({ error: 'Missing ident parameter' }, { status: 400 });
  }

  // Try AviationStack first, then FlightAware as fallback
  const aviationStackKey = process.env.AVIATIONSTACK_API_KEY;
  const flightAwareKey = process.env.FLIGHTAWARE_API_KEY;

  if (aviationStackKey) {
    return handleAviationStack(ident, date, aviationStackKey);
  }
  if (flightAwareKey) {
    return handleFlightAware(ident, date, flightAwareKey);
  }

  return NextResponse.json({
    error: 'No flight API key configured. Add AVIATIONSTACK_API_KEY (free) to Vercel environment variables. Sign up at https://aviationstack.com/signup/free',
    flights: [],
  });
}

// AviationStack (FREE tier: 100 requests/month)
async function handleAviationStack(ident: string, date: string | null, apiKey: string) {
  try {
    // Parse airline code and flight number
    const match = ident.match(/^([A-Z]{2})(\d+)$/);
    const params = new URLSearchParams({
      access_key: apiKey,
      flight_iata: ident,
    });
    if (date) params.set('flight_date', date);

    // Note: free plan only supports http, not https
    const url = `http://api.aviationstack.com/v1/flights?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('AviationStack error:', response.status);
      return NextResponse.json({ error: `AviationStack API error: ${response.status}`, flights: [] });
    }

    const data = await response.json();
    if (data.error) {
      console.error('AviationStack error:', data.error);
      return NextResponse.json({ error: data.error.message || 'API error', flights: [] });
    }

    const flights = (data.data || []).map((f: any) => ({
      flightNo: f.flight?.iata || ident,
      airline: f.airline?.name || '',
      airlineIata: f.airline?.iata || '',
      from: f.departure?.iata || '',
      fromCity: f.departure?.airport || '',
      fromName: f.departure?.airport || '',
      to: f.arrival?.iata || '',
      toCity: f.arrival?.airport || '',
      toName: f.arrival?.airport || '',
      scheduledOut: f.departure?.scheduled || '',
      estimatedOut: f.departure?.estimated || '',
      actualOut: f.departure?.actual || '',
      scheduledIn: f.arrival?.scheduled || '',
      estimatedIn: f.arrival?.estimated || '',
      actualIn: f.arrival?.actual || '',
      status: f.flight_status || '',
      aircraft: f.aircraft?.iata || '',
      registration: f.aircraft?.registration || '',
      departureDelay: f.departure?.delay ? f.departure.delay * 60 : 0, // convert min to sec
      arrivalDelay: f.arrival?.delay ? f.arrival.delay * 60 : 0,
      gateOrigin: f.departure?.gate || '',
      gateDestination: f.arrival?.gate || '',
      terminalOrigin: f.departure?.terminal || '',
      terminalDestination: f.arrival?.terminal || '',
      cancelled: f.flight_status === 'cancelled',
      diverted: f.flight_status === 'diverted',
      filedEte: 0,
    }));

    return NextResponse.json({ flights, source: 'aviationstack' });
  } catch (err) {
    console.error('AviationStack fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch flight data', flights: [] });
  }
}

// FlightAware AeroAPI (paid)
async function handleFlightAware(ident: string, date: string | null, apiKey: string) {
  try {
    let url = `https://aeroapi.flightaware.com/aeroapi/flights/${encodeURIComponent(ident)}`;
    const params: string[] = ['max_pages=1'];
    if (date) {
      const d = new Date(date + 'T00:00:00Z');
      const start = new Date(d); start.setDate(start.getDate() - 1);
      const end = new Date(d); end.setDate(end.getDate() + 2);
      params.push(`start=${start.toISOString().split('T')[0]}`);
      params.push(`end=${end.toISOString().split('T')[0]}`);
    }
    if (params.length) url += '?' + params.join('&');

    const response = await fetch(url, {
      headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `FlightAware API error: ${response.status}`, flights: [] });
    }

    const data = await response.json();
    const flights = (data.flights || []).map((f: any) => ({
      flightNo: f.ident_iata || f.ident || '',
      airline: f.operator || '',
      airlineIata: f.operator_iata || '',
      from: f.origin?.code_iata || f.origin?.code || '',
      fromCity: f.origin?.city || '',
      fromName: f.origin?.name || '',
      to: f.destination?.code_iata || f.destination?.code || '',
      toCity: f.destination?.city || '',
      toName: f.destination?.name || '',
      scheduledOut: f.scheduled_out || '',
      estimatedOut: f.estimated_out || '',
      actualOut: f.actual_out || '',
      scheduledIn: f.scheduled_in || '',
      estimatedIn: f.estimated_in || '',
      actualIn: f.actual_in || '',
      status: f.status || '',
      aircraft: f.aircraft_type || '',
      registration: f.registration || '',
      departureDelay: f.departure_delay || 0,
      arrivalDelay: f.arrival_delay || 0,
      gateOrigin: f.gate_origin || '',
      gateDestination: f.gate_destination || '',
      terminalOrigin: f.terminal_origin || '',
      terminalDestination: f.terminal_destination || '',
      cancelled: f.cancelled || false,
      diverted: f.diverted || false,
      filedEte: f.filed_ete || 0,
    }));

    return NextResponse.json({ flights, source: 'flightaware' });
  } catch (err) {
    console.error('FlightAware fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch flight data', flights: [] });
  }
}
