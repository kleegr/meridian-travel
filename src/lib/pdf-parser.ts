// PDF text extraction for flight booking documents
// Uses Anthropic API to intelligently parse booking PDFs

export interface ParsedFlightData {
  from?: string;
  to?: string;
  airline?: string;
  flightNo?: string;
  departure?: string;
  arrival?: string;
  pnr?: string;
  supplier?: string;
  passengers?: string[];
}

export async function parseFlightPDF(file: File): Promise<ParsedFlightData> {
  // Convert PDF to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
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
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            {
              type: 'text',
              text: `Extract flight booking details from this document. Return ONLY a JSON object with these fields (leave empty string if not found):
{"from": "departure airport code", "to": "arrival airport code", "airline": "airline name", "flightNo": "flight number like DL401", "departure": "YYYY-MM-DD HH:MM", "arrival": "YYYY-MM-DD HH:MM", "pnr": "booking reference/PNR", "supplier": "airline or booking source", "passengers": ["name1", "name2"]}
Return ONLY valid JSON, no markdown, no explanation.`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('PDF parse error:', err);
    return {};
  }
}
