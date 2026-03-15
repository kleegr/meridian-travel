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
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: `Extract ALL flight segments from this document. Return a JSON ARRAY where each element is a flight segment with: {"from":"airport code","fromCity":"city","to":"airport code","toCity":"city","airline":"name","flightNo":"like UA1047","departure":"YYYY-MM-DD HH:MM","arrival":"YYYY-MM-DD HH:MM","scheduledDeparture":"6:00 PM","scheduledArrival":"10:30 PM","depTerminal":"terminal","depGate":"gate","arrTerminal":"terminal","arrGate":"gate","duration":"3h 51m","status":"Scheduled","aircraft":"type","seatClass":"Economy/Business/First","pnr":"booking ref","supplier":"airline"}. Return ONLY valid JSON array, no markdown.` }] }],
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
