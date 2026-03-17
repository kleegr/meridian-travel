import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ident = (searchParams.get('ident') || 'DL401').toUpperCase().replace(/\s+/g, '');
  
  const apiKey = process.env.FLIGHTAWARE_API_KEY;
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    ident,
    apiKeySet: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET',
  };

  if (!apiKey) {
    return NextResponse.json({ ...results, error: 'FLIGHTAWARE_API_KEY not set' });
  }

  try {
    const url = `https://aeroapi.flightaware.com/aeroapi/flights/${encodeURIComponent(ident)}?max_pages=1`;
    results.requestUrl = url;
    
    const response = await fetch(url, {
      headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
    });
    
    results.httpStatus = response.status;
    results.httpStatusText = response.statusText;
    
    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      results.errorBody = errBody.substring(0, 500);
      return NextResponse.json(results);
    }

    const data = await response.json();
    results.totalFlights = (data.flights || []).length;
    
    // Show RAW data for first 2 flights - including exact time formats
    results.rawFlights = (data.flights || []).slice(0, 2).map((f: any) => ({
      ident: f.ident,
      ident_iata: f.ident_iata,
      operator: f.operator,
      origin_iata: f.origin?.code_iata,
      origin_city: f.origin?.city,
      destination_iata: f.destination?.code_iata,
      destination_city: f.destination?.city,
      status: f.status,
      // RAW TIME VALUES - to see exact format (UTC vs local offset)
      scheduled_out_RAW: f.scheduled_out,
      scheduled_in_RAW: f.scheduled_in,
      estimated_out_RAW: f.estimated_out,
      actual_out_RAW: f.actual_out,
      // Duration and timing
      filed_ete_RAW: f.filed_ete,
      filed_ete_minutes: f.filed_ete ? Math.round(f.filed_ete / 60) : null,
      // Gate/terminal
      gate_origin: f.gate_origin,
      gate_destination: f.gate_destination,
      terminal_origin: f.terminal_origin,
      terminal_destination: f.terminal_destination,
      aircraft_type: f.aircraft_type,
    }));
    
    return NextResponse.json(results);
  } catch (err: any) {
    results.error = err?.message || 'Unknown error';
    return NextResponse.json(results);
  }
}
