import { NextRequest, NextResponse } from 'next/server';

const CODESHARE_MAP: Record<string, string[]> = {
  'LX3077': ['UA19'],
  'LX3078': ['UA18'],
};

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
    let results = await fetchFA(ident, null, apiKey);
    let filtered = filterResults(results, ident);
    
    if (filtered.length > 0) return NextResponse.json({ flights: filtered, source: 'flightaware' });

    if (date) {
      results = await fetchFA(ident, date, apiKey);
      filtered = filterResults(results, ident);
      if (filtered.length > 0) return NextResponse.json({ flights: filtered, source: 'flightaware' });
    }

    const noZeros = ident.replace(/^([A-Z]{2})0+/, '$1');
    if (noZeros !== ident) {
      results = await fetchFA(noZeros, null, apiKey);
      filtered = filterResults(results, ident);
      if (filtered.length > 0) return NextResponse.json({ flights: filtered, source: 'flightaware' });
    }

    const codeshares = CODESHARE_MAP[ident];
    if (codeshares) {
      for (const altIdent of codeshares) {
        results = await fetchFA(altIdent, date, apiKey);
        if (results.length > 0) {
          const mapped = results.map((f: any) => ({ ...f, flightNo: ident, originalFlightNo: f.flightNo }));
          return NextResponse.json({ flights: mapped, source: 'flightaware', note: `Found as ${altIdent} (operating carrier)` });
        }
      }
    }

    return NextResponse.json({ flights: [], source: 'flightaware', error: `No data available for ${ident}.` });
  } catch (err: any) {
    console.error('Flight API error:', err?.message || err);
    return NextResponse.json({ flights: [], error: 'Flight tracking service error' });
  }
}

function filterResults(results: any[], ident: string): any[] {
  const reqCode = ident.match(/^([A-Z]{2})/)?.[1] || '';
  const reqNum = ident.replace(/^[A-Z]{2}0*/, '');
  return results.filter((f: any) => {
    const fn = (f.flightNo || '').toUpperCase().replace(/\s+/g, '');
    if (fn === ident) return true;
    const retCode = fn.match(/^([A-Z]{2})/)?.[1] || '';
    const retNum = fn.replace(/^[A-Z]{2}0*/, '');
    if (retCode === reqCode && retNum === reqNum) return true;
    return false;
  });
}

// Format UTC ISO time to 12h format with local time note
function fmtLocalTime(isoUtc: string): string {
  if (!isoUtc) return '';
  try {
    const m = isoUtc.match(/T(\d{2}):(\d{2})/);
    if (!m) return '';
    let h = parseInt(m[1]);
    const min = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${min} ${ampm}`;
  } catch { return ''; }
}

async function fetchFA(ident: string, date: string | null, apiKey: string) {
  let url = `https://aeroapi.flightaware.com/aeroapi/flights/${encodeURIComponent(ident)}`;
  const params: string[] = ['max_pages=1'];
  if (date) {
    const d = new Date(date + 'T00:00:00Z');
    const start = new Date(d); start.setDate(start.getDate() - 7);
    const end = new Date(d); end.setDate(end.getDate() + 7);
    params.push(`start=${start.toISOString().split('T')[0]}`);
    params.push(`end=${end.toISOString().split('T')[0]}`);
  }
  url += '?' + params.join('&');

  const response = await fetch(url, {
    headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`FlightAware HTTP ${response.status} for ${ident}: ${errText.substring(0, 300)}`);
    return [];
  }

  const data = await response.json();
  return (data.flights || []).map((f: any) => {
    // FlightAware returns scheduled_out/in as UTC ISO strings
    // But also returns gate times which may be more accurate
    const depUtc = f.scheduled_out || '';
    const arrUtc = f.scheduled_in || '';
    
    // Calculate duration from filed_ete (seconds)
    const durationSec = f.filed_ete || 0;
    const durationH = Math.floor(durationSec / 3600);
    const durationM = Math.floor((durationSec % 3600) / 60);
    const durationStr = durationSec > 0 ? `${durationH}h ${String(durationM).padStart(2, '0')}m` : '';

    return {
      flightNo: f.ident_iata || f.ident || '',
      airline: f.operator || '',
      airlineIata: f.operator_iata || '',
      from: f.origin?.code_iata || f.origin?.code || '',
      fromCity: f.origin?.city || '',
      fromName: f.origin?.name || '',
      to: f.destination?.code_iata || f.destination?.code || '',
      toCity: f.destination?.city || '',
      toName: f.destination?.name || '',
      // Keep full ISO for datetime-local inputs
      scheduledOut: depUtc,
      estimatedOut: f.estimated_out || '',
      actualOut: f.actual_out || '',
      scheduledIn: arrUtc,
      estimatedIn: f.estimated_in || '',
      actualIn: f.actual_in || '',
      // Pre-formatted display times (from UTC - these are what the API gives us)
      scheduledDepartureDisplay: fmtLocalTime(depUtc),
      scheduledArrivalDisplay: fmtLocalTime(arrUtc),
      duration: durationStr,
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
    };
  });
}
