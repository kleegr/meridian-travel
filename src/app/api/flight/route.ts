import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawIdent = searchParams.get('ident')?.trim() || '';
  const date = searchParams.get('date');
  
  // Normalize: uppercase, remove spaces
  const ident = rawIdent.toUpperCase().replace(/\s+/g, '');

  if (!ident || ident.length < 3) {
    return NextResponse.json({ error: 'Missing or invalid flight identifier', flights: [] }, { status: 400 });
  }

  const apiKey = process.env.FLIGHTAWARE_API_KEY;
  if (!apiKey) {
    console.log('No FLIGHTAWARE_API_KEY set');
    return NextResponse.json({ error: 'No FlightAware API key configured. Add FLIGHTAWARE_API_KEY to Vercel env vars.', flights: [] });
  }

  console.log(`Flight lookup: ident=${ident}, date=${date || 'none'}, apiKey=${apiKey.substring(0, 6)}...`);

  try {
    const results = await fetchFlightAware(ident, date, apiKey);
    console.log(`FlightAware returned ${results.length} raw results for ${ident}`);
    
    // STRICT VALIDATION: Only return flights matching the EXACT requested flight number
    const requestedCode = ident.match(/^([A-Z]{2})(\d+)$/)?.[1] || '';
    const requestedNum = ident.match(/^([A-Z]{2})(\d+)$/)?.[2] || '';
    
    const filtered = results.filter((f: any) => {
      const fn = (f.flightNo || '').toUpperCase().replace(/\s+/g, '');
      // Exact match
      if (fn === ident) return true;
      // Match ignoring leading zeros
      if (requestedCode && requestedNum) {
        const retCode = fn.match(/^([A-Z]{2})/)?.[1] || '';
        const retNum = fn.replace(/^[A-Z]+0*/, '');
        const reqNum = requestedNum.replace(/^0+/, '');
        if (retCode === requestedCode && retNum === reqNum) return true;
      }
      return false;
    });
    
    console.log(`After filtering: ${filtered.length} matching flights (requested: ${ident}, got: ${results.map((f: any) => f.flightNo).join(', ')})`);

    if (filtered.length > 0) {
      return NextResponse.json({ flights: filtered, source: 'flightaware' });
    }

    return NextResponse.json({ 
      flights: [], 
      source: 'flightaware',
      error: results.length > 0 
        ? `API returned ${results.length} flights but none matched ${ident} (got: ${results.map((f: any) => f.flightNo).join(', ')})` 
        : `No flights found for ${ident}` 
    });
  } catch (err: any) {
    console.error('Flight API error:', err?.message || err);
    return NextResponse.json({ flights: [], error: 'Flight tracking service error' });
  }
}

async function fetchFlightAware(ident: string, date: string | null, apiKey: string) {
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
  
  console.log(`FlightAware request: ${url}`);

  const response = await fetch(url, {
    headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`FlightAware HTTP ${response.status}: ${errText.substring(0, 200)}`);
    return [];
  }

  const data = await response.json();
  console.log(`FlightAware response: ${(data.flights || []).length} flights`);
  
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
