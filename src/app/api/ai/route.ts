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
    
    // Use Opus for better extraction accuracy on complex documents
    const model = process.env.FLIGHT_PDF_MODEL || 'claude-sonnet-4-20250514';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model, max_tokens: 6000,
        system: 'You are an expert at extracting flight information from booking confirmation documents. You MUST extract EVERY flight segment. You are very careful and methodical. Before outputting JSON, you mentally list every flight you see in the document.',
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: `Look at this booking confirmation and extract EVERY flight segment.

Before extracting, please count how many separate flight segments exist in this document. Look for:
- Each "Swiss International Air Lines LX XXXX" or similar airline+flight header
- Each Departure/Arrival pair
- "Connection time" mentions which indicate there are MORE segments

There should be at least as many segments as there are "Departure" lines in the document.

For EACH segment, return a JSON object with these fields:
{"from":"3-letter IATA code","fromCity":"city","to":"3-letter IATA code","toCity":"city","airline":"marketing airline","flightNo":"like LX3077 (use the first airline code shown, NOT the 'operated by' code)","departure":"YYYY-MM-DD HH:MM","arrival":"YYYY-MM-DD HH:MM","scheduledDeparture":"5:15 PM","scheduledArrival":"7:30 AM","depTerminal":"C","arrTerminal":"1","duration":"8h 15m","status":"Confirmed","aircraft":"BOEING 777-200","seatClass":"Economy","pnr":"BQEOHZ","supplier":"Swiss International Air Lines","connectionGroup":"BQEOHZ","tripType":"One Way","legOrder":1}

Airport codes: Newark Liberty=EWR, Milan Malpensa=MXP, Zurich=ZRH, Budapest=BUD

Return ONLY a JSON array. No other text.` }] }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    let cleaned = text.replace(/```json|```/g, '').trim();
    const arrStart = cleaned.indexOf('[');
    const arrEnd = cleaned.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1) cleaned = cleaned.substring(arrStart, arrEnd + 1);
    const parsed = JSON.parse(cleaned);
    const flights = Array.isArray(parsed) ? parsed : [parsed];
    console.log(`PDF parse: ${flights.length} segments - ${flights.map((f: any) => `${f.flightNo}(${f.from}>${f.to})`).join(', ')}`);
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
    return NextResponse.json({ roomTypes: [{ name: 'Standard Room', description: 'Essential amenities' }, { name: 'Deluxe Room', description: 'Premium amenities' }, { name: 'Suite', description: 'Separate living area' }], fallback: true });
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
