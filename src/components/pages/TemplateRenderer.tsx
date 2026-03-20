'use client';

import { useMemo } from 'react';
import { fmtDate, fmtTime12, nights } from '@/lib/utils';
import { sectionIntro, activityIntro, hotelCheckOutIntro } from '@/lib/hospitality-copy';
import { CoverFullHero, CoverSplitHero, CoverMinimal, DestinationSpotlight, HotelShowcaseCard, FlightJourneyCard, TransportBlock, ActivityHighlight, DayHeader, SectionDivider, FooterBlock } from './TemplateBlocks';
import type { Itinerary, AgencyProfile, ClientViewSettings, Flight, Hotel, Transport, Attraction } from '@/lib/types';
import { DEFAULT_CLIENT_VIEW_SETTINGS } from '@/lib/types';

interface Props {
  itin: Itinerary;
  agencyProfile: AgencyProfile;
  template?: string;
  onImageClick?: (imageKey: string, currentUrl: string) => void;
  onEditItem?: (section: string, id: number) => void;
}

const FONT_MAP: Record<string, string> = {
  'serif': "'Georgia', 'Times New Roman', serif",
  'sans-serif': "'Helvetica Neue', 'Arial', sans-serif",
  'modern': "'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  'elegant': "'Playfair Display', 'Georgia', serif",
  'clean': "'DM Sans', 'Helvetica', sans-serif",
  'mono': "'JetBrains Mono', 'Fira Code', monospace",
};

interface DayData {
  date: string;
  flights: Flight[];
  hotels: { hotel: Hotel; type: 'checkin' | 'checkout' }[];
  transports: Transport[];
  activities: Attraction[];
}

function buildDays(itin: Itinerary, cv: ClientViewSettings): DayData[] {
  const dayMap = new Map<string, DayData>();
  const getDay = (d: string) => {
    if (!d) return null;
    const key = d.split('T')[0];
    if (!dayMap.has(key)) dayMap.set(key, { date: key, flights: [], hotels: [], transports: [], activities: [] });
    return dayMap.get(key)!;
  };
  if (cv.showFlights) itin.flights.forEach(f => { const day = getDay(f.departure); if (day) day.flights.push(f); });
  if (cv.showHotels) itin.hotels.forEach(h => { const ci = getDay(h.checkIn); if (ci) ci.hotels.push({ hotel: h, type: 'checkin' }); const co = getDay(h.checkOut); if (co) co.hotels.push({ hotel: h, type: 'checkout' }); });
  if (cv.showTransfers) itin.transport.forEach(t => { const day = getDay(t.pickupDateTime || ''); if (day) day.transports.push(t); });
  if (cv.showActivities) itin.attractions.forEach(a => { const day = getDay(a.date); if (day) day.activities.push(a); });
  return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function TemplateRenderer({ itin, agencyProfile, template: tplOverride, onImageClick, onEditItem }: Props) {
  const cv = itin.clientViewSettings || DEFAULT_CLIENT_VIEW_SETTINGS;
  const tpl = tplOverride || cv.layoutStyle || 'classic';
  const pc = cv.primaryColor || '#093168';
  const ac = cv.accentColor || '#1a5298';
  const ff = FONT_MAP[cv.fontFamily] || FONT_MAP['serif'];
  const days = useMemo(() => buildDays(itin, cv), [itin, cv]);
  const vdi = cv.showDestinationInfo ? (itin.destinationInfo || []).filter(d => d.showOnItinerary && d.description) : [];
  const bp = { itin, agency: agencyProfile, cv, pc, ac, ff, onImageClick };
  const isVisual = tpl === 'editorial' || tpl === 'brochure';
  const showFlightImages = tpl === 'brochure';
  const canEdit = !!onEditItem;
  const edit = (section: string, id: number) => { if (onEditItem) onEditItem(section, id); };
  const editClass = canEdit ? 'editable-item' : '';

  const Cover = tpl === 'minimal' ? CoverMinimal : tpl === 'editorial' || tpl === 'brochure' ? CoverSplitHero : CoverFullHero;
  const dayStyle = tpl === 'editorial' ? 'editorial' : tpl === 'brochure' ? 'magazine' : tpl === 'minimal' ? 'minimal' : 'classic';

  return (
    <div style={{ background: 'white', overflow: 'hidden', fontFamily: ff }}>
      {cv.showOverview && <Cover {...bp} />}

      {cv.showOverview && (
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: '#4b5563', lineHeight: 1.7, fontWeight: 500 }}>{sectionIntro('overview', itin.client)}</p>
        </div>
      )}

      {cv.showPassengers && itin.passengerList.length > 0 && (
        <div className="print-no-break" style={{ padding: '16px 32px', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 10, fontStyle: 'italic', color: '#64748b', marginBottom: 8, fontWeight: 500 }}>{sectionIntro('passengers')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{itin.passengerList.map((p, i) => <span key={i} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#f0f5ff', color: pc }}>{p.name}</span>)}</div>
        </div>
      )}

      {vdi.length > 0 && (
        <div>
          <SectionDivider title="Your Destinations" intro={undefined} pc={pc} ff={ff} />
          {vdi.map((di, i) => <DestinationSpotlight key={i} name={di.name} description={di.description} pc={pc} ff={ff} onImageClick={onImageClick} />)}
        </div>
      )}

      {isVisual && cv.showHotels && itin.hotels.length > 0 && (
        <div style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Your Accommodations" intro={sectionIntro('hotels')} pc={pc} ff={ff} />
          {itin.hotels.map((h, i) => (
            <div key={i} className={editClass} onClick={() => edit('hotel', h.id)}>
              <HotelShowcaseCard hotel={h} pc={pc} ff={ff} onImageClick={onImageClick} />
            </div>
          ))}
        </div>
      )}

      {isVisual && cv.showFlights && itin.flights.length > 0 && (
        <div style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Your Flights" intro={sectionIntro('flights')} pc={pc} ff={ff} />
          {itin.flights.map((f, i) => (
            <div key={i} className={editClass} onClick={() => edit('flight', f.id)}>
              <FlightJourneyCard flight={f} pc={pc} ff={ff} showImage={showFlightImages} onImageClick={onImageClick} />
            </div>
          ))}
        </div>
      )}

      {days.map((day, dayIdx) => {
        const cities: string[] = [];
        day.flights.forEach(f => { if (f.toCity && !cities.includes(f.toCity)) cities.push(f.toCity); });
        day.hotels.forEach(h => { if (h.hotel.city && !cities.includes(h.hotel.city)) cities.push(h.hotel.city); });
        day.activities.forEach(a => { if (a.city && !cities.includes(a.city)) cities.push(a.city); });
        const totalEvents = day.flights.length + day.hotels.length + day.transports.length + day.activities.length;

        return (
          <div key={day.date} className="print-day-block">
            <DayHeader dayNum={dayIdx + 1} date={day.date} cities={cities} eventCount={totalEvents} pc={pc} ac={ac} ff={ff} style={dayStyle as any} />
            <div style={{ padding: '8px 32px 16px' }}>
              {!isVisual && day.flights.map((f, i) => (
                <div key={'f' + i} className={editClass} onClick={() => edit('flight', f.id)}>
                  <FlightJourneyCard flight={f} pc={pc} ff={ff} showImage={showFlightImages} />
                </div>
              ))}
              {day.hotels.filter(h => h.type === 'checkin').map((h, i) => (
                <div key={'hi' + i} className={editClass} onClick={() => edit('hotel', h.hotel.id)}>
                  {!isVisual ? <HotelShowcaseCard hotel={h.hotel} pc={pc} ff={ff} onImageClick={onImageClick} /> :
                  <div style={{ fontSize: 11, padding: '6px 0', color: '#4b5563', fontFamily: ff, fontWeight: 500 }}><strong style={{ color: pc }}>Check-in:</strong> {h.hotel.name}, {h.hotel.city}{(h.hotel as any).hotelAddress ? ' - ' + (h.hotel as any).hotelAddress : ''}</div>}
                </div>
              ))}
              {day.hotels.filter(h => h.type === 'checkout').map((h, i) => (
                <div key={'ho' + i} style={{ fontSize: 11, padding: '4px 0', color: '#64748b', fontFamily: ff, fontStyle: 'italic', fontWeight: 500 }}>Check-out from {h.hotel.name}</div>
              ))}
              {day.transports.map((t, i) => (
                <div key={'t' + i} className={editClass} onClick={() => edit('transport', t.id)}>
                  <TransportBlock transport={t} pc={pc} ff={ff} />
                </div>
              ))}
              {day.activities.map((a, i) => (
                <div key={'a' + i} className={editClass} onClick={() => edit('attraction', a.id)}>
                  {isVisual ? <ActivityHighlight attraction={a} pc={pc} ff={ff} onImageClick={onImageClick} /> :
                  <div className="print-card" style={{ padding: '8px 0', fontFamily: ff }}>
                    <p style={{ fontSize: 11, fontStyle: 'italic', color: '#64748b', marginBottom: 2, fontWeight: 500 }}>{activityIntro(a)}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: pc }}>{a.name}</p>
                    <p style={{ fontSize: 10, color: '#4b5563', fontWeight: 500 }}>{a.city} | {a.ticketType}{a.time ? ' | ' + a.time : ''}</p>
                    {(a as any).address && <p style={{ fontSize: 9, color: '#6b7280' }}>{(a as any).address}</p>}
                  </div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {cv.showDavening && (itin.davening || []).length > 0 && (
        <div className="print-no-break" style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Davening / Minyan" intro={sectionIntro('davening')} pc={pc} ff={ff} />
          {(itin.davening || []).map((d, i) => (
            <div key={i} className={'print-card ' + editClass} onClick={() => edit('davening', d.id)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 6, fontFamily: ff }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: pc }}>{d.location} <span style={{ fontWeight: 500, color: '#4b5563' }}>| {d.city}</span></p>
              {d.address && <p style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{d.address}</p>}
              <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 10, fontWeight: 500 }}>
                <span style={{ color: d.shachris ? pc : '#ef4444' }}>Shachris: {d.shachris || 'TBD'}</span>
                <span style={{ color: d.mincha ? pc : '#ef4444' }}>Mincha: {d.mincha || 'TBD'}</span>
                <span style={{ color: d.mariv ? pc : '#ef4444' }}>Maariv: {d.mariv || 'TBD'}</span>
              </div>
              {d.shabbos && <p style={{ fontSize: 10, marginTop: 4, color: '#92400e', fontWeight: 600 }}>Shabbos: {d.shabbos}</p>}
            </div>
          ))}
        </div>
      )}

      {cv.showMikvah && (itin.mikvah || []).length > 0 && (
        <div className="print-no-break" style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Mikvah" intro={sectionIntro('mikvah')} pc={pc} ff={ff} />
          {(itin.mikvah || []).map((m, i) => (
            <div key={i} className={'print-card ' + editClass} onClick={() => edit('mikvah', m.id)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 6, fontFamily: ff }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: pc }}>{m.name} <span style={{ fontWeight: 500, color: '#4b5563' }}>| {m.city}</span></p>
              <p style={{ fontSize: 10, color: '#4b5563', fontWeight: 500 }}>{m.address} | {m.hours || 'Contact for hours'}</p>
            </div>
          ))}
        </div>
      )}

      {cv.showInsurance && itin.insurance.length > 0 && (
        <div className="print-no-break" style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Travel Protection" intro={sectionIntro('insurance')} pc={pc} ff={ff} />
          {itin.insurance.map((ins, i) => <p key={i} style={{ fontSize: 11, color: '#4b5563', fontFamily: ff, marginBottom: 4, fontWeight: 500 }}><strong style={{ color: pc }}>{ins.provider}</strong> | {ins.coverage} | {ins.policy}</p>)}
        </div>
      )}

      {cv.showNotes && itin.notes && (
        <div className="print-no-break" style={{ padding: '16px 32px' }}>
          <div style={{ padding: 16, borderRadius: 8, background: '#fefce8', border: '1px solid #fde68a', fontFamily: ff }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#d97706', marginBottom: 4 }}>From Your Advisor</p>
            <p style={{ fontSize: 10, fontStyle: 'italic', color: '#b45309', marginBottom: 6, fontWeight: 500 }}>{sectionIntro('notes')}</p>
            <p style={{ fontSize: 11, color: '#78350f', lineHeight: 1.6, fontWeight: 500 }}>{itin.notes}</p>
          </div>
        </div>
      )}

      <FooterBlock itin={itin} agency={agencyProfile} cv={cv} pc={pc} ff={ff} />
    </div>
  );
}
