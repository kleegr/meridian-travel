import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) return NextResponse.json({ images: [] });

  // Try Pexels first (best quality, relevant results)
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12&orientation=landscape`, {
        headers: { Authorization: pexelsKey },
      });
      const data = await res.json();
      if (data.photos && data.photos.length > 0) {
        return NextResponse.json({ images: data.photos.map((p: any) => p.src.medium) });
      }
    } catch (err) {
      console.error('Pexels error:', err);
    }
  }

  // Fallback: Use Pixabay (free, no key needed for limited use)
  try {
    const pixabayKey = process.env.PIXABAY_API_KEY || '47498122-0f89e37ff6250f57ee131ac47';
    const res = await fetch(`https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(q)}&image_type=photo&per_page=12&safesearch=true`);
    const data = await res.json();
    if (data.hits && data.hits.length > 0) {
      return NextResponse.json({ images: data.hits.map((h: any) => h.webformatURL) });
    }
  } catch (err) {
    console.error('Pixabay error:', err);
  }

  // Last fallback: Lorem Picsum with specific IDs for consistency
  const images: string[] = [];
  for (let i = 0; i < 12; i++) {
    images.push(`https://picsum.photos/id/${100 + i * 10}/400/300`);
  }
  return NextResponse.json({ images });
}
