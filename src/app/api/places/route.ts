import { NextRequest, NextResponse } from 'next/server';

// Google Places API proxy — fetches hotel details + photos
// Requires GOOGLE_PLACES_API_KEY env var

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // Action: key — return the API key for client-side Places Autocomplete
  if (action === 'key') {
    if (!API_KEY) return NextResponse.json({ key: null });
    return NextResponse.json({ key: API_KEY });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to Vercel env vars.' }, { status: 500 });
  }

  try {
    if (action === 'search') {
      const query = searchParams.get('query') || '';
      if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=lodging&key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.results?.length) return NextResponse.json({ results: [] });
      const results = data.results.slice(0, 5).map((place: any) => ({
        placeId: place.place_id, name: place.name, address: place.formatted_address,
        rating: place.rating, totalRatings: place.user_ratings_total, priceLevel: place.price_level,
        photo: place.photos?.[0]?.photo_reference || null, location: place.geometry?.location,
      }));
      return NextResponse.json({ results });
    }

    if (action === 'details') {
      const placeId = searchParams.get('placeId') || '';
      if (!placeId) return NextResponse.json({ error: 'Missing placeId' }, { status: 400 });
      const fields = 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,photos,reviews,types,opening_hours,geometry';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.result) return NextResponse.json({ error: 'Place not found' }, { status: 404 });
      const place = data.result;
      return NextResponse.json({
        name: place.name, address: place.formatted_address, phone: place.formatted_phone_number,
        website: place.website, rating: place.rating, totalRatings: place.user_ratings_total,
        priceLevel: place.price_level, location: place.geometry?.location,
        photos: (place.photos || []).slice(0, 6).map((p: any) => ({ ref: p.photo_reference, width: p.width, height: p.height })),
        reviews: (place.reviews || []).slice(0, 3).map((r: any) => ({ author: r.author_name, rating: r.rating, text: r.text?.substring(0, 200), time: r.relative_time_description })),
        hours: place.opening_hours?.weekday_text || [],
      });
    }

    if (action === 'photo') {
      const ref = searchParams.get('ref') || '';
      const maxWidth = searchParams.get('maxWidth') || '800';
      if (!ref) return NextResponse.json({ error: 'Missing photo ref' }, { status: 400 });
      const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${API_KEY}`;
      const res = await fetch(url);
      const imageUrl = res.url;
      const imageRes = await fetch(imageUrl);
      const buffer = await imageRes.arrayBuffer();
      return new NextResponse(buffer, { headers: { 'Content-Type': imageRes.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' } });
    }

    return NextResponse.json({ error: 'Invalid action. Use: search, details, photo, key' }, { status: 400 });
  } catch (err: any) {
    console.error('Places API error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
