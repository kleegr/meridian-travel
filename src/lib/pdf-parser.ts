// PDF parsing via server-side API route — extracts ALL flight details including connections

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

  const mediaType = file.type === 'application/pdf' ? 'application/pdf'
    : file.type.startsWith('image/') ? file.type
    : 'application/pdf';

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'flight-pdf',
        fileBase64: base64,
        mediaType,
      }),
    });
    const data = await response.json();
    if (data.flights && Array.isArray(data.flights)) return data.flights;
    if (data.text) {
      try {
        const parsed = JSON.parse(data.text.replace(/```json|```/g, '').trim());
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch { return []; }
    }
    return [];
  } catch (err) {
    console.error('PDF parse error:', err);
    return [];
  }
}
