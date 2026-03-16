import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) return NextResponse.json({ images: [] });

  // Use Lorem Picsum with deterministic seeds based on search term
  // These are real, high-quality stock photos that load reliably
  const images: string[] = [];
  const seed = q.trim().toLowerCase().replace(/\s+/g, '-');
  for (let i = 0; i < 6; i++) {
    images.push(`https://picsum.photos/seed/${seed}${i}/400/300`);
  }

  return NextResponse.json({ images });
}
