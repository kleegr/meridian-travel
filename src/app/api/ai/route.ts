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
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: `Extract ALL flight segments from this document. This is critical: extract EVERY flight segment including the FIRST one. Many booking confirmations have 2-3+ connecting flights - get them ALL in order.

Return a JSON ARRAY where each element is a flight segment with:
{"from":"IATA airport code (3 letters like EWR, MXP, ZUR)","fromCity":"city name","to":"IATA airport code","toCity":"city name","airline":"full airline name","flightNo":"like LX3077","departure":"YYYY-MM-DD HH:MM (24h format)","arrival":"YYYY-MM-DD HH:MM (24h format)","scheduledDeparture":"5:15 PM","scheduledArrival":"7:30 AM","depTerminal":"terminal","depGate":"gate","arrTerminal":"terminal","arrGate":"gate","duration":"8h 15m","status":"Confirmed","aircraft":"equipment type","seatClass":"Economy/Business/First","pnr":"booking reference","supplier":"airline name","connectionGroup":"use the PNR/booking ref as connection group ID","tripType":"One Way","legOrder":leg_number_starting_from_1}

IMPORTANT RULES:
- Extract EVERY segment in chronological order
- For airport codes: use standard IATA codes (Newark=EWR, Milan Malpensa=MXP, Zurich=ZRH, Budapest=BUD)
- If a flight says "Operated by X" still use the marketing airline and flight number shown
- Set legOrder to 1, 2, 3 etc for each segment in order
- Set connectionGroup to the PNR/booking reference so all segments are grouped
- Set tripType to "One Way" for one-direction journeys, "Round Trip" if there's a return
- Convert all times to YYYY-MM-DD HH:MM format (24 hour)

Return ONLY valid JSON array, no markdown, no explanation.` }] }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json({ flights: Array.isArray(parsed) ? parsed : [parsed] });
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
          { type: 'text', text: `Extract passport information from this image. Return ONLY a JSON object with these fields:\n{"name":"full name as on passport","passport":"passport number","passportExpiry":"YYYY-MM-DD","nationality":"country","dob":"YYYY-MM-DD","gender":"Male/Female"}\nReturn ONLY valid JSON, no markdown, no explanation. If a field is not visible, omit it.` }
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
        messages: [{ role: 'user', content: `List the room types available at "${hotelName}"${city ? ` in ${city}` : ''}. Based on your knowledge of this specific hotel (or similar hotels of this class), return a JSON array of room types. Each item should have: {"name":"room type name","description":"brief description with size, view, key features"}. Include 5-10 room types ordered from most basic to most premium. Return ONLY valid JSON array, no markdown, no explanation.` }],
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
