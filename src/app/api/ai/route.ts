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

// Robust JSON extraction - handles markdown fences, preamble text, etc.
function extractJSON(text: string): any {
  // Remove markdown code fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  
  // Try direct parse first
  try { return JSON.parse(cleaned); } catch {}
  
  // Try to find JSON object in the text
  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    try { return JSON.parse(cleaned.substring(objStart, objEnd + 1)); } catch {}
  }
  
  // Try to find JSON array in the text
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(cleaned.substring(arrStart, arrEnd + 1)); } catch {}
  }
  
  return null;
}

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
    
    const textParsed = parseFlightText(rawText);
    console.log(`Text parser found ${textParsed.length} flights`);
    
    if (textParsed.length >= 1) {
      return NextResponse.json({ flights: textParsed });
    }
    
    const jsonResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 6000,
        system: 'Extract ALL flight segments. Return ONLY a JSON array, no other text.',
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: `Here is the document text I extracted:\n\n${rawText}\n\nNow extract EVERY flight into a JSON array. Each flight: {"from":"IATA","fromCity":"city","to":"IATA","toCity":"city","airline":"name","flightNo":"LX3077","departure":"YYYY-MM-DD","scheduledDeparture":"5:15 PM","scheduledArrival":"7:30 AM","depTerminal":"C","arrTerminal":"1","duration":"8h 15m","status":"Confirmed","seatClass":"Economy","pnr":"ref","tripType":"One Way","legOrder":1}\nReturn ONLY JSON array.` }] }],
      }),
    });
    const jsonData = await jsonResponse.json();
    const jsonText = jsonData.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const flights = extractJSON(jsonText);
    if (flights) {
      const arr = Array.isArray(flights) ? flights : [flights];
      console.log(`AI fallback: ${arr.length} segments`);
      return NextResponse.json({ flights: arr });
    }
    return NextResponse.json({ flights: [], error: 'Could not parse flight data' });
  } catch (err) {
    console.error('Flight PDF parse error:', err);
    return NextResponse.json({ flights: [], error: 'Failed to parse flight document' });
  }
}

async function handlePassport(body: { fileBase64: string; mediaType: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ passport: {}, error: 'No API key configured. Add ANTHROPIC_API_KEY to Vercel env vars.' });
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: body.mediaType || 'image/jpeg', data: body.fileBase64 } },
          { type: 'text', text: `Look at this passport photo and extract the following information. Return ONLY a JSON object with no other text, no explanation, no markdown fences:
{"name":"FULL NAME as shown on passport","passport":"passport number","passportExpiry":"YYYY-MM-DD","nationality":"country name","dob":"YYYY-MM-DD","gender":"Male or Female"}
If you cannot read a field, use an empty string for that field. Return ONLY the JSON object.` }
        ] }],
      }),
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('Passport API response error:', response.status, errText);
      return NextResponse.json({ passport: {}, error: `API error: ${response.status}` });
    }
    
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    
    console.log('Passport raw response:', text.substring(0, 300));
    
    const parsed = extractJSON(text);
    if (parsed) {
      console.log('Passport parsed successfully:', JSON.stringify(parsed));
      return NextResponse.json({ passport: parsed });
    }
    
    console.error('Passport JSON extraction failed from text:', text.substring(0, 200));
    return NextResponse.json({ passport: {}, error: 'Could not parse passport data' });
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
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: `Room types for "${body.hotelName}"${body.city ? ` in ${body.city}` : ''}. Return ONLY a JSON array, no other text: [{"name":"type","description":"desc"}]` }] }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const parsed = extractJSON(text);
    if (parsed) return NextResponse.json({ roomTypes: Array.isArray(parsed) ? parsed : [parsed] });
    return NextResponse.json({ roomTypes: [{ name: 'Standard', description: 'Essential' }, { name: 'Deluxe', description: 'Premium' }], fallback: true });
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
