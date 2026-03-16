import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) return NextResponse.json({ images: [] });

  // Use Pexels API for relevant, high-quality stock photos
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=9&orientation=landscape`, {
        headers: { Authorization: pexelsKey },
      });
      const data = await res.json();
      if (data.photos && data.photos.length > 0) {
        return NextResponse.json({ images: data.photos.map((p: any) => p.src.medium) });
      }
    } catch (err) {
      console.error('Pexels search error:', err);
    }
  }

  // Fallback: Use Unsplash source with proper search URLs
  // These redirect to actual search-relevant photos
  const images: string[] = [];
  const term = encodeURIComponent(q.trim());
  for (let i = 0; i < 9; i++) {
    // Unsplash source URLs with search term - returns relevant photos
    images.push(`https://source.unsplash.com/featured/400x300/?${term}&t=${Date.now() + i}`);
  }

  return NextResponse.json({ images });
}
