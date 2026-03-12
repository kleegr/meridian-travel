// Flight number auto-lookup using AviationStack-style free API
// Falls back to airline code parsing if API unavailable

const AIRLINE_CODES: Record<string, { name: string; logo?: string }> = {
  'DL': { name: 'Delta Air Lines' },
  'AA': { name: 'American Airlines' },
  'UA': { name: 'United Airlines' },
  'BA': { name: 'British Airways' },
  'LH': { name: 'Lufthansa' },
  'AF': { name: 'Air France' },
  'EK': { name: 'Emirates' },
  'QR': { name: 'Qatar Airways' },
  'SQ': { name: 'Singapore Airlines' },
  'CX': { name: 'Cathay Pacific' },
  'NH': { name: 'ANA' },
  'JL': { name: 'Japan Airlines' },
  'TK': { name: 'Turkish Airlines' },
  'KQ': { name: 'Kenya Airways' },
  'ET': { name: 'Ethiopian Airlines' },
  'QF': { name: 'Qantas' },
  'AC': { name: 'Air Canada' },
  'LX': { name: 'Swiss International' },
  'AZ': { name: 'ITA Airways' },
  'IB': { name: 'Iberia' },
  'KL': { name: 'KLM' },
  'VS': { name: 'Virgin Atlantic' },
  'EY': { name: 'Etihad Airways' },
  'WN': { name: 'Southwest Airlines' },
  'B6': { name: 'JetBlue' },
  'AS': { name: 'Alaska Airlines' },
  'F9': { name: 'Frontier Airlines' },
  'NK': { name: 'Spirit Airlines' },
  'HA': { name: 'Hawaiian Airlines' },
  'WS': { name: 'WestJet' },
  'AM': { name: 'Aeromexico' },
  'AV': { name: 'Avianca' },
  'LA': { name: 'LATAM Airlines' },
  'CM': { name: 'Copa Airlines' },
  'SU': { name: 'Aeroflot' },
  'OS': { name: 'Austrian Airlines' },
  'SK': { name: 'SAS' },
  'AY': { name: 'Finnair' },
  'TP': { name: 'TAP Portugal' },
  'RJ': { name: 'Royal Jordanian' },
  'MS': { name: 'EgyptAir' },
  'WY': { name: 'Oman Air' },
  'GF': { name: 'Gulf Air' },
  'SV': { name: 'Saudia' },
  'AI': { name: 'Air India' },
  'MH': { name: 'Malaysia Airlines' },
  'TG': { name: 'Thai Airways' },
  'GA': { name: 'Garuda Indonesia' },
  'PR': { name: 'Philippine Airlines' },
  'VN': { name: 'Vietnam Airlines' },
  'OZ': { name: 'Asiana Airlines' },
  'KE': { name: 'Korean Air' },
  'CI': { name: 'China Airlines' },
  'BR': { name: 'EVA Air' },
  'CZ': { name: 'China Southern' },
  'CA': { name: 'Air China' },
  'MU': { name: 'China Eastern' },
  'HU': { name: 'Hainan Airlines' },
  'SA': { name: 'South African Airways' },
  'NZ': { name: 'Air New Zealand' },
  'FJ': { name: 'Fiji Airways' },
  'LY': { name: 'El Al' },
  'W6': { name: 'Wizz Air' },
  'FR': { name: 'Ryanair' },
  'U2': { name: 'easyJet' },
};

export function parseFlightNumber(flightNo: string): { airlineCode: string; number: string; airlineName: string } | null {
  const clean = flightNo.trim().toUpperCase().replace(/\s+/g, '');
  // Match 2-letter code + digits
  const match = clean.match(/^([A-Z]{2})(\d{1,4})$/);
  if (!match) return null;
  const [, code, num] = match;
  const airline = AIRLINE_CODES[code];
  return {
    airlineCode: code,
    number: num,
    airlineName: airline?.name || code,
  };
}

export function getAirlineName(code: string): string {
  return AIRLINE_CODES[code.toUpperCase()]?.name || code;
}
