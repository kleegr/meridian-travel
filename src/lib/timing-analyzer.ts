// Timing Analyzer - detects conflicts across the entire itinerary
import type { Itinerary, Flight, Hotel, Transport, Attraction } from '@/lib/types';
import type { TimingSettings, TimingConflict } from '@/lib/timing-settings';
import { DEFAULT_TIMING_SETTINGS } from '@/lib/timing-settings';

function parseDateTime(dateStr: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    const d = dateStr.split('T')[0];
    if (timeStr) {
      // Parse times like "6:00 PM", "14:00", etc.
      let hours = 0, minutes = 0;
      const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (match12) {
        hours = parseInt(match12[1]);
        minutes = parseInt(match12[2]);
        if (match12[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (match12[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
      } else if (match24) {
        hours = parseInt(match24[1]);
        minutes = parseInt(match24[2]);
      }
      return new Date(`${d}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    }
    return new Date(`${d}T12:00:00`);
  } catch { return null; }
}

function diffMinutes(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function uid(): string {
  return 'tc-' + Math.random().toString(36).substring(2, 9);
}

export function analyzeTimingConflicts(itin: Itinerary, settings?: TimingSettings): TimingConflict[] {
  const s = settings || DEFAULT_TIMING_SETTINGS;
  const conflicts: TimingConflict[] = [];

  // === 1. CONNECTING FLIGHTS - check connection time ===
  const sortedFlights = [...itin.flights].sort((a, b) => {
    const da = a.departure || '';
    const db = b.departure || '';
    return da.localeCompare(db);
  });

  for (let i = 0; i < sortedFlights.length - 1; i++) {
    const f1 = sortedFlights[i];
    const f2 = sortedFlights[i + 1];
    
    // Check if flights connect (f1 arrives at same airport f2 departs from)
    if (f1.to && f2.from && f1.to === f2.from) {
      // Calculate connection time
      const f1Departure = parseDateTime(f1.departure, f1.scheduledDeparture);
      const f2Departure = parseDateTime(f2.departure, f2.scheduledDeparture);
      
      if (f1Departure && f2Departure && f1.duration) {
        // Parse duration like "8h 30m" or "5h 00m"
        const durMatch = f1.duration.match(/(\d+)h\s*(\d+)m?/);
        if (durMatch) {
          const durMinutes = parseInt(durMatch[1]) * 60 + parseInt(durMatch[2]);
          const f1Arrival = new Date(f1Departure.getTime() + durMinutes * 60000);
          const connectionMinutes = diffMinutes(f1Arrival, f2Departure);
          
          if (connectionMinutes < s.minConnectionMinutes) {
            conflicts.push({
              id: uid(),
              type: 'connection_too_short',
              severity: connectionMinutes < 60 ? 'error' : 'warning',
              title: `Tight connection at ${f1.to} (${f1.toCity || ''})`,
              description: `Only ${connectionMinutes} min between ${f1.airline} ${f1.flightNo} arrival and ${f2.airline} ${f2.flightNo} departure. Minimum recommended: ${s.minConnectionMinutes} min.`,
              items: [
                { type: 'flight', id: f1.id, name: `${f1.airline} ${f1.flightNo} (${f1.from} > ${f1.to})` },
                { type: 'flight', id: f2.id, name: `${f2.airline} ${f2.flightNo} (${f2.from} > ${f2.to})` },
              ],
              suggestedFix: connectionMinutes < 60 
                ? 'This connection is very risky. Consider rebooking with more time or booking a direct flight.'
                : 'Consider allowing more time between connections, especially if baggage reclaim or terminal change is needed.',
            });
          }
        }
      }
    }
  }

  // === 2. HOTEL BOOKED DURING CONNECTION ===
  // Check if a hotel is booked at a connection city where connection time is short
  for (let i = 0; i < sortedFlights.length - 1; i++) {
    const f1 = sortedFlights[i];
    const f2 = sortedFlights[i + 1];
    
    if (f1.to && f2.from && f1.to === f2.from) {
      // This is a connection - check if hotel booked at this city
      const connectionCity = f1.toCity || f1.to;
      const f1Date = f1.departure?.split('T')[0] || '';
      const f2Date = f2.departure?.split('T')[0] || '';
      
      const hotelAtConnection = itin.hotels.find(h => {
        const hCity = h.city?.toLowerCase() || '';
        const cCity = connectionCity.toLowerCase();
        const checkIn = h.checkIn?.split('T')[0] || '';
        const checkOut = h.checkOut?.split('T')[0] || '';
        return (hCity.includes(cCity) || cCity.includes(hCity)) && 
               checkIn >= f1Date && checkOut <= f2Date;
      });

      // Check if connection is same day (no overnight)
      if (f1Date === f2Date && hotelAtConnection) {
        conflicts.push({
          id: uid(),
          type: 'hotel_during_connection',
          severity: 'warning',
          title: `Hotel booked at connection city ${connectionCity}`,
          description: `${hotelAtConnection.name} is booked in ${connectionCity}, but flights ${f1.airline} ${f1.flightNo} and ${f2.airline} ${f2.flightNo} connect on the same day. Is this an intentional stopover?`,
          items: [
            { type: 'hotel', id: hotelAtConnection.id, name: hotelAtConnection.name },
            { type: 'flight', id: f1.id, name: `${f1.airline} ${f1.flightNo}` },
            { type: 'flight', id: f2.id, name: `${f2.airline} ${f2.flightNo}` },
          ],
          suggestedFix: 'If this is a planned stopover, no action needed. If it\'s a connection, the hotel booking may not be needed.',
        });
      }
    }
  }

  // === 3. HOTEL CHECKOUT vs FLIGHT DEPARTURE ===
  itin.hotels.forEach(hotel => {
    const checkoutDate = hotel.checkOut?.split('T')[0];
    if (!checkoutDate) return;
    
    // Find flights departing on checkout day from hotel city
    const departingFlights = itin.flights.filter(f => {
      const fDate = f.departure?.split('T')[0];
      const fCity = (f.fromCity || '').toLowerCase();
      const hCity = (hotel.city || '').toLowerCase();
      return fDate === checkoutDate && (fCity.includes(hCity) || hCity.includes(fCity) || f.from === hotel.city);
    });

    departingFlights.forEach(flight => {
      const checkoutTime = parseDateTime(checkoutDate, s.defaultCheckoutTime);
      const flightTime = parseDateTime(flight.departure, flight.scheduledDeparture);
      
      if (checkoutTime && flightTime) {
        const bufferNeeded = s.airportBufferHours * 60; // airport buffer in minutes
        const timeBetween = diffMinutes(checkoutTime, flightTime);
        
        if (timeBetween < bufferNeeded + 30) { // checkout + travel + buffer
          conflicts.push({
            id: uid(),
            type: 'hotel_checkout_flight',
            severity: timeBetween < bufferNeeded ? 'error' : 'warning',
            title: `Tight schedule: checkout to flight at ${hotel.city}`,
            description: `Checkout from ${hotel.name} at ${s.defaultCheckoutTime} and flight ${flight.airline} ${flight.flightNo} departs at ${flight.scheduledDeparture || 'TBD'}. Only ${timeBetween} min including travel to airport. Need ${bufferNeeded} min airport buffer + travel time.`,
            items: [
              { type: 'hotel', id: hotel.id, name: hotel.name },
              { type: 'flight', id: flight.id, name: `${flight.airline} ${flight.flightNo}` },
            ],
            suggestedFix: 'Consider an earlier checkout, later flight, or arranging early luggage storage.',
          });
        }
      }
    });
  });

  // === 4. TRANSPORT TIMING vs FLIGHTS ===
  itin.transport.forEach(transport => {
    if (!transport.pickupDateTime || !transport.pickupTime) return;
    
    // Find linked flight
    const linkedFlight = transport.linkedFlightId 
      ? itin.flights.find(f => String(f.id) === transport.linkedFlightId)
      : null;
    
    if (linkedFlight && linkedFlight.scheduledDeparture) {
      const pickupDT = parseDateTime(transport.pickupDateTime, transport.pickupTime);
      const flightDT = parseDateTime(linkedFlight.departure, linkedFlight.scheduledDeparture);
      
      if (pickupDT && flightDT) {
        const travelMinutes = parseInt(transport.estimatedTravelTime || '45');
        const arrivalAtAirport = new Date(pickupDT.getTime() + travelMinutes * 60000);
        const bufferMinutes = diffMinutes(arrivalAtAirport, flightDT);
        
        if (bufferMinutes < s.airportBufferHours * 60) {
          conflicts.push({
            id: uid(),
            type: 'transport_timing',
            severity: bufferMinutes < 60 ? 'error' : 'warning',
            title: `Transport may arrive late for flight`,
            description: `Pickup at ${transport.pickupTime} + ${travelMinutes} min travel = arrive airport with only ${bufferMinutes} min before ${linkedFlight.airline} ${linkedFlight.flightNo} at ${linkedFlight.scheduledDeparture}. Recommended: ${s.airportBufferHours}h buffer.`,
            items: [
              { type: 'transport', id: transport.id, name: `${transport.type}: ${transport.pickup} > ${transport.dropoff}` },
              { type: 'flight', id: linkedFlight.id, name: `${linkedFlight.airline} ${linkedFlight.flightNo}` },
            ],
            suggestedFix: `Move pickup earlier to allow ${s.airportBufferHours} hours at the airport before departure.`,
          });
        }
      }
    }
  });

  // === 5. OVERNIGHT WITHOUT HOTEL ===
  if (s.warnOvernightWithoutHotel) {
    const startDate = itin.startDate?.split('T')[0] || '';
    const endDate = itin.endDate?.split('T')[0] || '';
    if (startDate && endDate) {
      const start = new Date(startDate + 'T12:00:00');
      const end = new Date(endDate + 'T12:00:00');
      const days = Math.round((end.getTime() - start.getTime()) / 86400000);
      
      for (let d = 0; d < days; d++) {
        const night = new Date(start.getTime() + d * 86400000);
        const nightStr = night.toISOString().split('T')[0];
        
        // Check if any hotel covers this night
        const covered = itin.hotels.some(h => {
          const ci = h.checkIn?.split('T')[0] || '';
          const co = h.checkOut?.split('T')[0] || '';
          return nightStr >= ci && nightStr < co;
        });
        
        // Check if it's an overnight flight
        const overnightFlight = itin.flights.some(f => {
          const fDate = f.departure?.split('T')[0] || '';
          return fDate === nightStr;
        });
        
        if (!covered && !overnightFlight && d > 0) {
          conflicts.push({
            id: uid(),
            type: 'overnight_no_hotel',
            severity: 'warning',
            title: `No hotel for night of ${new Date(nightStr + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            description: `No accommodation booked for the night of ${nightStr}. Traveler may need a hotel unless staying with friends/family or on an overnight flight.`,
            items: [],
            suggestedFix: 'Book a hotel for this night or confirm alternative accommodation.',
          });
        }
      }
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
  conflicts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return conflicts;
}
