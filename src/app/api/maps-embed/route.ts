import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.searchParams.get('origin');
  const destination = req.nextUrl.searchParams.get('destination');
  
  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination required' }, { status: 400 });
  }

  // Try multiple env var names for the Google Maps key
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_KEY || '';
  
  if (!key) {
    return NextResponse.json({ error: 'No Google Maps API key configured' }, { status: 500 });
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving`;
  
  return NextResponse.json({ embedUrl });
}
