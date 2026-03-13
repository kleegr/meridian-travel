import { NextRequest, NextResponse } from 'next/server';

// Fallback descriptions when no API key is available
const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  'italy': 'Italy captivates visitors with its extraordinary blend of ancient history, breathtaking landscapes, and world-renowned cuisine. From the dramatic clifftop villages of the Amalfi Coast to the timeless grandeur of Rome\'s Colosseum and Vatican City, every corner reveals centuries of art and culture. The rolling hills of Tuscany, the romantic canals of Venice, and the crystal-clear waters of the Mediterranean coastline create an unforgettable tapestry of experiences that has enchanted travelers for generations.',
  'france': 'France is the epitome of elegance, offering an unrivaled blend of cultural sophistication, culinary mastery, and natural beauty. Paris, the City of Light, dazzles with its iconic landmarks from the Eiffel Tower to the Louvre, while the lavender fields of Provence, the glamorous French Riviera, and the châteaux of the Loire Valley provide endless enchantment beyond the capital. French cuisine, from Michelin-starred restaurants to charming bistros, is a journey unto itself.',
  'japan': 'Japan is a land where ancient tradition and cutting-edge modernity coexist in perfect harmony. Tokyo pulses with neon-lit energy and innovative cuisine, while Kyoto\'s serene temples, bamboo groves, and traditional tea houses transport visitors to another era. The country\'s natural beauty—from cherry blossom season to the snow-capped peak of Mount Fuji—creates moments of profound tranquility amid the vibrant culture.',
  'maldives': 'The Maldives is the ultimate tropical paradise, where crystal-clear turquoise waters meet pristine white-sand beaches across a chain of breathtaking coral atolls. Luxurious overwater villas offer direct access to some of the world\'s most spectacular marine life, while world-class spas and private dining experiences create an atmosphere of unparalleled indulgence. Sunset dhoni cruises and underwater dining make every moment extraordinary.',
  'kenya': 'Kenya offers one of the world\'s most extraordinary wildlife experiences, where the vast savannahs of the Masai Mara host the spectacular Great Migration. From the snow-capped peak of Mount Kenya to the flamingo-lined shores of Lake Nakuru, the landscape is as diverse as it is dramatic. Luxury safari lodges blend seamlessly into the wilderness, offering intimate encounters with the Big Five while maintaining the highest standards of comfort.',
  'tanzania': 'Tanzania is a land of superlatives—home to Africa\'s highest peak, Mount Kilimanjaro, and the endless plains of the Serengeti, where millions of wildebeest undertake their annual migration. The Ngorongoro Crater offers an unparalleled concentration of wildlife in a stunning volcanic caldera, while the spice island of Zanzibar provides the perfect coastal counterpoint with its turquoise waters and rich cultural heritage.',
  'default': 'This magnificent destination offers a unique blend of natural beauty, rich cultural heritage, and memorable experiences. From stunning landscapes to world-class hospitality, travelers will discover a place that creates lasting memories. Local cuisine, historic landmarks, and warm hospitality combine to make this an exceptional addition to any luxury itinerary.'
};

function getFallback(name: string): string {
  const key = name.toLowerCase().trim();
  for (const [k, v] of Object.entries(FALLBACK_DESCRIPTIONS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  // Generate a customized fallback
  return FALLBACK_DESCRIPTIONS['default'].replace('This magnificent destination', name);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, destinationName } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, return a nice fallback
    if (!apiKey) {
      const fallback = getFallback(destinationName || '');
      return NextResponse.json({ text: fallback, fallback: true });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      // If API fails, return fallback instead of error
      const fallback = getFallback(destinationName || '');
      return NextResponse.json({ text: fallback, fallback: true });
    }

    const data = await res.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
    return NextResponse.json({ text });
  } catch (err: any) {
    // Always return something useful
    return NextResponse.json({ text: FALLBACK_DESCRIPTIONS['default'], fallback: true });
  }
}
