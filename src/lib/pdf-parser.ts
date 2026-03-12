// PDF parsing via Anthropic API — extracts ALL flight details including connections

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

export async function parseFlightPDF(file: File): Promise<ParsedFlightData[]> {
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
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: `Extract ALL flight segments from this document, including any connection/layover flights. Return a JSON ARRAY where each element is a flight segment.

For each segment return:
{"from":"airport code","fromCity":"city","to":"airport code","toCity":"city","airline":"name","flightNo":"like UA1047","departure":"YYYY-MM-DD HH:MM","arrival":"YYYY-MM-DD HH:MM","scheduledDeparture":"6:00 PM","scheduledArrival":"10:30 PM","depTerminal":"terminal","depGate":"gate","arrTerminal":"terminal","arrGate":"gate","duration":"3h 51m","status":"On Time","aircraft":"type","seatClass":"Economy/Business/First","pnr":"booking ref","supplier":"airline"}

IMPORTANT: If there are connecting flights (e.g. JFK->LHR->TLV), return EACH leg as a separate object in the array.
If there is only one flight, still return it as an array with one element.
Return ONLY valid JSON array, no markdown.` },
          ],
        }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    // Ensure it's always an array
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error('PDF parse error:', err);
    return [];
  }
}
