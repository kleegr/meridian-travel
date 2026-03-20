// Hospitality Copy Generator
// Transforms raw itinerary data into warm, curated, premium travel copy
// Used in client-facing itinerary views to make every section feel like
// a luxury travel advisor prepared it.

import type { Flight, Hotel, Transport, Attraction } from './types';

// ---- FLIGHT COPY ----
export function flightIntro(f: Flight): string {
  const from = f.fromCity || f.from;
  const to = f.toCity || f.to;
  const airline = f.airline || 'your airline';
  const flightNo = f.flightNo || '';
  const cls = f.seatClass ? ` in ${f.seatClass}` : '';
  const duration = f.duration ? ` (approximately ${f.duration})` : '';

  const templates = [
    `Your journey continues aboard ${airline} ${flightNo}${cls}, departing from ${from} as you make your way to the beautiful ${to}${duration}.`,
    `${airline} ${flightNo} will carry you${cls} from ${from} to ${to}${duration} -- settle in, relax, and look forward to what awaits.`,
    `Departing ${from} on ${airline} ${flightNo}${cls}, you will be on your way to ${to}${duration}. A wonderful leg of your journey awaits.`,
  ];
  return templates[hashPick(f.flightNo || f.from + f.to, templates.length)];
}

// ---- HOTEL COPY ----
export function hotelCheckInIntro(h: Hotel): string {
  const name = h.name || 'your hotel';
  const city = h.city || '';
  const room = h.roomType || '';
  const nts = nightsBetween(h.checkIn, h.checkOut);
  const ntsText = nts > 0 ? ` for ${nts} night${nts > 1 ? 's' : ''}` : '';
  const roomText = room ? ` Your ${room.toLowerCase()} has been reserved` : '';

  const templates = [
    `Welcome to ${name}${city ? ' in ' + city : ''}${ntsText}. A warm and inviting stay, carefully selected for comfort, style, and location.${roomText ? roomText + ' and is ready for your arrival.' : ''}`,
    `Tonight you will settle into ${name}${city ? ', nestled in ' + city : ''}${ntsText}.${roomText ? roomText + ', ensuring a restful and enjoyable experience.' : ' Every detail has been arranged for your comfort.'}`,
    `Your home${ntsText} will be ${name}${city ? ' in the heart of ' + city : ''}. A wonderful choice${roomText ? ' -- ' + room.toLowerCase() + ' accommodations await you.' : ' where relaxation and convenience meet.'}`,
  ];
  return templates[hashPick(h.name + h.city, templates.length)];
}

export function hotelCheckOutIntro(h: Hotel): string {
  const name = h.name || 'your hotel';
  return `Time to bid farewell to ${name}. We hope you enjoyed your stay -- your next adventure awaits.`;
}

// ---- TRANSPORT COPY ----
export function transferIntro(t: Transport): string {
  const pickup = t.pickup || 'your location';
  const dropoff = t.dropoff || 'your destination';
  const vehicle = t.type || 'transportation';
  const car = t.carType ? ` (${t.carType})` : '';
  const provider = t.provider ? ` with ${t.provider}` : '';
  const driver = (t as any).driverName ? ` Your driver, ${(t as any).driverName}, will be waiting for you.` : '';

  const templates = [
    `${vehicle}${car} has been arranged${provider} to ensure a smooth and comfortable journey from ${pickup} to ${dropoff}.${driver}`,
    `A ${vehicle.toLowerCase()}${car}${provider} will whisk you from ${pickup} to ${dropoff} in comfort and style.${driver}`,
    `Sit back and relax -- your ${vehicle.toLowerCase()}${car}${provider} from ${pickup} to ${dropoff} is all taken care of.${driver}`,
  ];
  return templates[hashPick(pickup + dropoff, templates.length)];
}

// ---- ACTIVITY COPY ----
export function activityIntro(a: Attraction): string {
  const name = a.name || 'today\'s experience';
  const city = a.city || '';
  const ticket = a.ticketType || '';

  const templates = [
    `Today's highlight brings you to ${name}${city ? ', one of the gems of ' + city : ''}. ${ticket ? ticket + ' access has been arranged' : 'An unforgettable experience awaits'} -- enjoy every moment.`,
    `Get ready for ${name}${city ? ' in ' + city : ''} -- a truly special experience curated just for you.${ticket ? ' Your ' + ticket.toLowerCase() + ' tickets are all set.' : ''}`,
    `A wonderful experience awaits at ${name}${city ? ', a standout destination in ' + city : ''}.${ticket ? ' ' + ticket + ' entry has been secured for you.' : ' This is one you will not want to miss.'}`,
  ];
  return templates[hashPick(a.name + a.city, templates.length)];
}

// ---- DAY INTRO COPY ----
export function dayIntro(dayNum: number, cities: string[], events: number): string {
  const cityText = cities.length > 0 ? cities.join(' & ') : 'your destination';
  if (dayNum === 1) {
    return `Your adventure begins! Day one takes you to ${cityText} with ${events} experience${events !== 1 ? 's' : ''} lined up.`;
  }
  const templates = [
    `Day ${dayNum} unfolds in ${cityText} -- here is what has been prepared for you.`,
    `Another wonderful day awaits in ${cityText}. Here is your curated itinerary for the day.`,
    `Welcome to day ${dayNum}. ${cityText} has plenty in store for you today.`,
  ];
  return templates[hashPick(String(dayNum) + cityText, templates.length)];
}

// ---- DESTINATION INTRO COPY ----
export function destinationIntro(name: string): string {
  const templates = [
    `Welcome to ${name} -- a destination rich with culture, beauty, and unforgettable experiences waiting to be discovered.`,
    `${name} awaits you with open arms. From local cuisine to iconic sights, this destination promises memories to last a lifetime.`,
    `Your time in ${name} will be nothing short of extraordinary. Here is everything you need to know to make the most of your visit.`,
  ];
  return templates[hashPick(name, templates.length)];
}

// ---- SECTION INTROS ----
export function sectionIntro(section: string, clientName?: string): string {
  const name = clientName || 'valued traveler';
  const map: Record<string, string> = {
    overview: `${name}, here is your personally curated travel itinerary. Every detail has been thoughtfully arranged to ensure a seamless and memorable journey.`,
    passengers: 'Here are the travelers joining this journey. Each detail has been confirmed to ensure smooth sailing from start to finish.',
    flights: 'Your flights have been carefully selected for the best routing, timing, and comfort throughout your journey.',
    hotels: 'Your accommodations have been handpicked for location, comfort, and character -- each one a destination in itself.',
    transport: 'Every transfer has been arranged for your convenience, so you can focus on enjoying the journey rather than logistics.',
    activities: 'From iconic landmarks to hidden gems, your experiences have been curated to create lasting memories.',
    insurance: 'Travel with peace of mind -- your coverage has been arranged to keep you protected throughout your trip.',
    davening: 'Minyan locations and times have been researched and confirmed for your convenience during your travels.',
    mikvah: 'Mikvah locations along your route have been identified and details confirmed for your convenience.',
    notes: 'A few important notes from your travel advisor to help make your journey even smoother.',
    contact: 'Your dedicated travel team is always just a call or message away. Do not hesitate to reach out at any time.',
  };
  return map[section] || '';
}

// ---- HELPERS ----
function hashPick(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  try {
    const a = new Date(checkIn); const b = new Date(checkOut);
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  } catch { return 0; }
}
