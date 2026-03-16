import { NextRequest, NextResponse } from 'next/server';

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  italy: 'Italy is a European country known for its stunning coastline, rich history, world-class art, and incredible cuisine.',
  france: 'France captivates visitors with its iconic landmarks, world-renowned cuisine, and diverse landscapes.',
  japan: 'Japan is a fascinating blend of ancient traditions and cutting-edge modernity.',
  maldives: 'The Maldives is a tropical paradise of over 1,000 coral islands in the Indian Ocean.',
  kenya: 'Kenya is a country of dramatic extremes and classic beauty, famous for wildlife safaris.',
  tanzania: 'Tanzania is home to Mount Kilimanjaro and the Serengeti.',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.mode === 'flight-pdf') return handleFlightPDF(body);
    if (body.mode === 'passport') return handlePassport(body);
    if (body.mode === 'room-types') return handleRoomTypes(body);
    return handleDestinationDescription(body);
  } catch (err) {
    console.error('AI route error:', err);
    return NextResponse.json({ text: 'Unable to process at this time.', fallback: true });
  }
}

async function handleFlightPDF(body: { fileBase64: string; mediaType: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ flights: [], error: 'No API key configured.' });
  try {
    const isImage = body.mediaType?.startsWith('image/');
    const contentBlock = isImage
      ? { type: 'image' as const, source: { type: 'base64' as const, media_type: body.mediaType, data: body.fileBase64 } }
      : { type: 'document' as const, source: { type: 'base64' as const, media_type: body.mediaType || 'application/pdf', data: body.fileBase64 } };
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 4000,
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: `You are extracting flight data from a booking confirmation document.

CRITICAL: You MUST extract EVERY single flight segment. Count the total number of flights in the document first, then extract each one. Do NOT skip the first flight.

For example, if a document shows:
- Flight 1: Newark to Milan (LX 3077)
- Flight 2: Milan to Zurich (LX 1613) 
- Flight 3: Zurich to Budapest (LX 2258)
You MUST return ALL THREE flights, not just the last two.

For each flight segment, extract:
{
  "from": "IATA 3-letter airport code (EWR for Newark, MXP for Milan Malpensa, ZRH for Zurich, BUD for Budapest, JFK, LHR, CDG etc)",
  "fromCity": "city name",
  "to": "IATA 3-letter airport code",
  "toCity": "city name",
  "airline": "marketing airline name (the one shown on the ticket, NOT the operating carrier)",
  "flightNo": "marketing flight number like LX3077 (NOT the operating carrier number)",
  "departure": "YYYY-MM-DD HH:MM in 24h format",
  "arrival": "YYYY-MM-DD HH:MM in 24h format",
  "scheduledDeparture": "human readable like 5:15 PM",
  "scheduledArrival": "human readable like 7:30 AM",
  "depTerminal": "terminal number/letter",
  "arrTerminal": "terminal number/letter",
  "duration": "like 8h 15m",
  "status": "Confirmed",
  "aircraft": "equipment type like BOEING 777-200",
  "seatClass": "Economy or Business or First",
  "pnr": "the booking reference / PNR code",
  "supplier": "airline name",
  "connectionGroup": "set this to the PNR/booking reference so all segments share the same group",
  "tripType": "One Way if all segments go in one direction, Round Trip if there is a return",
  "legOrder": sequential_number_starting_at_1
}

Return a JSON array with ALL segments in chronological order. Return ONLY the JSON array, no markdown backticks, no explanation.` }] }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const flights = Array.isArray(parsed) ? parsed : [parsed];
    console.log(`Parsed ${flights.length} flight segments from PDF`);
    return NextResponse.json({ flights });
  } catch (err) {
    console.error('Flight PDF parse error:', err);
    return NextResponse.json({ flights: [], error: 'Failed to parse flight document' });
  }
}

async function handlePassport(body: { fileBase64: string; mediaType: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ passport: {}, error: 'No API key configured.' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: body.mediaType || 'image/jpeg', data: body.fileBase64 } },
          { type: 'text', text: 'Extract passport information from this image. Return ONLY a JSON object with these fields: {"name":"full name","passport":"passport number","passportExpiry":"YYYY-MM-DD","nationality":"country","dob":"YYYY-MM-DD","gender":"Male/Female"}. Return ONLY valid JSON, no markdown.' }
        ] }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json({ passport: parsed });
  } catch (err) {
    console.error('Passport parse error:', err);
    return NextResponse.json({ passport: {}, error: 'Failed to read passport' });
  }
}

async function handleRoomTypes(body: { hotelName: string; city?: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hotelName = body.hotelName || '';
  const city = body.city || '';
  if (!apiKey) {
    return NextResponse.json({ roomTypes: [
      { name: 'Standard Room', description: 'Comfortable room with essential amenities' },
      { name: 'Superior Room', description: 'Upgraded furnishings with enhanced views' },
      { name: 'Deluxe Room', description: 'Spacious room with premium amenities' },
      { name: 'Junior Suite', description: 'Open-plan suite with sitting area' },
      { name: 'Executive Suite', description: 'Large suite with separate living space' },
      { name: 'Presidential Suite', description: 'Top-tier luxury suite' },
      { name: 'Family Room', description: 'Extra space with family-friendly features' },
    ], fallback: true });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1500,
        messages: [{ role: 'user', content: `List the room types available at "${hotelName}"${city ? ` in ${city}` : ''}. Return a JSON array of 5-10 room types: [{"name":"room type","description":"brief description"}]. Return ONLY valid JSON array.` }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json({ roomTypes: Array.isArray(parsed) ? parsed : [] });
  } catch (err) {
    console.error('Room types error:', err);
    return NextResponse.json({ roomTypes: [
      { name: 'Standard Room', description: 'Comfortable room with essential amenities' },
      { name: 'Deluxe Room', description: 'Spacious room with premium amenities' },
      { name: 'Suite', description: 'Large suite with separate living area' },
    ], fallback: true });
  }
}

async function handleDestinationDescription(body: { prompt?: string; destinationName?: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const destName = body.destinationName || '';
  if (!apiKey) {
    const key = destName.toLowerCase().trim();
    const fallback = FALLBACK_DESCRIPTIONS[key] || `${destName || 'This destination'} offers travelers a unique blend of culture, natural beauty, and memorable experiences.`;
    return NextResponse.json({ text: fallback, fallback: true });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: body.prompt || `Write a 2-3 paragraph travel description for ${destName}.` }] }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    return NextResponse.json({ text });
  } catch {
    const key = destName.toLowerCase().trim();
    return NextResponse.json({ text: FALLBACK_DESCRIPTIONS[key] || `${destName} is a wonderful travel destination.`, fallback: true });
  }
}
