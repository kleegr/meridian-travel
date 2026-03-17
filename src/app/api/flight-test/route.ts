import { NextRequest, NextResponse } from 'next/server';

// Diagnostic endpoint to test FlightAware API connectivity
// GET /api/flight-test?ident=DL401
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
    results.flights = (data.flights || []).slice(0, 3).map((f: any) => ({
      ident: f.ident,
      ident_iata: f.ident_iata,
      operator: f.operator,
      origin: f.origin?.code_iata || f.origin?.code,
      destination: f.destination?.code_iata || f.destination?.code,
      status: f.status,
      scheduled_out: f.scheduled_out,
    }));
    
    return NextResponse.json(results);
  } catch (err: any) {
    results.error = err?.message || 'Unknown error';
    return NextResponse.json(results);
  }
}
