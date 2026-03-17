// Client-side function to lookup flights via our server API (which proxies to FlightAware)

export interface LiveFlightData {
  flightNo: string;
  airline: string;
  airlineIata: string;
  from: string;
  fromCity: string;
  fromName: string;
  to: string;
  toCity: string;
  toName: string;
  scheduledOut: string;
  estimatedOut: string;
  actualOut: string;
  scheduledIn: string;
  estimatedIn: string;
  actualIn: string;
  status: string;
  aircraft: string;
  registration: string;
  departureDelay: number;
  arrivalDelay: number;
  gateOrigin: string;
  gateDestination: string;
  terminalOrigin: string;
  terminalDestination: string;
  cancelled: boolean;
  diverted: boolean;
  filedEte: number;
}

export async function lookupFlight(ident: string, date?: string): Promise<LiveFlightData[]> {
  try {
    const params = new URLSearchParams({ ident });
    if (date) params.set('date', date);
    const res = await fetch(`/api/flight?${params.toString()}`);
    const data = await res.json();
    return data.flights || [];
  } catch {
    return [];
  }
}

// Format seconds to "Xh Ym"
export function formatEte(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// Format ISO datetime to readable LOCAL time at the airport
// FlightAware returns ISO times like "2026-03-19T05:49:00-05:00" with timezone offset
// We need to display the LOCAL time at the airport, not convert to browser timezone
export function fmtIsoTime(iso: string): string {
  if (!iso) return '';
  try {
    // If the ISO string has a timezone offset (e.g. -05:00, +02:00), extract the local time directly
    // FlightAware format: "2026-03-19T05:49:00-05:00" means 5:49 AM local at the airport
    const match = iso.match(/T(\d{2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1]);
      const m = match[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      return `${h}:${m} ${ampm}`;
    }
    // Fallback
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

// Format ISO datetime to date string
export function fmtIsoDate(iso: string): string {
  if (!iso) return '';
  try {
    // Extract date from ISO string directly to avoid timezone conversion
    const match = iso.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return new Date(iso).toISOString().split('T')[0];
  } catch { return ''; }
}

// Determine delay status text
export function getDelayText(delay: number): string {
  if (!delay || delay <= 0) return '';
  const min = Math.round(delay / 60);
  if (min < 1) return '';
  return `Delayed ${min} min`;
}
