import { NextRequest, NextResponse } from 'next/server';

// Calculate travel duration between two places using Google Directions API
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.searchParams.get('origin');
  const destination = req.nextUrl.searchParams.get('destination');
  const mode = req.nextUrl.searchParams.get('mode') || 'driving';

  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination required' }, { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY || '';
  if (!key) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) {
      return NextResponse.json({ error: 'No route found', status: data.status }, { status: 404 });
    }

    const leg = data.routes[0].legs[0];
    return NextResponse.json({
      durationMinutes: Math.round(leg.duration.value / 60),
      durationText: leg.duration.text,
      distanceKm: Math.round(leg.distance.value / 1000),
      distanceText: leg.distance.text,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Directions fetch failed' }, { status: 500 });
  }
}
