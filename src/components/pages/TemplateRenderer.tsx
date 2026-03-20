'use client';

import { useMemo } from 'react';
import { fmtDate, nights } from '@/lib/utils';
import { sectionIntro, activityIntro, flightIntro, hotelCheckInIntro, transferIntro } from '@/lib/hospitality-copy';
import { CoverFullHero, CoverSplitHero, CoverMinimal, DestinationSpotlight, HotelShowcaseCard, FlightJourneyCard, TransportBlock, ActivityHighlight, DayHeader, SectionDivider, FooterBlock } from './TemplateBlocks';
import { getDestinationImage, getCityImage, getHotelImage, getFlightImage } from '@/lib/destination-images';
import type { Itinerary, AgencyProfile, ClientViewSettings, Flight, Hotel, Transport, Attraction } from '@/lib/types';
import { DEFAULT_CLIENT_VIEW_SETTINGS } from '@/lib/types';

interface Props { itin: Itinerary; agencyProfile: AgencyProfile; template?: string; onImageClick?: (imageKey: string, currentUrl: string) => void; onEditItem?: (section: string, id: number) => void; }

const FM: Record<string, string> = { 'serif': "'Georgia', serif", 'sans-serif': "'Helvetica Neue', sans-serif", 'modern': "system-ui, sans-serif", 'elegant': "'Playfair Display', 'Georgia', serif", 'clean': "'DM Sans', sans-serif", 'mono': "'JetBrains Mono', monospace" };

interface DD { date: string; flights: Flight[]; hotels: { hotel: Hotel; type: 'checkin' | 'checkout' }[]; transports: Transport[]; activities: Attraction[]; }

function buildDays(itin: Itinerary, cv: ClientViewSettings): DD[] {
  const m = new Map<string, DD>();
  const g = (d: string) => { if (!d) return null; const k = d.split('T')[0]; if (!m.has(k)) m.set(k, { date: k, flights: [], hotels: [], transports: [], activities: [] }); return m.get(k)!; };
  if (cv.showFlights) itin.flights.forEach(f => { const d = g(f.departure); if (d) d.flights.push(f); });
  if (cv.showHotels) itin.hotels.forEach(h => { const ci = g(h.checkIn); if (ci) ci.hotels.push({ hotel: h, type: 'checkin' }); const co = g(h.checkOut); if (co) co.hotels.push({ hotel: h, type: 'checkout' }); });
  if (cv.showTransfers) itin.transport.forEach(t => { const d = g(t.pickupDateTime || ''); if (d) d.transports.push(t); });
  if (cv.showActivities) itin.attractions.forEach(a => { const d = g(a.date); if (d) d.activities.push(a); });
  return Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function TemplateRenderer({ itin, agencyProfile, template: tplOverride, onImageClick, onEditItem }: Props) {
  const cv = itin.clientViewSettings || DEFAULT_CLIENT_VIEW_SETTINGS;
  const tpl = tplOverride || cv.layoutStyle || 'classic';
  const pc = cv.primaryColor || '#093168';
  const ac = cv.accentColor || '#1a5298';
  const ff = FM[cv.fontFamily] || FM['serif'];
  const days = useMemo(() => buildDays(itin, cv), [itin, cv]);
  const vdi = cv.showDestinationInfo ? (itin.destinationInfo || []).filter(d => d.showOnItinerary && d.description) : [];
  const bp = { itin, agency: agencyProfile, cv, pc, ac, ff, onImageClick };
  const canEdit = !!onEditItem;
  const edit = (s: string, id: number) => { if (onEditItem) onEditItem(s, id); };
  const ec = canEdit ? 'editable-item' : '';

  // Layout classification
  const isLux = tpl === 'luxury';
  const isVis = ['editorial','brochure','luxury','gallery','spotlight','resort','postcard'].includes(tpl);
  const showFI = ['brochure','gallery','spotlight','resort'].includes(tpl);
  const isTimeline = tpl === 'timeline';
  const isPassport = tpl === 'passport';
  const isPostcard = tpl === 'postcard';
  const isResort = tpl === 'resort';
  const isGallery = tpl === 'gallery';
  const isSpotlight = tpl === 'spotlight';

  // Cover
  const Cover = tpl === 'minimal' || isPassport ? CoverMinimal : ['editorial','brochure','postcard'].includes(tpl) ? CoverSplitHero : CoverFullHero;
  const dayStyle = ['editorial','luxury','resort'].includes(tpl) ? 'editorial' : ['brochure','gallery','postcard'].includes(tpl) ? 'magazine' : ['minimal','timeline','passport'].includes(tpl) ? 'minimal' : isSpotlight ? 'editorial' : 'classic';

  // Colors
  const bg = isLux ? '#0a0a0a' : 'white';
  const tx = isLux ? '#e5e5e5' : '#4b5563';
  const mt = isLux ? '#a3a3a3' : '#64748b';
  const bd = isLux ? '#262626' : '#e2e8f0';
  const pcc = isLux ? ac : pc;

  // Passport stamp style
  const stampStyle = isPassport ? { border: `3px double ${pc}`, borderRadius: 12, padding: '12px 16px', margin: '8px 0', position: 'relative' as const } : {};

  return (
    <div style={{ background: bg, overflow: 'hidden', fontFamily: ff }}>
      {cv.showOverview && <Cover {...bp} />}

      {cv.showOverview && (
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${bd}` }}>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: mt, lineHeight: 1.7, fontWeight: 500 }}>{sectionIntro('overview', itin.client)}</p>
        </div>
      )}

      {cv.showPassengers && itin.passengerList.length > 0 && (
        <div className="print-no-break" style={{ padding: '16px 32px', borderBottom: `1px solid ${bd}` }}>
          <p style={{ fontSize: 10, fontStyle: 'italic', color: mt, marginBottom: 8, fontWeight: 500 }}>{sectionIntro('passengers')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{itin.passengerList.map((p, i) => <span key={i} style={{ padding: '4px 10px', borderRadius: isPassport ? 0 : 6, fontSize: 11, fontWeight: 600, background: isLux ? '#1c1917' : '#f0f5ff', color: pcc, border: isLux || isPassport ? `1px solid ${pcc}` : 'none', textTransform: isPassport ? 'uppercase' as const : 'none' as const, letterSpacing: isPassport ? 1 : 0 }}>{p.name}</span>)}</div>
        </div>
      )}

      {vdi.length > 0 && (
        <div>
          <SectionDivider title="Your Destinations" intro={undefined} pc={pcc} ff={ff} />
          {vdi.map((di, i) => <DestinationSpotlight key={i} name={di.name} description={di.description} pc={pcc} ff={ff} onImageClick={onImageClick} />)}
        </div>
      )}

      {isGallery && vdi.length === 0 && cv.showOverview && (
        <div style={{ height: 200, background: `url(${getCityImage(itin.destination)}) center/cover no-repeat`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5))', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{itin.destination}</p>
          </div>
        </div>
      )}

      {isVis && cv.showHotels && itin.hotels.length > 0 && (
        <div style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Your Accommodations" intro={sectionIntro('hotels')} pc={pcc} ff={ff} />
          {itin.hotels.map((h, i) => (<div key={i} className={ec} onClick={() => edit('hotel', h.id)} style={isPostcard ? { borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } : {}}><HotelShowcaseCard hotel={h} pc={pcc} ff={ff} onImageClick={onImageClick} /></div>))}
        </div>
      )}

      {isVis && cv.showFlights && itin.flights.length > 0 && (
        <div style={{ padding: '0 32px 16px' }}>
          <SectionDivider title="Your Flights" intro={sectionIntro('flights')} pc={pcc} ff={ff} />
          {itin.flights.map((f, i) => (<div key={i} className={ec} onClick={() => edit('flight', f.id)}><FlightJourneyCard flight={f} pc={pcc} ff={ff} showImage={showFI} onImageClick={onImageClick} /></div>))}
        </div>
      )}

      {days.map((day, dayIdx) => {
        const cities: string[] = [];
        day.flights.forEach(f => { if (f.toCity && !cities.includes(f.toCity)) cities.push(f.toCity); });
        day.hotels.forEach(h => { if (h.hotel.city && !cities.includes(h.hotel.city)) cities.push(h.hotel.city); });
        day.activities.forEach(a => { if (a.city && !cities.includes(a.city)) cities.push(a.city); });
        const total = day.flights.length + day.hotels.length + day.transports.length + day.activities.length;
        const dateObj = new Date(day.date + 'T12:00');

        return (
          <div key={day.date} className="print-day-block">
            {isTimeline ? (
              <div style={{ padding: '16px 32px 0', display: 'flex', gap: 16, fontFamily: ff }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: pc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 800 }}>{dayIdx + 1}</div>
                  <div style={{ width: 2, flex: 1, background: `linear-gradient(${pc}, ${ac})`, marginTop: 4 }} />
                </div>
                <div style={{ flex: 1, paddingBottom: 8 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: pc }}>Day {dayIdx + 1}</p>
                  <p style={{ fontSize: 11, color: mt, fontWeight: 500 }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}{cities.length > 0 ? ' - ' + cities.join(', ') : ''}</p>
                </div>
              </div>
            ) : isSpotlight ? (
              <div style={{ position: 'relative', minHeight: 100, background: cities[0] ? `linear-gradient(90deg, ${pc}ee, transparent), url(${getCityImage(cities[0])}) center/cover` : pc, display: 'flex', alignItems: 'center', padding: '0 32px', marginTop: 16, fontFamily: ff }}>
                <div><p style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>Day {dayIdx + 1}</p><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>{cities.length > 0 && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{cities.join(', ')}</p>}</div>
              </div>
            ) : isPassport ? (
              <div style={{ padding: '12px 32px', marginTop: 12, borderTop: `2px dashed ${pc}`, fontFamily: ff }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: pc, textTransform: 'uppercase', letterSpacing: 2 }}>DAY {dayIdx + 1}</span>
                  <span style={{ fontSize: 10, color: mt, fontWeight: 500 }}>{dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  {cities.length > 0 && <span style={{ fontSize: 9, color: pc, fontWeight: 700, border: `1px solid ${pc}`, padding: '1px 6px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{cities.join(' | ')}</span>}
                </div>
              </div>
            ) : isResort ? (
              <div style={{ fontFamily: ff, padding: '20px 32px', background: `linear-gradient(135deg, ${pc}, ${ac})`, marginTop: 16, borderRadius: '12px 12px 0 0', margin: '16px 16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: 'white', opacity: 0.3 }}>{String(dayIdx + 1).padStart(2, '0')}</span>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>{cities.length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{cities.join(' & ')}</div>}</div>
                </div>
              </div>
            ) : (
              <DayHeader dayNum={dayIdx + 1} date={day.date} cities={cities} eventCount={total} pc={pcc} ac={ac} ff={ff} style={dayStyle as any} />
            )}

            <div style={{ padding: isTimeline ? '0 32px 16px 88px' : isResort ? '8px 32px 16px' : '8px 32px 16px', ...(isResort ? { margin: '0 16px', borderLeft: `1px solid ${bd}`, borderRight: `1px solid ${bd}`, borderBottom: `1px solid ${bd}`, borderRadius: '0 0 12px 12px', marginBottom: 8 } : {}) }}>
              {!isVis && day.flights.map((f, i) => (<div key={'f' + i} className={ec} onClick={() => edit('flight', f.id)} style={stampStyle}><FlightJourneyCard flight={f} pc={pcc} ff={ff} showImage={showFI} /></div>))}
              {day.hotels.filter(h => h.type === 'checkin').map((h, i) => (<div key={'hi' + i} className={ec} onClick={() => edit('hotel', h.hotel.id)} style={isPostcard ? { borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } : stampStyle}>{!isVis ? <HotelShowcaseCard hotel={h.hotel} pc={pcc} ff={ff} onImageClick={onImageClick} /> : <div style={{ fontSize: 11, padding: '6px 0', color: tx, fontWeight: 600 }}><strong style={{ color: pcc }}>Check-in:</strong> {h.hotel.name}, {h.hotel.city}{(h.hotel as any).hotelAddress ? ' - ' + (h.hotel as any).hotelAddress : ''}</div>}</div>))}
              {day.hotels.filter(h => h.type === 'checkout').map((h, i) => (<div key={'ho' + i} style={{ fontSize: 11, padding: '4px 0', color: mt, fontStyle: 'italic', fontWeight: 500 }}>Check-out from {h.hotel.name}</div>))}
              {day.transports.map((t, i) => (<div key={'t' + i} className={ec} onClick={() => edit('transport', t.id)} style={stampStyle}><TransportBlock transport={t} pc={pcc} ff={ff} /></div>))}
              {day.activities.map((a, i) => (<div key={'a' + i} className={ec} onClick={() => edit('attraction', a.id)} style={isPostcard ? { borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 8 } : stampStyle}>{isVis ? <ActivityHighlight attraction={a} pc={pcc} ff={ff} onImageClick={onImageClick} /> : <div className="print-card" style={{ padding: '8px 0' }}><p style={{ fontSize: 11, fontStyle: 'italic', color: mt, marginBottom: 2, fontWeight: 500 }}>{activityIntro(a)}</p><p style={{ fontSize: 13, fontWeight: 700, color: pcc }}>{a.name}</p><p style={{ fontSize: 10, color: tx, fontWeight: 500 }}>{a.city} | {a.ticketType}{a.time ? ' | ' + a.time : ''}</p>{(a as any).address && <p style={{ fontSize: 9, color: mt }}>{(a as any).address}</p>}</div>}</div>))}
              {isGallery && cities[0] && dayIdx < days.length - 1 && (<div style={{ height: 120, borderRadius: 8, background: `url(${getCityImage(cities[0])}) center/cover no-repeat`, marginTop: 12, opacity: 0.8 }} />)}
            </div>
          </div>
        );
      })}

      {cv.showDavening && (itin.davening || []).length > 0 && (<div className="print-no-break" style={{ padding: '0 32px 16px' }}><SectionDivider title="Davening / Minyan" intro={sectionIntro('davening')} pc={pcc} ff={ff} />{(itin.davening || []).map((d, i) => (<div key={i} className={'print-card ' + ec} onClick={() => edit('davening', d.id)} style={{ padding: '8px 16px', background: isLux ? '#1c1917' : 'white', border: `1px solid ${bd}`, borderRadius: 6, marginBottom: 6 }}><p style={{ fontSize: 12, fontWeight: 700, color: pcc }}>{d.location} <span style={{ fontWeight: 500, color: tx }}>| {d.city}</span></p>{d.address && <p style={{ fontSize: 9, color: mt, marginTop: 2 }}>{d.address}</p>}<div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 10, fontWeight: 500 }}><span style={{ color: d.shachris ? pcc : '#ef4444' }}>Shachris: {d.shachris || 'TBD'}</span><span style={{ color: d.mincha ? pcc : '#ef4444' }}>Mincha: {d.mincha || 'TBD'}</span><span style={{ color: d.mariv ? pcc : '#ef4444' }}>Maariv: {d.mariv || 'TBD'}</span></div>{d.shabbos && <p style={{ fontSize: 10, marginTop: 4, color: '#92400e', fontWeight: 600 }}>Shabbos: {d.shabbos}</p>}</div>))}</div>)}
      {cv.showMikvah && (itin.mikvah || []).length > 0 && (<div className="print-no-break" style={{ padding: '0 32px 16px' }}><SectionDivider title="Mikvah" intro={sectionIntro('mikvah')} pc={pcc} ff={ff} />{(itin.mikvah || []).map((m, i) => (<div key={i} className={'print-card ' + ec} onClick={() => edit('mikvah', m.id)} style={{ padding: '8px 16px', background: isLux ? '#1c1917' : 'white', border: `1px solid ${bd}`, borderRadius: 6, marginBottom: 6 }}><p style={{ fontSize: 12, fontWeight: 700, color: pcc }}>{m.name} <span style={{ fontWeight: 500, color: tx }}>| {m.city}</span></p><p style={{ fontSize: 10, color: tx, fontWeight: 500 }}>{m.address} | {m.hours || 'Contact for hours'}</p></div>))}</div>)}
      {cv.showInsurance && itin.insurance.length > 0 && (<div className="print-no-break" style={{ padding: '0 32px 16px' }}><SectionDivider title="Travel Protection" intro={sectionIntro('insurance')} pc={pcc} ff={ff} />{itin.insurance.map((ins, i) => <p key={i} style={{ fontSize: 11, color: tx, marginBottom: 4, fontWeight: 500 }}><strong style={{ color: pcc }}>{ins.provider}</strong> | {ins.coverage} | {ins.policy}</p>)}</div>)}
      {cv.showNotes && itin.notes && (<div className="print-no-break" style={{ padding: '16px 32px' }}><div style={{ padding: 16, borderRadius: isPostcard ? 16 : 8, background: isLux ? '#1c1917' : '#fefce8', border: `1px solid ${isLux ? '#44403c' : '#fde68a'}` }}><p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: isLux ? ac : '#d97706', marginBottom: 4 }}>From Your Advisor</p><p style={{ fontSize: 10, fontStyle: 'italic', color: isLux ? '#a3a3a3' : '#b45309', marginBottom: 6, fontWeight: 500 }}>{sectionIntro('notes')}</p><p style={{ fontSize: 11, color: isLux ? '#e5e5e5' : '#78350f', lineHeight: 1.6, fontWeight: 500 }}>{itin.notes}</p></div></div>)}
      <FooterBlock itin={itin} agency={agencyProfile} cv={cv} pc={pcc} ff={ff} />
    </div>
  );
}
