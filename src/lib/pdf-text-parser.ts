// Deterministic text-based flight parser - no AI needed
// Parses structured booking confirmation text to extract ALL flight segments

export interface ParsedFlight {
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  airline: string;
  flightNo: string;
  departure: string;
  arrival: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  depTerminal: string;
  arrTerminal: string;
  duration: string;
  status: string;
  aircraft: string;
  seatClass: string;
  pnr: string;
  supplier: string;
  connectionGroup: string;
  tripType: string;
  legOrder: number;
}

// Airport code to city mapping
const AIRPORT_CITIES: Record<string, string> = {
  'EWR': 'Newark', 'JFK': 'New York', 'LGA': 'New York', 'MXP': 'Milan', 'FCO': 'Rome',
  'ZRH': 'Zurich', 'BUD': 'Budapest', 'LHR': 'London', 'CDG': 'Paris', 'FRA': 'Frankfurt',
  'MUC': 'Munich', 'VIE': 'Vienna', 'AMS': 'Amsterdam', 'BCN': 'Barcelona', 'MAD': 'Madrid',
  'IST': 'Istanbul', 'DXB': 'Dubai', 'DOH': 'Doha', 'NRT': 'Tokyo', 'HND': 'Tokyo',
  'SIN': 'Singapore', 'HKG': 'Hong Kong', 'BKK': 'Bangkok', 'SYD': 'Sydney',
  'LAX': 'Los Angeles', 'SFO': 'San Francisco', 'ORD': 'Chicago', 'ATL': 'Atlanta',
  'MIA': 'Miami', 'BOS': 'Boston', 'DCA': 'Washington', 'IAD': 'Washington',
  'TLV': 'Tel Aviv', 'CAI': 'Cairo', 'NBO': 'Nairobi', 'CPT': 'Cape Town',
  'MLE': 'Male', 'CMB': 'Colombo', 'DEL': 'Delhi', 'BOM': 'Mumbai',
};

// Known city name to IATA code
const CITY_TO_IATA: Record<string, string> = {
  'newark': 'EWR', 'newark liberty': 'EWR', 'malpensa': 'MXP', 'milan': 'MXP',
  'zurich': 'ZRH', 'budapest': 'BUD', 'liszt ferenc': 'BUD',
  'london': 'LHR', 'heathrow': 'LHR', 'paris': 'CDG', 'charles de gaulle': 'CDG',
  'rome': 'FCO', 'fiumicino': 'FCO', 'frankfurt': 'FRA', 'munich': 'MUC',
  'vienna': 'VIE', 'amsterdam': 'AMS', 'barcelona': 'BCN', 'madrid': 'MAD',
  'istanbul': 'IST', 'dubai': 'DXB', 'doha': 'DOH', 'tokyo': 'NRT', 'narita': 'NRT',
  'singapore': 'SIN', 'hong kong': 'HKG', 'bangkok': 'BKK', 'sydney': 'SYD',
  'los angeles': 'LAX', 'san francisco': 'SFO', 'chicago': 'ORD', 'atlanta': 'ATL',
  'miami': 'MIA', 'boston': 'BOS', 'tel aviv': 'TLV', 'ben gurion': 'TLV',
  'jfk': 'JFK', 'john f kennedy': 'JFK', 'laguardia': 'LGA',
};

function findIataCode(text: string): string {
  // Try direct 3-letter code match
  const direct = text.match(/\b([A-Z]{3})\b/);
  if (direct && AIRPORT_CITIES[direct[1]]) return direct[1];
  
  // Try city name lookup
  const lower = text.toLowerCase().replace(/[()]/g, '').trim();
  for (const [city, code] of Object.entries(CITY_TO_IATA)) {
    if (lower.includes(city)) return code;
  }
  
  // Try extracting 3-letter code from parenthetical
  const paren = text.match(/\(([^)]+)\)/);
  if (paren) {
    const inner = paren[1].trim();
    const code3 = inner.match(/\b([A-Z]{3})\b/);
    if (code3) return code3[1];
    // Try city name in parenthetical
    const lowerInner = inner.toLowerCase();
    for (const [city, code] of Object.entries(CITY_TO_IATA)) {
      if (lowerInner.includes(city)) return code;
    }
  }
  
  return '';
}

function parseDateTime(dateStr: string, timeStr: string): { iso: string; readable: string } {
  // Parse date like "30 March" or "31 March 2026" or "March 30, 2026"
  const months: Record<string, string> = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
  
  let year = '2026', month = '', day = '';
  
  // Extract year if present
  const yearMatch = dateStr.match(/(20\d{2})/);
  if (yearMatch) year = yearMatch[1];
  
  // Extract month
  for (const [name, num] of Object.entries(months)) {
    if (dateStr.toLowerCase().includes(name)) { month = num; break; }
  }
  
  // Extract day
  const dayMatch = dateStr.match(/(\d{1,2})/);
  if (dayMatch) day = dayMatch[1].padStart(2, '0');
  
  if (!month || !day) return { iso: '', readable: timeStr };
  
  // Parse time like "05:15 PM" or "10:40 AM" 
  let hours = 0, minutes = 0;
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    minutes = parseInt(timeMatch[2]);
    if (timeMatch[3]) {
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }
  
  const iso = `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return { iso, readable: timeStr.trim() };
}

export function parseFlightText(text: string): ParsedFlight[] {
  const flights: ParsedFlight[] = [];
  
  // Extract PNR/Booking reference
  let pnr = '';
  const pnrMatch = text.match(/(?:Booking\s*ref|Airline\s*Booking\s*Reference|PNR|Confirmation)[:\s]+([A-Z0-9]{5,8})/i);
  if (pnrMatch) pnr = pnrMatch[1];
  
  // Split into sections by flight headers
  // Look for patterns like "Swiss International Air Lines LX 3077" or "LX3077"
  const flightPattern = /([A-Za-z\s]+(?:Air\s*Lines?|Airways?|Airlines?)?)\s+([A-Z]{2})\s*(\d{1,5})/g;
  const dateHeaderPattern = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2}\s+\w+\s*\d{0,4})/gi;
  
  // Alternative: split by "Departure" occurrences which mark each flight
  const depSections: { depLine: number; text: string }[] = [];
  const lines = text.split('\n');
  let currentDate = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track current date from day headers
    const dateMatch = line.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2}\s+\w+\s*\d{0,4})/i);
    if (dateMatch) currentDate = dateMatch[1];
    
    // Find airline + flight number lines
    const flightMatch = line.match(/([A-Za-z\s]+(?:Air\s*Lines?|Airways?|Airlines?))\s+([A-Z]{2})\s*(\d{1,5})/i);
    if (flightMatch) {
      // Gather the section of text from this flight header to the next flight header or end
      let section = currentDate + '\n';
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        section += lines[j] + '\n';
        // Stop if we hit "Connection time" or another flight header
        if (j > i && (lines[j].match(/Connection\s*time/i) || (j > i + 2 && lines[j].match(/([A-Za-z]+\s+(?:Air\s*Lines?|Airways?))\s+[A-Z]{2}\s*\d{1,5}/i)))) {
          break;
        }
      }
      depSections.push({ depLine: i, text: section });
    }
  }
  
  // Parse each section
  for (let idx = 0; idx < depSections.length; idx++) {
    const section = depSections[idx].text;
    
    // Extract flight number
    const fnMatch = section.match(/([A-Za-z\s]+(?:Air\s*Lines?|Airways?|Airlines?))\s+([A-Z]{2})\s*(\d{1,5})/i);
    if (!fnMatch) continue;
    
    const airline = fnMatch[1].trim();
    const flightNo = fnMatch[2].toUpperCase() + fnMatch[3];
    
    // Extract departure info
    const depMatch = section.match(/Departure\s+(?:(\d{1,2}\s+\w+)\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    const arrMatch = section.match(/Arrival\s+(?:(\d{1,2}\s+\w+)\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    
    // Extract airports/cities from Departure/Arrival lines
    const depCityMatch = section.match(/Departure[^\n]*\n?[^\n]*?([A-Za-z][A-Za-z\s]+),\s*\(([^)]+)\)/i) ||
                         section.match(/Departure[^\n]*([A-Za-z][A-Za-z\s]+),\s*\(([^)]+)\)/i);
    const arrCityMatch = section.match(/Arrival[^\n]*\n?[^\n]*?([A-Za-z][A-Za-z\s]+),\s*\(([^)]+)\)/i) ||
                         section.match(/Arrival[^\n]*([A-Za-z][A-Za-z\s]+),\s*\(([^)]+)\)/i);
    
    let fromCity = '', toCity = '', fromCode = '', toCode = '';
    
    if (depCityMatch) {
      fromCity = depCityMatch[1].trim();
      fromCode = findIataCode(depCityMatch[2]) || findIataCode(depCityMatch[1]);
    }
    if (arrCityMatch) {
      toCity = arrCityMatch[1].trim();
      toCode = findIataCode(arrCityMatch[2]) || findIataCode(arrCityMatch[1]);
    }
    
    // Extract terminals
    const depTermMatch = section.match(/(?:Departure[^]*?)Terminal[:\s]*([A-Z0-9]+)/i);
    const arrTermMatch = section.match(/(?:Arrival[^]*?)Terminal[:\s]*([A-Z0-9]+)/i);
    
    // Multiple terminal mentions - first is departure, second is arrival
    const termMatches = [...section.matchAll(/Terminal[:\s]*([A-Z0-9]+)/gi)];
    const depTerminal = termMatches[0]?.[1] || '';
    const arrTerminal = termMatches[1]?.[1] || '';
    
    // Extract duration
    const durMatch = section.match(/Duration\s+([\d:]+|\d+h\s*\d+m)/i) || section.match(/(\d{2}:\d{2})\s*\(Non\s*stop\)/i);
    let duration = '';
    if (durMatch) {
      const d = durMatch[1];
      if (d.includes(':')) {
        const [h, m] = d.split(':');
        duration = `${parseInt(h)}h ${m}m`;
      } else duration = d;
    }
    
    // Extract class
    const classMatch = section.match(/Class\s+(\w+)/i);
    const seatClass = classMatch ? (classMatch[1].includes('V') || classMatch[1].includes('Economy') ? 'Economy' : classMatch[1].includes('Business') || classMatch[1].includes('J') ? 'Business' : classMatch[1].includes('First') || classMatch[1].includes('F') ? 'First' : 'Economy') : 'Economy';
    
    // Extract aircraft
    const aircraftMatch = section.match(/Equipment\s+(.+?)(?:\n|$)/i);
    const aircraft = aircraftMatch ? aircraftMatch[1].trim() : '';
    
    // Extract booking ref from this section
    const sectionPnr = section.match(/(?:Booking\s*Reference|PNR)[:\s]*([A-Z0-9]{5,8})/i);
    const thisPnr = sectionPnr?.[1] || pnr;
    
    // Parse date/time
    const dateContext = section.match(/(\d{1,2}\s+\w+\s*\d{0,4})/)?.[1] || '';
    const depTime = depMatch?.[2] || '';
    const arrTime = arrMatch?.[2] || '';
    const depDateStr = depMatch?.[1] || dateContext;
    const arrDateStr = arrMatch?.[1] || dateContext;
    
    const dep = parseDateTime(depDateStr, depTime);
    const arr = parseDateTime(arrDateStr, arrTime);
    
    flights.push({
      from: fromCode,
      fromCity: fromCity || AIRPORT_CITIES[fromCode] || '',
      to: toCode,
      toCity: toCity || AIRPORT_CITIES[toCode] || '',
      airline,
      flightNo,
      departure: dep.iso,
      arrival: arr.iso,
      scheduledDeparture: dep.readable,
      scheduledArrival: arr.readable,
      depTerminal,
      arrTerminal,
      duration,
      status: 'Confirmed',
      aircraft,
      seatClass,
      pnr: thisPnr,
      supplier: airline,
      connectionGroup: thisPnr || pnr,
      tripType: 'One Way',
      legOrder: idx + 1,
    });
  }
  
  return flights;
}
