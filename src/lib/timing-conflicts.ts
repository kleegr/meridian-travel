import type { Itinerary } from './types';
import { fmtDate } from './utils';

export interface TimingConflict {
  severity: 'error' | 'warning';
  message: string;
  items: string[];
}

// Parse a time string like "3:55 AM" or "14:30" into minutes since midnight
function parseTime(t: string): number | null {
  if (!t) return null;
  t = t.trim();
  // Handle 12h format: "3:55 AM", "11:30 PM"
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const min = parseInt(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (ampm === 'AM' && h === 12) h = 0;
    if (ampm === 'PM' && h !== 12) h += 12;
    return h * 60 + min;
  }
  // Handle 24h format: "14:30"
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1]) * 60 + parseInt(m24[2]);
  return null;
}

function getDateStr(dt: string): string {
  if (!dt) return '';
  return dt.split('T')[0] || dt.split(' ')[0] || '';
}

interface TimeEvent {
  date: string;
  time: number; // minutes since midnight
  endTime?: number;
  label: string;
  type: string;
}

export function detectTimingConflicts(itin: Itinerary): TimingConflict[] {
  const conflicts: TimingConflict[] = [];
  const events: TimeEvent[] = [];

  // Collect all timed events
  itin.flights.forEach(f => {
    const date = getDateStr(f.departure);
    const depTime = parseTime(f.scheduledDeparture);
    if (date && depTime !== null) {
      // Flight departure - should be at airport 2h before
      events.push({ date, time: depTime, label: `Flight ${f.airline} ${f.flightNo} departs ${f.from}`, type: 'flight-dep' });
      // Check-in window: 2 hours before departure
      events.push({ date, time: depTime - 120, endTime: depTime, label: `Check-in for ${f.airline} ${f.flightNo}`, type: 'flight-checkin' });
    }
    const arrDate = getDateStr(f.arrival);
    const arrTime = parseTime(f.scheduledArrival);
    if (arrDate && arrTime !== null) {
      events.push({ date: arrDate, time: arrTime, label: `Flight ${f.airline} ${f.flightNo} arrives ${f.to}`, type: 'flight-arr' });
    }
  });

  itin.transport.forEach(t => {
    const date = getDateStr(t.pickupDateTime);
    const time = parseTime(t.pickupTime);
    if (date && time !== null) {
      const travelMin = parseInt(t.estimatedTravelTime || '45') || 45;
      events.push({ date, time, endTime: time + travelMin, label: `Transportation: ${t.pickup} \u2192 ${t.dropoff}`, type: 'transport' });
    }
  });

  itin.attractions.forEach(a => {
    const time = parseTime(a.time);
    if (a.date && time !== null) {
      events.push({ date: a.date, time, endTime: time + 120, label: `Activity: ${a.name}`, type: 'activity' });
    }
  });

  itin.hotels.forEach(h => {
    if (h.checkOut) {
      const coTime = parseTime(h.checkOutTime || '11:00 AM');
      if (coTime !== null) events.push({ date: h.checkOut, time: coTime, label: `Check-out: ${h.name}`, type: 'hotel-co' });
    }
    if (h.checkIn) {
      const ciTime = parseTime(h.checkInTime || '3:00 PM');
      if (ciTime !== null) events.push({ date: h.checkIn, time: ciTime, label: `Check-in: ${h.name}`, type: 'hotel-ci' });
    }
  });

  // Group by date
  const byDate = new Map<string, TimeEvent[]>();
  events.forEach(e => {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  });

  // Check for conflicts on each date
  byDate.forEach((dayEvents, date) => {
    const sorted = dayEvents.sort((a, b) => a.time - b.time);

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];

        // Skip same-type pairs that are naturally sequential
        if (a.type === 'flight-dep' && b.type === 'flight-checkin') continue;
        if (a.type === 'flight-checkin' && b.type === 'flight-dep') continue;

        // Check overlap: if a has an end time and b starts before a ends
        if (a.endTime && b.time < a.endTime && b.time > a.time) {
          conflicts.push({
            severity: 'error',
            message: `Timing overlap on ${fmtDate(date)}`,
            items: [a.label, b.label],
          });
        }

        // Check tight window: less than 30 min between events
        const gap = b.time - (a.endTime || a.time);
        if (gap > 0 && gap < 30 && a.type !== b.type) {
          conflicts.push({
            severity: 'warning',
            message: `Very tight timing on ${fmtDate(date)} (${gap} min gap)`,
            items: [a.label, b.label],
          });
        }
      }
    }
  });

  // Check transport vs flight direction conflicts
  itin.transport.forEach(t => {
    if (!t.linkedFlightId) return;
    const flight = itin.flights.find(f => f.id === Number(t.linkedFlightId));
    if (!flight) return;

    const tDate = getDateStr(t.pickupDateTime);
    const fDate = getDateStr(flight.departure);
    if (tDate && fDate && tDate !== fDate) {
      conflicts.push({
        severity: 'error',
        message: 'Transportation date does not match linked flight date',
        items: [`Transportation: ${t.pickup} \u2192 ${t.dropoff} (${fmtDate(tDate)})`, `Flight: ${flight.airline} ${flight.flightNo} (${fmtDate(fDate)})`],
      });
    }

    // Check if transport to airport is AFTER flight departure
    const tTime = parseTime(t.pickupTime);
    const fTime = parseTime(flight.scheduledDeparture);
    if (tDate === fDate && tTime !== null && fTime !== null) {
      if (t.transferScenario?.includes('airport') && t.dropoff?.toLowerCase().includes('airport')) {
        if (tTime > fTime - 60) {
          conflicts.push({
            severity: 'error',
            message: 'Transportation pickup is too close to or after flight departure',
            items: [`Pickup at ${t.pickupTime}`, `Flight departs at ${flight.scheduledDeparture}`],
          });
        }
      }
    }
  });

  // Check for very early AM times that might be PM mistakes
  events.forEach(e => {
    if (e.time >= 0 && e.time < 300 && e.type !== 'flight-dep' && e.type !== 'flight-arr' && e.type !== 'flight-checkin') {
      const h = Math.floor(e.time / 60);
      const m = e.time % 60;
      conflicts.push({
        severity: 'warning',
        message: `Unusually early time (${h}:${String(m).padStart(2, '0')} AM) - did you mean PM?`,
        items: [e.label],
      });
    }
  });

  return conflicts;
}
