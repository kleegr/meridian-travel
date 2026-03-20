'use client';

import { fmtDate, nights } from '@/lib/utils';
import { flightIntro, hotelCheckInIntro, transferIntro, activityIntro, dayIntro, destinationIntro, sectionIntro } from '@/lib/hospitality-copy';
import { getDestinationImage, getCityImage, getHotelImage, getAttractionImage, getAirportImage, getFlightImage } from '@/lib/destination-images';
import type { Itinerary, AgencyProfile, Flight, Hotel, Transport, Attraction, ClientViewSettings } from '@/lib/types';

interface BlockProps {
  itin: Itinerary;
  agency: AgencyProfile;
  cv: ClientViewSettings;
  pc: string;
  ac: string;
  ff: string;
  onImageClick?: (imageKey: string, currentUrl: string) => void;
  onTextEdit?: (key: string, currentValue: string) => void;
}

// =============================================
// COVER BLOCKS - with print classes
// =============================================

export function CoverFullHero({ itin, agency, cv, pc, ac, ff, onImageClick }: BlockProps) {
  const img = getDestinationImage(itin.destination, cv.coverImage);
  const n = nights(itin.startDate, itin.endDate);
  const logo = cv.showLogo ? agency.logo : '';
  return (
    <div className="print-cover" style={{ position: 'relative', minHeight: 500, background: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%), url(${img}) center/cover no-repeat`, fontFamily: ff, pageBreakAfter: 'always' }}>
      {onImageClick && <div onClick={() => onImageClick('cover', img)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', zIndex: 5 }} className="no-print">Change Image</div>}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48 }}>
        {logo && <img src={logo} alt="" style={{ height: 36, objectFit: 'contain', position: 'absolute', top: 32, left: 48, filter: 'brightness(0) invert(1)' }} />}
        <h1 style={{ fontSize: 44, fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 12, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>{itin.title}</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>{itin.destination} | {fmtDate(itin.startDate)} - {fmtDate(itin.endDate)}</p>
        <div style={{ display: 'flex', gap: 32 }}>
          {[{ v: n, l: 'Nights' }, { v: itin.passengers, l: 'Travelers' }, { v: itin.flights.length, l: 'Flights' }, { v: itin.hotels.length, l: 'Hotels' }].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>{s.v}</div><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 3, color: 'rgba(255,255,255,0.5)' }}>{s.l}</div></div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div><div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Prepared for</div><div style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>{itin.client}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Your Travel Advisor</div><div style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>{itin.agent}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{agency.phone}</div></div>
        </div>
      </div>
    </div>
  );
}

export function CoverSplitHero({ itin, agency, cv, pc, ac, ff, onImageClick }: BlockProps) {
  const img = getDestinationImage(itin.destination, cv.coverImage);
  const n = nights(itin.startDate, itin.endDate);
  const logo = cv.showLogo ? agency.logo : '';
  return (
    <div className="print-cover" style={{ display: 'flex', minHeight: 440, fontFamily: ff, pageBreakAfter: 'always' }}>
      <div style={{ flex: 1, background: pc, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white' }}>
        {logo && <img src={logo} alt="" style={{ height: 28, objectFit: 'contain', alignSelf: 'flex-start', filter: 'brightness(0) invert(1)', marginBottom: 24 }} />}
        <div>
          <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 3, opacity: 0.5, marginBottom: 8 }}>{agency.name}</p>
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>{itin.title}</h1>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 24 }}>{itin.destination} | {fmtDate(itin.startDate)} - {fmtDate(itin.endDate)}</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[{ v: n, l: 'Nights' }, { v: itin.passengers, l: 'Travelers' }].map(s => (
              <div key={s.l}><div style={{ fontSize: 24, fontWeight: 700 }}>{s.v}</div><div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.4 }}>{s.l}</div></div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
          <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.4, marginBottom: 4 }}>Prepared for</p>
          <p style={{ fontSize: 18, fontWeight: 700 }}>{itin.client}</p>
          <p style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Advisor: {itin.agent}</p>
        </div>
      </div>
      <div style={{ flex: 1, background: `url(${img}) center/cover no-repeat`, minHeight: 440, position: 'relative' }}>
        {onImageClick && <div onClick={() => onImageClick('cover', img)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }} className="no-print">Change</div>}
      </div>
    </div>
  );
}

export function CoverMinimal({ itin, agency, cv, pc, ac, ff }: BlockProps) {
  const n = nights(itin.startDate, itin.endDate);
  const logo = cv.showLogo ? agency.logo : '';
  return (
    <div className="print-cover" style={{ padding: '48px 48px 32px', fontFamily: ff, borderBottom: `4px solid ${pc}`, pageBreakAfter: 'always' }}>
      {logo && <img src={logo} alt="" style={{ height: 32, objectFit: 'contain', marginBottom: 32 }} />}
      <h1 style={{ fontSize: 40, fontWeight: 800, color: pc, lineHeight: 1.1, marginBottom: 8 }}>{itin.title}</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>{itin.destination} | {fmtDate(itin.startDate)} - {fmtDate(itin.endDate)} | {n} nights</p>
      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#94a3b8', lineHeight: 1.7, marginBottom: 24 }}>{sectionIntro('overview', itin.client)}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
        <div><p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8', marginBottom: 4 }}>Prepared for</p><p style={{ fontSize: 18, fontWeight: 700, color: pc }}>{itin.client}</p></div>
        <div style={{ textAlign: 'right' }}><p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8', marginBottom: 4 }}>Travel Advisor</p><p style={{ fontSize: 14, fontWeight: 600, color: pc }}>{itin.agent}</p></div>
      </div>
    </div>
  );
}

// =============================================
// DESTINATION SPOTLIGHT
// =============================================

export function DestinationSpotlight({ name, description, pc, ff, onImageClick }: { name: string; description?: string; pc: string; ff: string; onImageClick?: (key: string, url: string) => void }) {
  const img = getCityImage(name);
  return (
    <div className="print-card" style={{ display: 'flex', minHeight: 180, fontFamily: ff, marginBottom: 2 }}>
      <div style={{ width: '40%', background: `url(${img}) center/cover no-repeat`, position: 'relative' }}>
        {onImageClick && <div onClick={() => onImageClick('dest-' + name, img)} style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 8, padding: '2px 6px', borderRadius: 3, cursor: 'pointer' }} className="no-print">Change</div>}
      </div>
      <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 3, color: '#94a3b8', marginBottom: 6 }}>Destination</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: pc, marginBottom: 8 }}>{name}</h2>
        <p style={{ fontSize: 11, fontStyle: 'italic', color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>{destinationIntro(name)}</p>
        {description && <p style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.6 }}>{description.substring(0, 200)}{description.length > 200 ? '...' : ''}</p>}
      </div>
    </div>
  );
}

// =============================================
// HOTEL SHOWCASE with image
// =============================================

export function HotelShowcaseCard({ hotel, pc, ff, onImageClick }: { hotel: Hotel; pc: string; ff: string; onImageClick?: (key: string, url: string) => void }) {
  let photos: string[] = [];
  try { if ((hotel as any).hotelPhotos) photos = typeof (hotel as any).hotelPhotos === 'string' ? JSON.parse((hotel as any).hotelPhotos) : (hotel as any).hotelPhotos; } catch {}
  const img = getHotelImage(hotel.name, hotel.city, photos);
  const n = nights(hotel.checkIn, hotel.checkOut);
  return (
    <div className="print-card" style={{ display: 'flex', background: '#fafbfc', borderRadius: 8, overflow: 'hidden', marginBottom: 12, border: '1px solid #e2e8f0', fontFamily: ff }}>
      <div style={{ width: 180, minHeight: 140, background: `url(${img}) center/cover no-repeat`, flexShrink: 0, position: 'relative' }}>
        {onImageClick && <div onClick={() => onImageClick('hotel-' + hotel.id, img)} style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 8, padding: '2px 6px', borderRadius: 3, cursor: 'pointer' }} className="no-print">Change</div>}
      </div>
      <div style={{ flex: 1, padding: '16px 20px' }}>
        <p style={{ fontSize: 11, fontStyle: 'italic', color: '#94a3b8', lineHeight: 1.5, marginBottom: 6 }}>{hotelCheckInIntro(hotel)}</p>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: pc, marginBottom: 4 }}>{hotel.name}</h3>
        <p style={{ fontSize: 10, color: '#64748b' }}>{hotel.city} | {hotel.roomType} | {hotel.rooms} room{hotel.rooms > 1 ? 's' : ''} | {n} night{n !== 1 ? 's' : ''}</p>
        <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>{fmtDate(hotel.checkIn)} - {fmtDate(hotel.checkOut)}{hotel.ref ? ' | Ref: ' + hotel.ref : ''}</p>
      </div>
    </div>
  );
}

// =============================================
// FLIGHT JOURNEY with airport image
// =============================================

export function FlightJourneyCard({ flight, pc, ff, showImage, onImageClick }: { flight: Flight; pc: string; ff: string; showImage?: boolean; onImageClick?: (key: string, url: string) => void }) {
  const airportImg = getFlightImage(flight.from, flight.to);
  return (
    <div className="print-card" style={{ borderRadius: 8, marginBottom: 8, fontFamily: ff, border: '1px solid #dbeafe', overflow: 'hidden' }}>
      {showImage && (
        <div style={{ height: 80, background: `linear-gradient(90deg, rgba(0,0,0,0.3), transparent), url(${airportImg}) center/cover no-repeat`, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>{flight.airline} {flight.flightNo}</span>
          {onImageClick && <div onClick={() => onImageClick('flight-' + flight.id, airportImg)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 8, padding: '2px 6px', borderRadius: 3, cursor: 'pointer' }} className="no-print">Change</div>}
        </div>
      )}
      <div style={{ background: '#f0f5ff', padding: '14px 20px' }}>
        <p style={{ fontSize: 10, fontStyle: 'italic', color: '#6b7280', lineHeight: 1.5, marginBottom: 6 }}>{flightIntro(flight)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: pc }}>{flight.from}</div>
            <div style={{ fontSize: 8, color: '#94a3b8' }}>{flight.fromCity}</div>
          </div>
          <div style={{ flex: 1, height: 1, background: '#cbd5e1', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '2px 8px', borderRadius: 12, border: '1px solid #dbeafe' }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: pc }}>{flight.airline} {flight.flightNo}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: pc }}>{flight.to}</div>
            <div style={{ fontSize: 8, color: '#94a3b8' }}>{flight.toCity}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 9, color: '#6b7280' }}>
          {flight.scheduledDeparture && <span>Departs: {flight.scheduledDeparture}</span>}
          {flight.duration && <span>Duration: {flight.duration}</span>}
          {flight.seatClass && <span>Class: {flight.seatClass}</span>}
          {flight.depTerminal && <span>Terminal {flight.depTerminal}</span>}
        </div>
      </div>
    </div>
  );
}

// =============================================
// TRANSPORT BLOCK
// =============================================

export function TransportBlock({ transport, pc, ff }: { transport: Transport; pc: string; ff: string }) {
  return (
    <div className="print-card" style={{ background: '#f5f3ff', borderRadius: 8, padding: '12px 20px', marginBottom: 8, fontFamily: ff, border: '1px solid #ede9fe' }}>
      <p style={{ fontSize: 10, fontStyle: 'italic', color: '#6b7280', lineHeight: 1.5, marginBottom: 4 }}>{transferIntro(transport)}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><span style={{ fontSize: 12, fontWeight: 600, color: pc }}>{transport.type}</span>{transport.carType && <span style={{ fontSize: 10, color: '#64748b' }}> - {transport.carType}</span>}</div>
        {transport.pickupTime && <span style={{ fontSize: 10, fontWeight: 600, color: pc }}>{transport.pickupTime}</span>}
      </div>
      <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>{transport.pickup} &rarr; {transport.dropoff}{transport.provider ? ' | ' + transport.provider : ''}</div>
    </div>
  );
}

// =============================================
// ACTIVITY HIGHLIGHT with image
// =============================================

export function ActivityHighlight({ attraction, pc, ff, onImageClick }: { attraction: Attraction; pc: string; ff: string; onImageClick?: (key: string, url: string) => void }) {
  const img = getAttractionImage(attraction.name, attraction.city);
  return (
    <div className="print-card" style={{ display: 'flex', background: '#fff7ed', borderRadius: 8, overflow: 'hidden', marginBottom: 8, fontFamily: ff, border: '1px solid #fed7aa' }}>
      <div style={{ width: 100, background: `url(${img}) center/cover no-repeat`, flexShrink: 0, position: 'relative' }}>
        {onImageClick && <div onClick={() => onImageClick('activity-' + attraction.id, img)} style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 7, padding: '1px 4px', borderRadius: 2, cursor: 'pointer' }} className="no-print">Change</div>}
      </div>
      <div style={{ flex: 1, padding: '12px 16px' }}>
        <p style={{ fontSize: 10, fontStyle: 'italic', color: '#92400e', lineHeight: 1.4, marginBottom: 4 }}>{activityIntro(attraction)}</p>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: pc, marginBottom: 2 }}>{attraction.name}</h4>
        <p style={{ fontSize: 9, color: '#6b7280' }}>{attraction.city} | {attraction.ticketType}{attraction.time ? ' | ' + attraction.time : ''}</p>
      </div>
    </div>
  );
}

// =============================================
// DAY HEADER - 4 styles
// =============================================

export function DayHeader({ dayNum, date, cities, eventCount, pc, ac, ff, style: tplStyle }: { dayNum: number; date: string; cities: string[]; eventCount: number; pc: string; ac: string; ff: string; style: 'editorial' | 'magazine' | 'minimal' | 'classic' }) {
  const dateObj = new Date(date + 'T12:00');
  const cityImg = cities.length > 0 ? getCityImage(cities[0]) : '';

  if (tplStyle === 'magazine' && cityImg) {
    return (
      <div className="print-no-break" style={{ display: 'flex', minHeight: 100, fontFamily: ff, marginTop: 16 }}>
        <div style={{ width: 120, background: `url(${cityImg}) center/cover no-repeat`, borderRadius: '8px 0 0 8px' }} />
        <div style={{ flex: 1, background: pc, padding: '16px 24px', borderRadius: '0 8px 8px 0', color: 'white' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Day {dayNum}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          {cities.length > 0 && <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>{cities.join(', ')}</div>}
          <p style={{ fontSize: 9, fontStyle: 'italic', opacity: 0.6, marginTop: 6 }}>{dayIntro(dayNum, cities, eventCount)}</p>
        </div>
      </div>
    );
  }

  if (tplStyle === 'editorial') {
    return (
      <div className="print-no-break" style={{ fontFamily: ff, padding: '20px 32px', background: `linear-gradient(135deg, ${pc}, ${ac})`, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: 'white', opacity: 0.3 }}>{String(dayNum).padStart(2, '0')}</span>
          <div><div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>{cities.length > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{cities.join(' & ')}</div>}</div>
        </div>
        <p style={{ fontSize: 10, fontStyle: 'italic', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{dayIntro(dayNum, cities, eventCount)}</p>
      </div>
    );
  }

  if (tplStyle === 'minimal') {
    return (
      <div className="print-no-break" style={{ fontFamily: ff, padding: '16px 32px', borderBottom: `2px solid ${pc}`, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: pc }}>Day {dayNum}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          {cities.length > 0 && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>{cities.join(', ')}</span>}
        </div>
        <p style={{ fontSize: 9, fontStyle: 'italic', color: '#94a3b8', marginTop: 4 }}>{dayIntro(dayNum, cities, eventCount)}</p>
      </div>
    );
  }

  // classic
  return (
    <div className="print-no-break" style={{ fontFamily: ff, padding: '12px 32px', background: pc, marginTop: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Day {dayNum}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginLeft: 8 }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      {cities.length > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 12 }}>{cities.join(', ')}</span>}
      <p style={{ fontSize: 9, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{dayIntro(dayNum, cities, eventCount)}</p>
    </div>
  );
}

// =============================================
// SECTION DIVIDER
// =============================================

export function SectionDivider({ title, intro, pc, ff }: { title: string; intro?: string; pc: string; ff: string }) {
  return (
    <div style={{ fontFamily: ff, padding: '16px 32px', borderTop: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: pc, marginBottom: intro ? 4 : 0 }}>{title}</h2>
      {intro && <p style={{ fontSize: 10, fontStyle: 'italic', color: '#94a3b8', lineHeight: 1.5 }}>{intro}</p>}
    </div>
  );
}

// =============================================
// FOOTER
// =============================================

export function FooterBlock({ itin, agency, cv, pc, ff }: { itin: Itinerary; agency: AgencyProfile; cv: ClientViewSettings; pc: string; ff: string }) {
  const logo = cv.showLogo ? agency.logo : '';
  return (
    <div style={{ fontFamily: ff }}>
      {cv.showContactInfo && (
        <div style={{ padding: '16px 32px', background: '#f0f5ff', borderTop: '1px solid #dbeafe' }}>
          <p style={{ fontSize: 9, fontStyle: 'italic', color: '#94a3b8', marginBottom: 8 }}>{sectionIntro('contact', itin.client)}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <div><span style={{ fontWeight: 600, color: pc }}>{agency.name}</span> <span style={{ color: '#64748b' }}>{agency.phone}</span></div>
            <div style={{ color: '#64748b' }}>{itin.agent} | {agency.email}</div>
          </div>
        </div>
      )}
      <div style={{ padding: '12px 32px', background: pc, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {logo ? <img src={logo} alt="" style={{ height: 20, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /> : <span style={{ fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: 2 }}>{agency.name.toUpperCase()}</span>}
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Prepared with care for {itin.client}</span>
      </div>
    </div>
  );
}

// Missing import for activityIntro used in TemplateRenderer
import { activityIntro as _activityIntro } from '@/lib/hospitality-copy';
