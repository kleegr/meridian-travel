import { NextRequest, NextResponse } from 'next/server';

// FlightAware AeroAPI proxy — fetches live flight data server-side
// Endpoint: GET /api/flight?ident=UA1703&date=2026-03-18

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let ident = searchParams.get('ident')?.trim().toUpperCase() || '';
  const date = searchParams.get('date');

  if (!ident) {
    return NextResponse.json({ error: 'Missing ident parameter' }, { status: 400 });
  }

  const apiKey = process.env.FLIGHTAWARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'No FlightAware API key configured. Add FLIGHTAWARE_API_KEY to Vercel environment variables.', flights: [] });
  }

  // FlightAware accepts both IATA (UA1703) and ICAO (UAL1703) formats
  // Try IATA format first, if no results try with common ICAO conversions
  const results = await tryFetch(ident, date, apiKey);
  if (results.length > 0) {
    return NextResponse.json({ flights: results, source: 'flightaware' });
  }

  // If no results with IATA, try without any specific format tweaks
  // FlightAware sometimes needs just the flight number without leading zeros
  const match = ident.match(/^([A-Z]{2,3})(0*)(\d+)$/);
  if (match) {
    const alt = match[1] + match[3]; // Remove leading zeros
    if (alt !== ident) {
      const results2 = await tryFetch(alt, date, apiKey);
      if (results2.length > 0) {
        return NextResponse.json({ flights: results2, source: 'flightaware' });
      }
    }
  }

  return NextResponse.json({ flights: [], source: 'flightaware', error: 'No flights found for this identifier' });
}

async function tryFetch(ident: string, date: string | null, apiKey: string) {
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
    url += '?' + params.join('&');

    const response = await fetch(url, {
      headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('FlightAware error:', response.status, await response.text().catch(() => ''));
      return [];
    }

    const data = await response.json();
    return (data.flights || []).map((f: any) => ({
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
      scheduledOff: f.scheduled_off || '',
      actualOff: f.actual_off || '',
      scheduledOn: f.scheduled_on || '',
      estimatedOn: f.estimated_on || '',
      actualOn: f.actual_on || '',
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
      route: f.route || '',
      faFlightId: f.fa_flight_id || '',
      cancelled: f.cancelled || false,
      diverted: f.diverted || false,
      filedEte: f.filed_ete || 0,
    }));
  } catch (err) {
    console.error('FlightAware fetch error:', err);
    return [];
  }
}
