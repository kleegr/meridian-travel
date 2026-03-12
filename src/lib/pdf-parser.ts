// PDF parsing via Anthropic API — extracts ALL flight details

export interface ParsedFlightData {
  from?: string;
  fromCity?: string;
  to?: string;
  toCity?: string;
  airline?: string;
  flightNo?: string;
  departure?: string;
  arrival?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  depTerminal?: string;
  depGate?: string;
  arrTerminal?: string;
  arrGate?: string;
  duration?: string;
  status?: string;
  aircraft?: string;
  seatClass?: string;
  pnr?: string;
  supplier?: string;
  passengers?: string[];
}

export async function parseFlightPDF(file: File): Promise<ParsedFlightData> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: `Extract ALL flight booking details from this document. Return ONLY a JSON object with these fields (empty string if not found):
{"from":"airport code","fromCity":"city name","to":"airport code","toCity":"city name","airline":"airline name","flightNo":"like UA1047","departure":"YYYY-MM-DD HH:MM","arrival":"YYYY-MM-DD HH:MM","scheduledDeparture":"time like 6:00 PM","scheduledArrival":"time like 10:30 PM","depTerminal":"terminal number","depGate":"gate like C4","arrTerminal":"terminal","arrGate":"gate like B55","duration":"like 3h 51m","status":"On Time or Delayed etc","aircraft":"aircraft type","seatClass":"Economy/Business/First","pnr":"booking ref","supplier":"airline","passengers":["name1"]}
Return ONLY valid JSON.` },
          ],
        }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (err) {
    console.error('PDF parse error:', err);
    return {};
  }
}
