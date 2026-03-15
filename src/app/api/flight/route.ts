import { NextRequest, NextResponse } from 'next/server';

// FlightAware AeroAPI proxy — fetches live flight data server-side
// Personal tier: pay-per-query, no monthly minimum
// Sign up at: https://www.flightaware.com/aeroapi/signup/personal
// Endpoint: GET /api/flight?ident=DL401&date=2026-03-18

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ident = searchParams.get('ident')?.trim().toUpperCase();
  const date = searchParams.get('date'); // optional: YYYY-MM-DD

  if (!ident) {
    return NextResponse.json({ error: 'Missing ident parameter' }, { status: 400 });
  }

  const apiKey = process.env.FLIGHTAWARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: 'No FlightAware API key configured. Add FLIGHTAWARE_API_KEY to Vercel environment variables. Sign up at https://www.flightaware.com/aeroapi/signup/personal',
      flights: [],
    });
  }

  try {
    // Build URL with optional date range
    let url = `https://aeroapi.flightaware.com/aeroapi/flights/${encodeURIComponent(ident)}`;
    const params: string[] = ['max_pages=1'];
    if (date) {
      // Search ±1 day around the given date
      const d = new Date(date + 'T00:00:00Z');
      const start = new Date(d); start.setDate(start.getDate() - 1);
      const end = new Date(d); end.setDate(end.getDate() + 2);
      params.push(`start=${start.toISOString().split('T')[0]}`);
      params.push(`end=${end.toISOString().split('T')[0]}`);
    }
    if (params.length) url += '?' + params.join('&');

    const response = await fetch(url, {
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('FlightAware error:', response.status, errText);
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
      // Times
      scheduledOut: f.scheduled_out || '',
      estimatedOut: f.estimated_out || '',
      actualOut: f.actual_out || '',
      scheduledOff: f.scheduled_off || '',
      actualOff: f.actual_off || '',
      scheduledOn: f.scheduled_on || '',
      estimatedOn: f.estimated_on || '',
      actualOn: f.actual_on || '',
      scheduledIn: f.scheduled_in || '',
      estimatedIn: f.estimated_in || '',
      actualIn: f.actual_in || '',
      // Status
      status: f.status || '',
      // Details
      aircraft: f.aircraft_type || '',
      registration: f.registration || '',
      departureDelay: f.departure_delay || 0,
      arrivalDelay: f.arrival_delay || 0,
      gateOrigin: f.gate_origin || '',
      gateDestination: f.gate_destination || '',
      terminalOrigin: f.terminal_origin || '',
      terminalDestination: f.terminal_destination || '',
      route: f.route || '',
      faFlightId: f.fa_flight_id || '',
      cancelled: f.cancelled || false,
      diverted: f.diverted || false,
      // Duration calc
      filedEte: f.filed_ete || 0,
    }));

    return NextResponse.json({ flights, source: 'flightaware' });
  } catch (err) {
    console.error('FlightAware fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch flight data', flights: [] });
  }
}
