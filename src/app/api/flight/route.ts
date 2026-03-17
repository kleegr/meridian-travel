import { NextRequest, NextResponse } from 'next/server';

const CODESHARE_MAP: Record<string, string[]> = {
  'LX3077': ['UA19'],
  'LX3078': ['UA18'],
};

// Airport timezone offsets (hours from UTC) - common US/EU airports
// This is a simplified lookup. For production, use a full IATA timezone database.
const AIRPORT_TZ: Record<string, { offset: number; label: string }> = {
  // US Eastern (EDT = -4, EST = -5)
  JFK: { offset: -4, label: 'EDT' }, LGA: { offset: -4, label: 'EDT' }, EWR: { offset: -4, label: 'EDT' },
  ATL: { offset: -4, label: 'EDT' }, BOS: { offset: -4, label: 'EDT' }, PHL: { offset: -4, label: 'EDT' },
  CLT: { offset: -4, label: 'EDT' }, MIA: { offset: -4, label: 'EDT' }, FLL: { offset: -4, label: 'EDT' },
  MCO: { offset: -4, label: 'EDT' }, IAD: { offset: -4, label: 'EDT' }, DCA: { offset: -4, label: 'EDT' },
  BWI: { offset: -4, label: 'EDT' }, TPA: { offset: -4, label: 'EDT' }, PIT: { offset: -4, label: 'EDT' },
  // US Central (CDT = -5, CST = -6)
  ORD: { offset: -5, label: 'CDT' }, DFW: { offset: -5, label: 'CDT' }, IAH: { offset: -5, label: 'CDT' },
  MSP: { offset: -5, label: 'CDT' }, DTW: { offset: -5, label: 'CDT' }, STL: { offset: -5, label: 'CDT' },
  MCI: { offset: -5, label: 'CDT' }, MSY: { offset: -5, label: 'CDT' }, AUS: { offset: -5, label: 'CDT' },
  SAT: { offset: -5, label: 'CDT' }, MDW: { offset: -5, label: 'CDT' }, HOU: { offset: -5, label: 'CDT' },
  // US Mountain (MDT = -6, MST = -7)
  DEN: { offset: -6, label: 'MDT' }, PHX: { offset: -7, label: 'MST' }, SLC: { offset: -6, label: 'MDT' },
  ABQ: { offset: -6, label: 'MDT' },
  // US Pacific (PDT = -7, PST = -8)
  LAX: { offset: -7, label: 'PDT' }, SFO: { offset: -7, label: 'PDT' }, SEA: { offset: -7, label: 'PDT' },
  SAN: { offset: -7, label: 'PDT' }, PDX: { offset: -7, label: 'PDT' }, SJC: { offset: -7, label: 'PDT' },
  OAK: { offset: -7, label: 'PDT' }, LAS: { offset: -7, label: 'PDT' },
  // US Alaska/Hawaii
  ANC: { offset: -8, label: 'AKDT' }, HNL: { offset: -10, label: 'HST' },
  // Europe
  LHR: { offset: 1, label: 'BST' }, LGW: { offset: 1, label: 'BST' }, CDG: { offset: 2, label: 'CEST' },
  FRA: { offset: 2, label: 'CEST' }, AMS: { offset: 2, label: 'CEST' }, FCO: { offset: 2, label: 'CEST' },
  MXP: { offset: 2, label: 'CEST' }, MAD: { offset: 2, label: 'CEST' }, BCN: { offset: 2, label: 'CEST' },
  MUC: { offset: 2, label: 'CEST' }, ZRH: { offset: 2, label: 'CEST' }, VIE: { offset: 2, label: 'CEST' },
  BRU: { offset: 2, label: 'CEST' }, CPH: { offset: 2, label: 'CEST' }, OSL: { offset: 2, label: 'CEST' },
  ARN: { offset: 2, label: 'CEST' }, HEL: { offset: 3, label: 'EEST' }, IST: { offset: 3, label: 'TRT' },
  ATH: { offset: 3, label: 'EEST' }, BUD: { offset: 2, label: 'CEST' }, PRG: { offset: 2, label: 'CEST' },
  WAW: { offset: 2, label: 'CEST' }, LIS: { offset: 1, label: 'WEST' }, DUB: { offset: 1, label: 'IST' },
  // Middle East
  DXB: { offset: 4, label: 'GST' }, DOH: { offset: 3, label: 'AST' }, TLV: { offset: 3, label: 'IDT' },
  // Asia
  NRT: { offset: 9, label: 'JST' }, HND: { offset: 9, label: 'JST' }, ICN: { offset: 9, label: 'KST' },
  PEK: { offset: 8, label: 'CST' }, PVG: { offset: 8, label: 'CST' }, HKG: { offset: 8, label: 'HKT' },
  SIN: { offset: 8, label: 'SGT' }, BKK: { offset: 7, label: 'ICT' }, DEL: { offset: 5.5, label: 'IST' },
  BOM: { offset: 5.5, label: 'IST' },
  // Other
  SYD: { offset: 10, label: 'AEST' }, MEL: { offset: 10, label: 'AEST' },
  GRU: { offset: -3, label: 'BRT' }, MEX: { offset: -6, label: 'CDT' },
  YYZ: { offset: -4, label: 'EDT' }, YVR: { offset: -7, label: 'PDT' }, YUL: { offset: -4, label: 'EDT' },
  JNB: { offset: 2, label: 'SAST' }, NBO: { offset: 3, label: 'EAT' },
};

function utcToLocal(utcIso: string, airportCode: string): { time: string; date: string; tz: string } {
  if (!utcIso) return { time: '', date: '', tz: '' };
  try {
    const utcDate = new Date(utcIso);
    if (isNaN(utcDate.getTime())) return { time: '', date: '', tz: '' };
    
    const airport = AIRPORT_TZ[airportCode?.toUpperCase()];
    const offsetHours = airport ? airport.offset : 0;
    const tzLabel = airport ? airport.label : 'UTC';
    
    // Apply offset
    const localMs = utcDate.getTime() + (offsetHours * 3600000);
    const localDate = new Date(localMs);
    
    // Format time
    let h = localDate.getUTCHours();
    const m = String(localDate.getUTCMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    
    // Format date
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${months[localDate.getUTCMonth()]} ${localDate.getUTCDate()}, ${localDate.getUTCFullYear()}`;
    
    // Format ISO for datetime-local input
    const isoLocal = `${localDate.getUTCFullYear()}-${String(localDate.getUTCMonth() + 1).padStart(2, '0')}-${String(localDate.getUTCDate()).padStart(2, '0')}T${String(localDate.getUTCHours()).padStart(2, '0')}:${m}`;
    
    return { time: `${h}:${m} ${ampm}`, date: isoLocal, tz: tzLabel };
  } catch { return { time: '', date: '', tz: '' }; }
}

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
          return NextResponse.json({ flights: mapped, source: 'flightaware' });
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
    const originCode = f.origin?.code_iata || f.origin?.code || '';
    const destCode = f.destination?.code_iata || f.destination?.code || '';
    
    // Convert UTC times to local airport times
    const depLocal = utcToLocal(f.scheduled_out || '', originCode);
    const arrLocal = utcToLocal(f.scheduled_in || '', destCode);
    const estDepLocal = utcToLocal(f.estimated_out || '', originCode);
    const estArrLocal = utcToLocal(f.estimated_in || '', destCode);
    const actDepLocal = utcToLocal(f.actual_out || '', originCode);
    const actArrLocal = utcToLocal(f.actual_in || '', destCode);
    
    // Duration from filed_ete (in seconds)
    const durationSec = f.filed_ete || 0;
    const durationH = Math.floor(durationSec / 3600);
    const durationM = Math.floor((durationSec % 3600) / 60);
    const durationStr = durationSec > 0 ? `${durationH}h ${String(durationM).padStart(2, '0')}m` : '';

    return {
      flightNo: f.ident_iata || f.ident || '',
      airline: f.operator || '',
      airlineIata: f.operator_iata || '',
      from: originCode,
      fromCity: f.origin?.city || '',
      fromName: f.origin?.name || '',
      to: destCode,
      toCity: f.destination?.city || '',
      toName: f.destination?.name || '',
      // LOCAL times (converted from UTC using airport timezone)
      scheduledOut: depLocal.date, // ISO for datetime-local input
      estimatedOut: estDepLocal.date,
      actualOut: actDepLocal.date,
      scheduledIn: arrLocal.date,
      estimatedIn: estArrLocal.date,
      actualIn: actArrLocal.date,
      // Display strings with timezone labels
      scheduledDepartureDisplay: depLocal.time ? `${depLocal.time} ${depLocal.tz}` : '',
      scheduledArrivalDisplay: arrLocal.time ? `${arrLocal.time} ${arrLocal.tz}` : '',
      depTimezone: depLocal.tz,
      arrTimezone: arrLocal.tz,
      // Raw UTC for reference
      scheduledOutUtc: f.scheduled_out || '',
      scheduledInUtc: f.scheduled_in || '',
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
