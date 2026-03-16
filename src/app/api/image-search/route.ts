import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) return NextResponse.json({ images: [] });

  // Try Pexels first
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12`, {
        headers: { Authorization: pexelsKey },
      });
      const data = await res.json();
      if (data.photos && data.photos.length > 0) {
        return NextResponse.json({ images: data.photos.map((p: any) => p.src.medium) });
      }
    } catch {}
  }

  // Try Pixabay
  try {
    const pixKey = process.env.PIXABAY_API_KEY;
    if (pixKey) {
      const res = await fetch(`https://pixabay.com/api/?key=${pixKey}&q=${encodeURIComponent(q)}&image_type=photo&per_page=12&safesearch=true`);
      const data = await res.json();
      if (data.hits && data.hits.length > 0) {
        return NextResponse.json({ images: data.hits.map((h: any) => h.webformatURL) });
      }
    }
  } catch {}

  // Fallback: Use Unsplash with direct image URLs that actually work
  // These use the documented /photos/random endpoint format
  const term = encodeURIComponent(q.trim());
  const images: string[] = [];
  for (let i = 0; i < 12; i++) {
    // Unsplash featured photos with search term - these are direct JPG URLs
    images.push(`https://loremflickr.com/400/300/${term}?lock=${i}`);
  }
  return NextResponse.json({ images });
}
