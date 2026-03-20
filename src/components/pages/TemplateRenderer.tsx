'use client';

import { useMemo } from 'react';
import { fmtDate, nights } from '@/lib/utils';
import { sectionIntro, activityIntro, flightIntro, hotelCheckInIntro, transferIntro } from '@/lib/hospitality-copy';
import { CoverFullHero, CoverSplitHero, CoverMinimal, DestinationSpotlight, HotelShowcaseCard, FlightJourneyCard, TransportBlock, ActivityHighlight, DayHeader, SectionDivider, FooterBlock } from './TemplateBlocks';
import { getDestinationImage, getCityImage, getHotelImage, getFlightImage } from '@/lib/destination-images';
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

interface DayData { date: string; flights: Flight[]; hotels: { hotel: Hotel; type: 'checkin' | 'checkout' }[]; transports: Transport[]; activities: Attraction[]; }

function buildDays(itin: Itinerary, cv: ClientViewSettings): DayData[] {
  const dayMap = new Map<string, DayData>();
  const getDay = (d: string) => { if (!d) return null; const key = d.split('T')[0]; if (!dayMap.has(key)) dayMap.set(key, { date: key, flights: [], hotels: [], transports: [], activities: [] }); return dayMap.get(key)!; };
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
  const canEdit = !!onEditItem;
  const edit = (section: string, id: number) => { if (onEditItem) onEditItem(section, id); };
  const ec = canEdit ? 'editable-item' : '';

  // Layout flags
  const isVisual = tpl === 'editorial' || tpl === 'brochure' || tpl === 'luxury' || tpl === 'gallery' || tpl === 'spotlight';
  const showFlightImages = tpl === 'brochure' || tpl === 'gallery' || tpl === 'spotlight';
  const isLuxury = tpl === 'luxury';
  const isGallery = tpl === 'gallery';
  const isTimeline = tpl === 'timeline';
  const isSpotlight = tpl === 'spotlight';

  // Cover selection
  const Cover = tpl === 'minimal' ? CoverMinimal : (tpl === 'editorial' || tpl === 'brochure') ? CoverSplitHero : CoverFullHero;
  const dayStyle = tpl === 'editorial' || tpl === 'luxury' ? 'editorial' : tpl === 'brochure' || tpl === 'gallery' ? 'magazine' : tpl === 'minimal' || tpl === 'timeline' ? 'minimal' : tpl === 'spotlight' ? 'editorial' : 'classic';

  // Dark bg for luxury
  const bgColor = isLuxury ? '#0a0a0a' : 'white';
  const textColor = isLuxury ? '#e5e5e5' : '#4b5563';
  const mutedColor = isLuxury ? '#a3a3a3' : '#64748b';
  const borderColor = isLuxury ? '#262626' : '#e2e8f0';

  return (
    <div style={{ background: bgColor, overflow: 'hidden', fontFamily: ff }}>
      {/* COVER */}
      {cv.showOverview && <Cover {...bp} />}

      {/* WELCOME */}
      {cv.showOverview && (
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${borderColor}` }}>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: mutedColor, lineHeight: 1.7, fontWeight: 500 }}>{sectionIntro('overview', itin.client)}</p>
        </div>
      )}

      {/* PASSENGERS */}
      {cv.showPassengers && itin.passengerList.length > 0 && (
        <div className="print-no-break" style={{ padding: '16px 32px', borderBottom: `1px solid ${borderColor}` }}>
          <p style={{ fontSize: 10, fontStyle: 'italic', color: mutedColor, marginBottom: 8, fontWeight: 500 }}>{sectionIntro('passengers')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{itin.passengerList.map((p, i) => <span key={i} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: isLuxury ? '#1c1917' : '#f0f5ff', color: isLuxury ? ac : pc, border: isLuxury ? `1px solid ${ac}` : 'none' }}>{p.name}</span>)}</div>
        </div>
      )}

      {/* DESTINATIONS */}
      {vdi.length > 0 && (
        <div>
          <SectionDivider title="Your Destinations" intro={undefined} pc={isLuxury ? ac : pc} ff={ff} />
          {vdi.map((di, i) => <DestinationSpotlight key={i} name={di.name} description={di.description} pc={isLuxury ? ac : pc} ff={ff} onImageClick={onImageClick} />)}
        </div>
      )}

      {/* GALLERY: Full-width destination images between sections */}
      {isGallery && vdi.length === 0 && cv.showOverview && (
        <div style={{ height: 200, background: `url(${getCityImage(itin.destination)}) center/cover no-repeat`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5))', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{itin.destination}</p>
          </div>
        </div>
      )}

      {/* HOTELS SHOWCASE (visual layouts show before timeline) */}
      {isVisual && cv.showHotels && itin.hotels.length > 0 && (
        <div style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Your Accommodations" intro={sectionIntro('hotels')} pc={isLuxury ? ac : pc} ff={ff} />
          {itin.hotels.map((h, i) => (
            <div key={i} className={ec} onClick={() => edit('hotel', h.id)}>
              <HotelShowcaseCard hotel={h} pc={isLuxury ? ac : pc} ff={ff} onImageClick={onImageClick} />
            </div>
          ))}
        </div>
      )}

      {/* FLIGHTS SHOWCASE (visual layouts show before timeline) */}
      {isVisual && cv.showFlights && itin.flights.length > 0 && (
        <div style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Your Flights" intro={sectionIntro('flights')} pc={isLuxury ? ac : pc} ff={ff} />
          {itin.flights.map((f, i) => (
            <div key={i} className={ec} onClick={() => edit('flight', f.id)}>
              <FlightJourneyCard flight={f} pc={isLuxury ? ac : pc} ff={ff} showImage={showFlightImages} onImageClick={onImageClick} />
            </div>
          ))}
        </div>
      )}

      {/* DAY-BY-DAY */}
      {days.map((day, dayIdx) => {
        const cities: string[] = [];
        day.flights.forEach(f => { if (f.toCity && !cities.includes(f.toCity)) cities.push(f.toCity); });
        day.hotels.forEach(h => { if (h.hotel.city && !cities.includes(h.hotel.city)) cities.push(h.hotel.city); });
        day.activities.forEach(a => { if (a.city && !cities.includes(a.city)) cities.push(a.city); });
        const totalEvents = day.flights.length + day.hotels.length + day.transports.length + day.activities.length;
        const dateObj = new Date(day.date + 'T12:00');

        return (
          <div key={day.date} className="print-day-block">
            {/* TIMELINE layout: special vertical line day header */}
            {isTimeline ? (
              <div style={{ padding: '16px 32px 0', display: 'flex', gap: 16, fontFamily: ff }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: pc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 800 }}>{dayIdx + 1}</div>
                  <div style={{ width: 2, flex: 1, background: `linear-gradient(${pc}, ${ac})`, marginTop: 4 }} />
                </div>
                <div style={{ flex: 1, paddingBottom: 8 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: pc }}>Day {dayIdx + 1}</p>
                  <p style={{ fontSize: 11, color: mutedColor, fontWeight: 500 }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}{cities.length > 0 ? ' - ' + cities.join(', ') : ''}</p>
                </div>
              </div>
            ) : isSpotlight ? (
              /* SPOTLIGHT: Large bold day banner with city image */
              <div style={{ position: 'relative', minHeight: 100, background: cities[0] ? `linear-gradient(90deg, ${pc}ee, transparent), url(${getCityImage(cities[0])}) center/cover` : pc, display: 'flex', alignItems: 'center', padding: '0 32px', marginTop: 16, fontFamily: ff }}>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>Day {dayIdx + 1}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  {cities.length > 0 && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{cities.join(', ')}</p>}
                </div>
              </div>
            ) : (
              <DayHeader dayNum={dayIdx + 1} date={day.date} cities={cities} eventCount={totalEvents} pc={isLuxury ? ac : pc} ac={ac} ff={ff} style={dayStyle as any} />
            )}

            {/* Day content */}
            <div style={{ padding: isTimeline ? '0 32px 16px 88px' : '8px 32px 16px' }}>
              {/* Flights (inline for non-visual layouts) */}
              {!isVisual && day.flights.map((f, i) => (
                <div key={'f' + i} className={ec} onClick={() => edit('flight', f.id)}>
                  <FlightJourneyCard flight={f} pc={isLuxury ? ac : pc} ff={ff} showImage={showFlightImages} />
                </div>
              ))}
              {/* Hotel check-ins */}
              {day.hotels.filter(h => h.type === 'checkin').map((h, i) => (
                <div key={'hi' + i} className={ec} onClick={() => edit('hotel', h.hotel.id)}>
                  {!isVisual ? <HotelShowcaseCard hotel={h.hotel} pc={isLuxury ? ac : pc} ff={ff} onImageClick={onImageClick} /> :
                  <div style={{ fontSize: 11, padding: '6px 0', color: textColor, fontFamily: ff, fontWeight: 600 }}><strong style={{ color: isLuxury ? ac : pc }}>Check-in:</strong> {h.hotel.name}, {h.hotel.city}{(h.hotel as any).hotelAddress ? ' - ' + (h.hotel as any).hotelAddress : ''}</div>}
                </div>
              ))}
              {day.hotels.filter(h => h.type === 'checkout').map((h, i) => (
                <div key={'ho' + i} style={{ fontSize: 11, padding: '4px 0', color: mutedColor, fontFamily: ff, fontStyle: 'italic', fontWeight: 500 }}>Check-out from {h.hotel.name}</div>
              ))}
              {/* Transports */}
              {day.transports.map((t, i) => (
                <div key={'t' + i} className={ec} onClick={() => edit('transport', t.id)}>
                  <TransportBlock transport={t} pc={isLuxury ? ac : pc} ff={ff} />
                </div>
              ))}
              {/* Activities */}
              {day.activities.map((a, i) => (
                <div key={'a' + i} className={ec} onClick={() => edit('attraction', a.id)}>
                  {isVisual ? <ActivityHighlight attraction={a} pc={isLuxury ? ac : pc} ff={ff} onImageClick={onImageClick} /> :
                  <div className="print-card" style={{ padding: '8px 0', fontFamily: ff }}>
                    <p style={{ fontSize: 11, fontStyle: 'italic', color: mutedColor, marginBottom: 2, fontWeight: 500 }}>{activityIntro(a)}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: isLuxury ? ac : pc }}>{a.name}</p>
                    <p style={{ fontSize: 10, color: textColor, fontWeight: 500 }}>{a.city} | {a.ticketType}{a.time ? ' | ' + a.time : ''}</p>
                    {(a as any).address && <p style={{ fontSize: 9, color: mutedColor }}>{(a as any).address}</p>}
                  </div>}
                </div>
              ))}

              {/* GALLERY: City image between days */}
              {isGallery && cities[0] && dayIdx < days.length - 1 && (
                <div style={{ height: 120, borderRadius: 8, background: `url(${getCityImage(cities[0])}) center/cover no-repeat`, marginTop: 12, opacity: 0.8 }} />
              )}
            </div>
          </div>
        );
      })}

      {/* DAVENING */}
      {cv.showDavening && (itin.davening || []).length > 0 && (
        <div className="print-no-break" style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Davening / Minyan" intro={sectionIntro('davening')} pc={isLuxury ? ac : pc} ff={ff} />
          {(itin.davening || []).map((d, i) => (
            <div key={i} className={'print-card ' + ec} onClick={() => edit('davening', d.id)} style={{ padding: '8px 16px', background: isLuxury ? '#1c1917' : 'white', border: `1px solid ${borderColor}`, borderRadius: 6, marginBottom: 6, fontFamily: ff }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: isLuxury ? ac : pc }}>{d.location} <span style={{ fontWeight: 500, color: textColor }}>| {d.city}</span></p>
              {d.address && <p style={{ fontSize: 9, color: mutedColor, marginTop: 2 }}>{d.address}</p>}
              <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 10, fontWeight: 500 }}>
                <span style={{ color: d.shachris ? (isLuxury ? ac : pc) : '#ef4444' }}>Shachris: {d.shachris || 'TBD'}</span>
                <span style={{ color: d.mincha ? (isLuxury ? ac : pc) : '#ef4444' }}>Mincha: {d.mincha || 'TBD'}</span>
                <span style={{ color: d.mariv ? (isLuxury ? ac : pc) : '#ef4444' }}>Maariv: {d.mariv || 'TBD'}</span>
              </div>
              {d.shabbos && <p style={{ fontSize: 10, marginTop: 4, color: '#92400e', fontWeight: 600 }}>Shabbos: {d.shabbos}</p>}
            </div>
          ))}
        </div>
      )}

      {/* MIKVAH */}
      {cv.showMikvah && (itin.mikvah || []).length > 0 && (
        <div className="print-no-break" style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Mikvah" intro={sectionIntro('mikvah')} pc={isLuxury ? ac : pc} ff={ff} />
          {(itin.mikvah || []).map((m, i) => (
            <div key={i} className={'print-card ' + ec} onClick={() => edit('mikvah', m.id)} style={{ padding: '8px 16px', background: isLuxury ? '#1c1917' : 'white', border: `1px solid ${borderColor}`, borderRadius: 6, marginBottom: 6, fontFamily: ff }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: isLuxury ? ac : pc }}>{m.name} <span style={{ fontWeight: 500, color: textColor }}>| {m.city}</span></p>
              <p style={{ fontSize: 10, color: textColor, fontWeight: 500 }}>{m.address} | {m.hours || 'Contact for hours'}</p>
            </div>
          ))}
        </div>
      )}

      {/* INSURANCE */}
      {cv.showInsurance && itin.insurance.length > 0 && (
        <div className="print-no-break" style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Travel Protection" intro={sectionIntro('insurance')} pc={isLuxury ? ac : pc} ff={ff} />
          {itin.insurance.map((ins, i) => <p key={i} style={{ fontSize: 11, color: textColor, fontFamily: ff, marginBottom: 4, fontWeight: 500 }}><strong style={{ color: isLuxury ? ac : pc }}>{ins.provider}</strong> | {ins.coverage} | {ins.policy}</p>)}
        </div>
      )}

      {/* NOTES */}
      {cv.showNotes && itin.notes && (
        <div className="print-no-break" style={{ padding: '16px 32px' }}>
          <div style={{ padding: 16, borderRadius: 8, background: isLuxury ? '#1c1917' : '#fefce8', border: `1px solid ${isLuxury ? '#44403c' : '#fde68a'}`, fontFamily: ff }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: isLuxury ? ac : '#d97706', marginBottom: 4 }}>From Your Advisor</p>
            <p style={{ fontSize: 10, fontStyle: 'italic', color: isLuxury ? '#a3a3a3' : '#b45309', marginBottom: 6, fontWeight: 500 }}>{sectionIntro('notes')}</p>
            <p style={{ fontSize: 11, color: isLuxury ? '#e5e5e5' : '#78350f', lineHeight: 1.6, fontWeight: 500 }}>{itin.notes}</p>
          </div>
        </div>
      )}

      <FooterBlock itin={itin} agency={agencyProfile} cv={cv} pc={isLuxury ? ac : pc} ff={ff} />
    </div>
  );
}
