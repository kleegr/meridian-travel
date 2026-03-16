import { NextRequest, NextResponse } from 'next/server';
import { parseFlightText } from '@/lib/pdf-text-parser';

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

    // STEP 1: Extract raw text from the document
    const textResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 4000,
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: 'Copy ALL the text from this document exactly as written. Include every line, every flight detail, every date, every time. Do not summarize or skip anything. Just output the raw text content.' }] }],
      }),
    });
    const textData = await textResponse.json();
    const rawText = textData.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    
    console.log('PDF raw text length:', rawText.length);
    console.log('PDF text preview:', rawText.substring(0, 500));
    
    // STEP 2: Parse the text deterministically using our regex parser
    const textParsed = parseFlightText(rawText);
    console.log(`Text parser found ${textParsed.length} flights: ${textParsed.map(f => `${f.flightNo}(${f.from}>${f.to})`).join(', ')}`);
    
    if (textParsed.length >= 1) {
      // Text parser worked - return its results
      return NextResponse.json({ flights: textParsed });
    }
    
    // STEP 3: Fallback to AI JSON extraction if text parser fails
    const jsonResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 6000,
        system: 'Extract ALL flight segments. Count them first. Never skip the first flight.',
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: `Here is the document text I extracted:\n\n${rawText}\n\nNow extract EVERY flight into a JSON array. Each flight: {"from":"IATA","fromCity":"city","to":"IATA","toCity":"city","airline":"name","flightNo":"LX3077","departure":"YYYY-MM-DD HH:MM","arrival":"YYYY-MM-DD HH:MM","scheduledDeparture":"5:15 PM","scheduledArrival":"7:30 AM","depTerminal":"C","arrTerminal":"1","duration":"8h 15m","status":"Confirmed","aircraft":"type","seatClass":"Economy","pnr":"ref","supplier":"airline","connectionGroup":"PNR","tripType":"One Way","legOrder":1}\nReturn ONLY JSON array.` }] }],
      }),
    });
    const jsonData = await jsonResponse.json();
    const jsonText = jsonData.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    let cleaned = jsonText.replace(/```json|```/g, '').trim();
    const arrStart = cleaned.indexOf('[');
    const arrEnd = cleaned.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1) cleaned = cleaned.substring(arrStart, arrEnd + 1);
    const parsed = JSON.parse(cleaned);
    const flights = Array.isArray(parsed) ? parsed : [parsed];
    console.log(`AI fallback: ${flights.length} segments`);
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
          { type: 'text', text: 'Extract passport information. Return ONLY JSON: {"name":"full name","passport":"number","passportExpiry":"YYYY-MM-DD","nationality":"country","dob":"YYYY-MM-DD","gender":"Male/Female"}' }
        ] }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    return NextResponse.json({ passport: JSON.parse(text.replace(/```json|```/g, '').trim()) });
  } catch (err) {
    console.error('Passport parse error:', err);
    return NextResponse.json({ passport: {}, error: 'Failed to read passport' });
  }
}

async function handleRoomTypes(body: { hotelName: string; city?: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ roomTypes: [{ name: 'Standard', description: 'Essential amenities' }, { name: 'Deluxe', description: 'Premium amenities' }, { name: 'Suite', description: 'Separate living area' }], fallback: true });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: `Room types for "${body.hotelName}"${body.city ? ` in ${body.city}` : ''}. Return JSON array: [{"name":"type","description":"desc"}]. ONLY JSON.` }] }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    return NextResponse.json({ roomTypes: JSON.parse(text.replace(/```json|```/g, '').trim()) });
  } catch { return NextResponse.json({ roomTypes: [{ name: 'Standard', description: 'Essential' }, { name: 'Deluxe', description: 'Premium' }], fallback: true }); }
}

async function handleDestinationDescription(body: { prompt?: string; destinationName?: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const destName = body.destinationName || '';
  if (!apiKey) return NextResponse.json({ text: FALLBACK_DESCRIPTIONS[destName.toLowerCase().trim()] || `${destName} is a wonderful destination.`, fallback: true });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: body.prompt || `Write a 2-3 paragraph travel description for ${destName}.` }] }),
    });
    const data = await response.json();
    return NextResponse.json({ text: data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '' });
  } catch { return NextResponse.json({ text: FALLBACK_DESCRIPTIONS[destName.toLowerCase().trim()] || `${destName} is a wonderful destination.`, fallback: true }); }
}
