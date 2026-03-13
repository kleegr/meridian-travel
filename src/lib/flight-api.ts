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

// Format ISO datetime to readable time
export function fmtIsoTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

// Format ISO datetime to date string
export function fmtIsoDate(iso: string): string {
  if (!iso) return '';
  try {
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
