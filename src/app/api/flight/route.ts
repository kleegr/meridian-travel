import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawIdent = searchParams.get('ident')?.trim() || '';
  const date = searchParams.get('date');
  const ident = rawIdent.toUpperCase().replace(/\s+/g, '');

  if (!ident || ident.length < 3) {
    return NextResponse.json({ error: 'Missing or invalid flight identifier', flights: [] }, { status: 400 });
  }

  const apiKey = process.env.FLIGHTAWARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'No FlightAware API key configured.', flights: [] });
  }

  try {
    // Try 1: With broad date range (past 14 days to future 14 days)
    let results = await fetchFlightAware(ident, null, apiKey);
    
    // Try 2: If date provided and no results, try with date range
    if (results.length === 0 && date) {
      results = await fetchFlightAware(ident, date, apiKey);
    }

    // Try 3: Without leading zeros
    if (results.length === 0) {
      const match = ident.match(/^([A-Z]{2,3})(0+)(\d+)$/);
      if (match) {
        const alt = match[1] + match[3];
        results = await fetchFlightAware(alt, null, apiKey);
      }
    }

    // Filter to only matching flight numbers
    const reqCode = ident.match(/^([A-Z]{2})/)?.[1] || '';
    const reqNum = ident.replace(/^[A-Z]{2}0*/, '');
    
    const filtered = results.filter((f: any) => {
      const fn = (f.flightNo || '').toUpperCase().replace(/\s+/g, '');
      if (fn === ident) return true;
      const retCode = fn.match(/^([A-Z]{2})/)?.[1] || '';
      const retNum = fn.replace(/^[A-Z]{2}0*/, '');
      if (retCode === reqCode && retNum === reqNum) return true;
      return false;
    });

    if (filtered.length > 0) {
      return NextResponse.json({ flights: filtered, source: 'flightaware' });
    }

    // Return helpful error
    const errMsg = results.length > 0
      ? `Found ${results.length} flights but none matched ${ident}`
      : `No data available for ${ident}. The airline may not have published this flight schedule yet.`;
    return NextResponse.json({ flights: [], source: 'flightaware', error: errMsg });
  } catch (err: any) {
    return NextResponse.json({ flights: [], error: 'Flight tracking service error: ' + (err?.message || 'unknown') });
  }
}

async function fetchFlightAware(ident: string, date: string | null, apiKey: string) {
  let url = `https://aeroapi.flightaware.com/aeroapi/flights/${encodeURIComponent(ident)}`;
  const params: string[] = ['max_pages=1'];
  
  if (date) {
    // Search +/- 7 days around the given date
    const d = new Date(date + 'T00:00:00Z');
    const start = new Date(d); start.setDate(start.getDate() - 7);
    const end = new Date(d); end.setDate(end.getDate() + 7);
    params.push(`start=${start.toISOString().split('T')[0]}`);
    params.push(`end=${end.toISOString().split('T')[0]}`);
  }
  // Without date, FlightAware returns recent/upcoming flights by default
  
  url += '?' + params.join('&');

  const response = await fetch(url, {
    headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`FlightAware HTTP ${response.status}: ${errText.substring(0, 200)}`);
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
}
