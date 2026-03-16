import { NextRequest, NextResponse } from 'next/server';

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

  const results = await tryFetch(ident, date, apiKey);
  
  // CRITICAL: Filter results to only include flights that match the requested flight number
  // FlightAware sometimes returns unrelated flights
  const filtered = results.filter((f: any) => {
    const returnedFn = (f.flightNo || '').toUpperCase().replace(/\s/g, '');
    const requestedFn = ident.toUpperCase().replace(/\s/g, '');
    // Must match the flight number (exact or with/without leading zeros)
    if (returnedFn === requestedFn) return true;
    // Match without leading zeros on the number part
    const reqMatch = requestedFn.match(/^([A-Z]{2})(0*)(\d+)$/);
    const retMatch = returnedFn.match(/^([A-Z]{2})(0*)(\d+)$/);
    if (reqMatch && retMatch && reqMatch[1] === retMatch[1] && reqMatch[3] === retMatch[3]) return true;
    return false;
  });

  if (filtered.length > 0) {
    return NextResponse.json({ flights: filtered, source: 'flightaware' });
  }

  // Try without leading zeros
  const match = ident.match(/^([A-Z]{2,3})(0*)(\d+)$/);
  if (match) {
    const alt = match[1] + match[3];
    if (alt !== ident) {
      const results2 = await tryFetch(alt, date, apiKey);
      const filtered2 = results2.filter((f: any) => {
        const fn = (f.flightNo || '').toUpperCase().replace(/\s/g, '');
        return fn === alt || fn === ident;
      });
      if (filtered2.length > 0) {
        return NextResponse.json({ flights: filtered2, source: 'flightaware' });
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
  } catch (err) {
    console.error('FlightAware fetch error:', err);
    return [];
  }
}
