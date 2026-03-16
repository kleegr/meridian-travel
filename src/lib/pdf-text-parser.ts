// Deterministic text-based flight parser for Amadeus-style booking confirmations
// Handles the exact PDF structure: "Swiss International Air Lines LX 3077"
// followed by Departure/Arrival lines with city info

export interface ParsedFlight {
  from: string; fromCity: string; to: string; toCity: string;
  airline: string; flightNo: string;
  departure: string; arrival: string;
  scheduledDeparture: string; scheduledArrival: string;
  depTerminal: string; arrTerminal: string;
  duration: string; status: string; aircraft: string; seatClass: string;
  pnr: string; supplier: string; connectionGroup: string; tripType: string; legOrder: number;
}

const AIRPORT_CITIES: Record<string, string> = {
  'EWR': 'Newark', 'JFK': 'New York', 'LGA': 'New York', 'MXP': 'Milan',
  'FCO': 'Rome', 'ZRH': 'Zurich', 'BUD': 'Budapest', 'LHR': 'London',
  'CDG': 'Paris', 'FRA': 'Frankfurt', 'MUC': 'Munich', 'VIE': 'Vienna',
  'AMS': 'Amsterdam', 'BCN': 'Barcelona', 'MAD': 'Madrid', 'IST': 'Istanbul',
  'DXB': 'Dubai', 'DOH': 'Doha', 'NRT': 'Tokyo', 'HND': 'Tokyo',
  'SIN': 'Singapore', 'HKG': 'Hong Kong', 'BKK': 'Bangkok', 'SYD': 'Sydney',
  'LAX': 'Los Angeles', 'SFO': 'San Francisco', 'ORD': 'Chicago',
  'ATL': 'Atlanta', 'MIA': 'Miami', 'BOS': 'Boston', 'TLV': 'Tel Aviv',
  'NBO': 'Nairobi', 'MLE': 'Male', 'DEL': 'Delhi', 'BOM': 'Mumbai',
};

// Map airport/city names to IATA codes
function cityToIata(text: string): string {
  const t = text.toLowerCase().trim();
  const map: Record<string, string> = {
    'newark': 'EWR', 'newark liberty': 'EWR', 'newark liberty intl': 'EWR',
    'malpensa': 'MXP', 'milan': 'MXP',
    'zurich': 'ZRH', 'zurich airport': 'ZRH',
    'budapest': 'BUD', 'liszt ferenc': 'BUD', 'liszt ferenc intl': 'BUD',
    'heathrow': 'LHR', 'london': 'LHR',
    'charles de gaulle': 'CDG', 'paris': 'CDG',
    'fiumicino': 'FCO', 'rome': 'FCO',
    'frankfurt': 'FRA', 'munich': 'MUC', 'vienna': 'VIE',
    'amsterdam': 'AMS', 'barcelona': 'BCN', 'madrid': 'MAD',
    'istanbul': 'IST', 'dubai': 'DXB', 'doha': 'DOH',
    'narita': 'NRT', 'tokyo': 'NRT', 'haneda': 'HND',
    'singapore': 'SIN', 'hong kong': 'HKG', 'bangkok': 'BKK',
    'sydney': 'SYD', 'los angeles': 'LAX', 'san francisco': 'SFO',
    'chicago': 'ORD', "o'hare": 'ORD', 'atlanta': 'ATL', 'miami': 'MIA',
    'boston': 'BOS', 'tel aviv': 'TLV', 'ben gurion': 'TLV',
    'nairobi': 'NBO', 'male': 'MLE', 'delhi': 'DEL', 'mumbai': 'BOM',
    'jfk': 'JFK', 'john f. kennedy': 'JFK', 'john f kennedy': 'JFK',
    'laguardia': 'LGA',
  };
  for (const [name, code] of Object.entries(map)) {
    if (t.includes(name)) return code;
  }
  // Try 3-letter code in the text
  const m = text.match(/\b([A-Z]{3})\b/);
  if (m && AIRPORT_CITIES[m[1]]) return m[1];
  return '';
}

function extractCityFromLine(line: string): { city: string; code: string; terminal: string } {
  // Pattern: "Newark, (Newark Liberty Intl) Terminal: C"
  // or: "Milan, (Malpensa) Terminal: 1"
  // or: "Zurich, (Zurich Airport)"
  // or: "Budapest, (Liszt Ferenc Intl) Terminal: 2B"
  let city = '', code = '', terminal = '';
  
  // Extract terminal
  const termMatch = line.match(/Terminal[:\s]+([A-Z0-9]+)/i);
  if (termMatch) terminal = termMatch[1];
  
  // Extract city name (before the comma or parenthetical)
  const cityMatch = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,/);
  if (cityMatch) city = cityMatch[1];
  
  // Extract airport name from parenthetical
  const parenMatch = line.match(/\(([^)]+)\)/);
  if (parenMatch) {
    code = cityToIata(parenMatch[1]);
    if (!code && city) code = cityToIata(city);
  } else if (city) {
    code = cityToIata(city);
  }
  
  // Also try the whole line
  if (!code) code = cityToIata(line);
  
  return { city: city || AIRPORT_CITIES[code] || '', code, terminal };
}

function parseTimeStr(timeStr: string): string {
  // "05:15 PM" or "10:40 AM" or "07:30 AM"
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return timeStr.trim();
  let h = parseInt(m[1]);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

export function parseFlightText(text: string): ParsedFlight[] {
  const flights: ParsedFlight[] = [];
  const seen = new Set<string>(); // Deduplicate
  
  // Extract PNR
  let pnr = '';
  const pnrMatch = text.match(/Booking\s*ref[:\s]+([A-Z0-9]{5,8})/i);
  if (pnrMatch) pnr = pnrMatch[1];
  if (!pnr) {
    const pnr2 = text.match(/Airline\s*Booking\s*Reference\s+([A-Z0-9]{5,8})/i);
    if (pnr2) pnr = pnr2[1];
  }
  
  // Split text into lines and find flight sections
  // Each flight starts with "Swiss International Air Lines LX XXXX" (or similar airline pattern)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Find indices of flight header lines
  const flightStarts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    // Match: "Swiss International Air Lines LX 3077" or similar
    if (lines[i].match(/(?:Air\s*Lines?|Airways?)\s+[A-Z]{2}\s*\d{1,5}/i)) {
      flightStarts.push(i);
    }
  }
  
  // Process each flight section
  for (let idx = 0; idx < flightStarts.length; idx++) {
    const startLine = flightStarts[idx];
    const endLine = idx + 1 < flightStarts.length ? flightStarts[idx + 1] : Math.min(startLine + 25, lines.length);
    const section = lines.slice(startLine, endLine);
    const sectionText = section.join('\n');
    
    // Extract airline + flight number
    const fnMatch = section[0].match(/(.+?(?:Air\s*Lines?|Airways?))\s+([A-Z]{2})\s*(\d{1,5})/i);
    if (!fnMatch) continue;
    
    const airline = fnMatch[1].trim();
    const flightNo = fnMatch[2].toUpperCase() + fnMatch[3];
    
    // Find Departure and Arrival lines
    let depLine = '', arrLine = '', depTime = '', arrTime = '', depDateStr = '', arrDateStr = '';
    
    for (const line of section) {
      // Match: "Departure 30 March 05:15 PM Newark, (Newark Liberty Intl) Terminal: C"
      const depMatch = line.match(/^Departure\s+(\d{1,2}\s+\w+)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s+(.*)/i);
      if (depMatch) {
        depDateStr = depMatch[1];
        depTime = depMatch[2];
        depLine = depMatch[3];
      }
      
      const arrMatch = line.match(/^Arrival\s+(\d{1,2}\s+\w+)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s+(.*)/i);
      if (arrMatch) {
        arrDateStr = arrMatch[1];
        arrTime = arrMatch[2];
        arrLine = arrMatch[3];
      }
    }
    
    // Extract from/to info
    const dep = extractCityFromLine(depLine);
    const arr = extractCityFromLine(arrLine);
    
    // Extract duration
    let duration = '';
    const durMatch = sectionText.match(/Duration\s+(\d{2}:\d{2})/i);
    if (durMatch) {
      const [h, m] = durMatch[1].split(':');
      duration = `${parseInt(h)}h ${m}m`;
    }
    
    // Extract class
    let seatClass = 'Economy';
    const classMatch = sectionText.match(/Class\s+Economy/i);
    if (classMatch) seatClass = 'Economy';
    else if (sectionText.match(/Class\s+Business/i)) seatClass = 'Business';
    else if (sectionText.match(/Class\s+First/i)) seatClass = 'First';
    
    // Extract aircraft
    let aircraft = '';
    const eqMatch = sectionText.match(/Equipment\s+(.+?)(?:\n|$)/i);
    if (eqMatch) aircraft = eqMatch[1].trim();
    
    // Build ISO datetime
    const months: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    };
    
    function toIso(dateStr: string, timeStr: string): string {
      if (!dateStr || !timeStr) return '';
      let month = '', day = '';
      for (const [name, num] of Object.entries(months)) {
        if (dateStr.toLowerCase().includes(name)) { month = num; break; }
      }
      const dayMatch = dateStr.match(/(\d{1,2})/);
      if (dayMatch) day = dayMatch[1].padStart(2, '0');
      if (!month || !day) return '';
      return `2026-${month}-${day}T${parseTimeStr(timeStr)}`;
    }
    
    // Deduplicate: skip if we already have this exact flight
    const key = `${flightNo}-${dep.code}-${arr.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    flights.push({
      from: dep.code,
      fromCity: dep.city || AIRPORT_CITIES[dep.code] || '',
      to: arr.code,
      toCity: arr.city || AIRPORT_CITIES[arr.code] || '',
      airline,
      flightNo,
      departure: toIso(depDateStr, depTime),
      arrival: toIso(arrDateStr, arrTime),
      scheduledDeparture: depTime.trim(),
      scheduledArrival: arrTime.trim(),
      depTerminal: dep.terminal,
      arrTerminal: arr.terminal,
      duration,
      status: 'Confirmed',
      aircraft,
      seatClass,
      pnr,
      supplier: airline,
      connectionGroup: pnr,
      tripType: 'One Way',
      legOrder: flights.length + 1,
    });
  }
  
  return flights;
}
