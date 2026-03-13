import { NextRequest, NextResponse } from 'next/server';

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  italy: 'Italy is a European country known for its stunning coastline, rich history, world-class art, and incredible cuisine. From the romantic canals of Venice to the ancient ruins of Rome, and the breathtaking Amalfi Coast to the rolling hills of Tuscany, Italy offers an unforgettable travel experience.',
  france: 'France captivates visitors with its iconic landmarks, world-renowned cuisine, and diverse landscapes. Paris, the City of Light, enchants with the Eiffel Tower and Louvre, while the French Riviera offers Mediterranean glamour and Provence delights with lavender fields.',
  japan: 'Japan is a fascinating blend of ancient traditions and cutting-edge modernity. From the serene temples of Kyoto to the neon-lit streets of Tokyo, visitors discover a culture of exquisite cuisine, stunning natural beauty, and warm hospitality.',
  maldives: 'The Maldives is a tropical paradise of over 1,000 coral islands in the Indian Ocean, famous for crystal-clear turquoise waters, overwater villas, and world-class diving. Each resort island offers an exclusive escape with pristine white-sand beaches.',
  kenya: 'Kenya is a country of dramatic extremes and classic beauty. Famous for its extraordinary wildlife safaris, the Masai Mara hosts the Great Migration. Nairobi is a vibrant cosmopolitan capital while the coastline offers pristine beaches.',
  tanzania: 'Tanzania is home to Mount Kilimanjaro, Africa\'s highest peak, and the Serengeti National Park. The country offers incredible wildlife viewing, the spice island of Zanzibar, and ancient rock art.',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Flight PDF parsing mode
    if (body.mode === 'flight-pdf') {
      return handleFlightPDF(body);
    }

    // Default: destination description mode
    return handleDestinationDescription(body);
  } catch (err) {
    console.error('AI route error:', err);
    return NextResponse.json({ text: 'Unable to generate description at this time.', fallback: true });
  }
}

async function handleFlightPDF(body: { fileBase64: string; mediaType: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ flights: [], error: 'No API key configured. Add ANTHROPIC_API_KEY to environment variables.' });
  }

  try {
    const isImage = body.mediaType?.startsWith('image/');
    const contentBlock = isImage
      ? { type: 'image' as const, source: { type: 'base64' as const, media_type: body.mediaType, data: body.fileBase64 } }
      : { type: 'document' as const, source: { type: 'base64' as const, media_type: body.mediaType || 'application/pdf', data: body.fileBase64 } };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: `Extract ALL flight segments from this document, including any connection/layover flights. Return a JSON ARRAY where each element is a flight segment.

For each segment return:
{"from":"airport code","fromCity":"city name","to":"airport code","toCity":"city name","airline":"airline name","flightNo":"like UA1047","departure":"YYYY-MM-DD HH:MM","arrival":"YYYY-MM-DD HH:MM","scheduledDeparture":"6:00 PM","scheduledArrival":"10:30 PM","depTerminal":"terminal number","depGate":"gate","arrTerminal":"terminal","arrGate":"gate","duration":"3h 51m","status":"Scheduled","aircraft":"aircraft type","seatClass":"Economy/Business/First","pnr":"booking reference","supplier":"airline name"}

IMPORTANT:
- If there are connecting flights (e.g. JFK->LHR->TLV), return EACH leg as a separate object.
- If only one flight, still return as array with one element.
- Use airport IATA codes (3 letters) for from/to.
- Format departure as "YYYY-MM-DD HH:MM" in 24hr.
- Format scheduledDeparture/scheduledArrival in 12hr format like "6:00 PM".
- Return ONLY valid JSON array, no markdown, no explanation.`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const flights = Array.isArray(parsed) ? parsed : [parsed];
    return NextResponse.json({ flights });
  } catch (err) {
    console.error('Flight PDF parse error:', err);
    return NextResponse.json({ flights: [], error: 'Failed to parse flight document' });
  }
}

async function handleDestinationDescription(body: { prompt?: string; destinationName?: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const destName = body.destinationName || '';

  if (!apiKey) {
    const key = destName.toLowerCase().trim();
    const fallback = FALLBACK_DESCRIPTIONS[key]
      || `${destName || 'This destination'} offers travelers a unique blend of culture, natural beauty, and memorable experiences. From local cuisine to iconic landmarks, every moment promises discovery and wonder.`;
    return NextResponse.json({ text: fallback, fallback: true });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: body.prompt || `Write a 2-3 paragraph travel description for ${destName}.` }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    return NextResponse.json({ text });
  } catch {
    const key = destName.toLowerCase().trim();
    const fallback = FALLBACK_DESCRIPTIONS[key] || `${destName} is a wonderful travel destination.`;
    return NextResponse.json({ text: fallback, fallback: true });
  }
}
