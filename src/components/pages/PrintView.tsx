'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { fmtDate, fmtTime12, nights } from '@/lib/utils';
import type { Itinerary, AgencyProfile, ClientViewSettings } from '@/lib/types';
import { DEFAULT_CLIENT_VIEW_SETTINGS } from '@/lib/types';

interface Props { itin: Itinerary; agencyProfile: AgencyProfile; onEditItem?: (section: string, id: number) => void; }
interface TLE { date: string; sk: string; type: string; title: string; sub: string; detail?: string; time?: string; city?: string; section?: string; itemId?: number; noTime?: boolean; hotelPhotos?: string[]; }

function buildTL(it: Itinerary, cv: ClientViewSettings): TLE[] {
  const e: TLE[] = [];
  if (cv.showFlights) it.flights.forEach((f) => { const d = f.departure.split('T')[0] || f.departure.split(' ')[0]; const time = f.scheduledDeparture || fmtTime12(f.departure); e.push({ date: d, sk: f.departure, type: 'Flight', title: (f.airline + ' ' + f.flightNo), sub: (f.fromCity || f.from) + ' > ' + (f.toCity || f.to), detail: [f.depTerminal ? 'Terminal ' + f.depTerminal : '', f.depGate ? 'Gate ' + f.depGate : '', f.duration, f.seatClass].filter(Boolean).join(' | '), time: time || '', noTime: !time, city: f.toCity || f.to, section: 'flight', itemId: f.id }); });
  if (cv.showHotels) it.hotels.forEach((h) => { const ci = h.checkInTime || ''; const co = h.checkOutTime || ''; let photos: string[] = []; try { if ((h as any).hotelPhotos) photos = typeof (h as any).hotelPhotos === 'string' ? JSON.parse((h as any).hotelPhotos) : (h as any).hotelPhotos; } catch {} e.push({ date: h.checkIn, sk: h.checkIn + ' ' + (ci ? '14:00' : '23:59'), type: 'Check-in', title: h.name, sub: h.city + ' | ' + h.roomType + ' | ' + h.rooms + ' room' + (h.rooms > 1 ? 's' : ''), detail: h.ref ? 'Ref: ' + h.ref : '', time: ci, noTime: !ci, city: h.city, section: 'hotel', itemId: h.id, hotelPhotos: photos }); e.push({ date: h.checkOut, sk: h.checkOut + ' ' + (co ? '11:00' : '00:01'), type: 'Check-out', title: h.name, sub: h.city, time: co, noTime: !co, city: h.city, section: 'hotel', itemId: h.id }); });
  if (cv.showTransfers) it.transport.forEach((t) => { const d = (t.pickupDateTime || '').split('T')[0] || ''; const time = t.pickupTime || fmtTime12(t.pickupDateTime) || ''; e.push({ date: d, sk: t.pickupDateTime || d, type: 'Transfer', title: t.type + (t.carType ? ' - ' + t.carType : ''), sub: t.pickup + ' > ' + t.dropoff, detail: t.provider || '', time, noTime: !time, city: t.dropoff, section: 'transport', itemId: t.id }); });
  if (cv.showActivities) it.attractions.forEach((a) => { const time = a.time || ''; e.push({ date: a.date, sk: a.date + ' ' + (a.time || '09:00'), type: 'Activity', title: a.name, sub: a.city + ' | ' + a.ticketType, time, noTime: !time, city: a.city, section: 'attraction', itemId: a.id }); });
  return e.sort((a, b) => a.sk.localeCompare(b.sk));
}

const TC: Record<string, string> = { Flight: '#1e40af', 'Check-in': '#b45309', 'Check-out': '#92400e', Transfer: '#7c3aed', Activity: '#be185d' };
const TBG: Record<string, string> = { Flight: '#dbeafe', 'Check-in': '#fef3c7', 'Check-out': '#fef3c7', Transfer: '#ede9fe', Activity: '#fce7f3' };

const FONT_MAP: Record<string, string> = {
  'serif': "'Georgia', 'Times New Roman', serif",
  'sans-serif': "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
  'modern': "'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  'elegant': "'Playfair Display', 'Georgia', serif",
  'clean': "'DM Sans', 'Inter', sans-serif",
  'mono': "'JetBrains Mono', 'Fira Code', monospace",
};

export default function PrintView({ itin, agencyProfile, onEditItem }: Props) {
  const cv = itin.clientViewSettings || DEFAULT_CLIENT_VIEW_SETTINGS;
  const tl = useMemo(() => buildTL(itin, cv), [itin, cv]);
  const days = useMemo(() => { const m = new Map<string, TLE[]>(); tl.forEach((ev) => { if (!m.has(ev.date)) m.set(ev.date, []); m.get(ev.date)!.push(ev); }); return Array.from(m.entries()); }, [tl]);
  const allDests = (itin.destinations?.length > 1) ? itin.destinations.join(' & ') : itin.destination;
  const n = nights(itin.startDate, itin.endDate);
  const vdi = cv.showDestinationInfo ? (itin.destinationInfo || []).filter((d) => d.showOnItinerary && d.description) : [];
  const logo = cv.showLogo ? agencyProfile.logo : '';
  const canEdit = !!onEditItem;
  const handleClick = (ev: TLE) => { if (onEditItem && ev.section && ev.itemId) onEditItem(ev.section, ev.itemId); };
  const pc = cv.primaryColor || '#093168';
  const ac = cv.accentColor || '#1a5298';
  const ff = FONT_MAP[cv.fontFamily] || FONT_MAP['serif'];
  const isMinimal = cv.layoutStyle === 'minimal';
  const isEditorial = cv.layoutStyle === 'editorial';
  const isBrochure = cv.layoutStyle === 'brochure';

  return (
    <div>
      <div className="no-print flex items-center justify-between px-4 py-2 mb-3 bg-white rounded-lg border" style={{ borderColor: '#D0E2FA' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8599B4' }}>Client Itinerary Preview</p>
        <div className="flex items-center gap-2">{canEdit && <p className="text-[9px]" style={{ color: '#8599B4' }}>Click items to edit</p>}<button onClick={() => window.print()} className="text-white rounded-lg px-4 py-1.5 text-[10px] font-semibold" style={{ background: pc }}>Print / PDF</button></div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-lg" style={{ fontFamily: ff }}>
        {/* HEADER - compact, not full page */}
        {cv.showOverview && (
          <div className="relative" style={{ background: isMinimal ? '#f8fafc' : `linear-gradient(135deg, ${pc} 0%, ${ac} 100%)` }}>
            {cv.coverImage && <div className="absolute inset-0" style={{ backgroundImage: 'url(' + cv.coverImage + ')', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />}
            <div className="relative px-8 py-6">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-4" style={{ justifyContent: cv.logoPosition === 'top-center' ? 'center' : cv.logoPosition === 'top-right' ? 'flex-end' : 'flex-start' }}>
                {logo ? <img src={logo} alt="" className="h-8 object-contain" style={{ maxWidth: 120, filter: isMinimal ? 'none' : 'brightness(0) invert(1)' }} /> : null}
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: isMinimal ? pc : 'rgba(255,255,255,0.7)' }}>{agencyProfile.name}</p>
              </div>
              {/* Title */}
              <h1 className="text-3xl font-bold mb-2" style={{ color: isMinimal ? pc : 'white' }}>{itin.title}</h1>
              <p className="text-sm mb-4" style={{ color: isMinimal ? '#64748b' : 'rgba(255,255,255,0.6)' }}>{allDests} | {fmtDate(itin.startDate)} - {fmtDate(itin.endDate)}</p>
              {/* Stats row */}
              <div className="flex gap-6">
                {[{ v: n, l: 'Nights' }, { v: itin.passengers, l: 'Travelers' }, { v: itin.flights.length, l: 'Flights' }, { v: itin.hotels.length, l: 'Hotels' }].map(s => (
                  <div key={s.l} className="text-center">
                    <p className="text-xl font-bold" style={{ color: isMinimal ? pc : 'white' }}>{s.v}</p>
                    <p className="text-[8px] uppercase tracking-widest" style={{ color: isMinimal ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>{s.l}</p>
                  </div>
                ))}
              </div>
              {/* Prepared for */}
              <div className="flex justify-between items-end mt-4 pt-4" style={{ borderTop: isMinimal ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)' }}>
                <div><p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: isMinimal ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>Prepared for</p><p className="text-lg font-bold" style={{ color: isMinimal ? pc : 'white' }}>{itin.client}</p></div>
                <div className="text-right"><p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: isMinimal ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>Travel Advisor</p><p className="text-sm font-semibold" style={{ color: isMinimal ? pc : 'white' }}>{itin.agent}</p><p className="text-[10px]" style={{ color: isMinimal ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>{agencyProfile.phone}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* Passengers */}
        {cv.showPassengers && itin.passengerList.length > 0 && <div className="px-8 py-4" style={{ borderBottom: '1px solid #e2e8f0' }}><p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#8599B4' }}>Travel Party</p><div className="flex flex-wrap gap-1.5">{itin.passengerList.map((p, i) => (<span key={i} className="px-2.5 py-1 rounded text-xs" style={{ background: '#f0f5ff', color: pc }}>{p.name}</span>))}</div></div>}

        {/* Destination Info */}
        {vdi.length > 0 && <div className="px-8 py-4" style={{ borderBottom: '1px solid #e2e8f0' }}><h2 className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: pc }}>About Your Destinations</h2>{vdi.map((di, i) => (<div key={i} className="mb-3 last:mb-0"><h3 className="text-sm font-bold mb-0.5" style={{ color: pc }}>{di.name}</h3><p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{di.description}</p></div>))}</div>}

        {/* Day-by-day timeline */}
        {days.map(([date, events], dayIdx) => {
          const dayNum = dayIdx + 1; const dateObj = new Date(date + 'T12:00');
          const cities: string[] = []; events.forEach((ev) => { if (ev.city && !cities.includes(ev.city)) cities.push(ev.city); });
          return (<div key={date}>
            <div className="px-8 py-2 flex items-center gap-3" style={{ background: isMinimal ? '#f1f5f9' : (isEditorial ? (dayIdx % 2 === 0 ? pc : ac) : pc) }}>
              <span className="text-sm font-bold" style={{ color: isMinimal ? pc : 'white' }}>Day {dayNum}</span>
              <span className="text-xs" style={{ color: isMinimal ? '#64748b' : 'rgba(255,255,255,0.7)' }}>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              {cities.length > 0 && <span className="text-[10px] ml-auto" style={{ color: isMinimal ? '#94a3b8' : 'rgba(255,255,255,0.5)' }}>{cities.join(', ')}</span>}
            </div>
            <div className="px-8 py-2">{events.map((ev, i) => { const color = TC[ev.type] || pc; const bg = TBG[ev.type] || '#f0f5ff'; const cl = canEdit && ev.section && ev.itemId; return (<div key={i}>
              <div onClick={() => cl && handleClick(ev)} className={'flex gap-2.5 py-1.5 rounded-lg px-1.5 -mx-1.5 ' + (cl ? 'cursor-pointer hover:bg-blue-50/50 group' : '')}>
                <div className="flex-shrink-0 w-14 pt-0.5 text-right">{ev.noTime ? <p className="text-[8px] italic no-print" style={{ color: '#ef4444' }}>No time</p> : ev.time && <p className="text-[10px] font-bold" style={{ color: pc }}>{ev.time}</p>}<span className="inline-block mt-0.5 text-[6px] font-bold uppercase tracking-wider px-1 py-0.5 rounded" style={{ background: bg, color }}>{ev.type}</span></div>
                <div className="flex-shrink-0 flex flex-col items-center pt-1"><div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{i < events.length - 1 && <div className="w-px flex-1 mt-0.5" style={{ background: '#e2e8f0' }} />}</div>
                <div className="flex-1 pb-0.5"><p className="font-bold text-[11px]" style={{ color: pc }}>{ev.title}{cl ? '' : ''}</p><p className="text-[10px]" style={{ color: '#64748b' }}>{ev.sub}</p>{ev.detail && <p className="text-[9px]" style={{ color: '#94a3b8' }}>{ev.detail}</p>}</div>
              </div>
              {ev.type === 'Check-in' && ev.hotelPhotos && ev.hotelPhotos.length > 0 && (<div className="ml-[70px] mb-2 flex gap-1.5">{ev.hotelPhotos.slice(0, 3).map((url, pi) => (<img key={pi} src={url} alt="" className="w-20 h-14 rounded object-cover" style={{ border: '1px solid #e2e8f0' }} />))}</div>)}
            </div>); })}</div>
          </div>);
        })}

        {/* Davening */}
        {cv.showDavening && (itin.davening || []).length > 0 && <div className="px-8 py-4" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}><h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: pc }}>Davening / Minyan</h2>{(itin.davening || []).map((d, i) => (<div key={i} onClick={() => onEditItem?.('davening', d.id)} className={'p-2 rounded bg-white mb-1.5 ' + (canEdit ? 'cursor-pointer hover:bg-blue-50/50' : '')} style={{ border: '1px solid #e2e8f0' }}><p className="font-bold text-[10px]" style={{ color: pc }}>{d.location} <span className="font-normal" style={{ color: '#64748b' }}>| {d.city}</span></p><div className="flex gap-4 mt-1 text-[9px]">{[['Shachris', d.shachris], ['Mincha', d.mincha], ['Maariv', d.mariv]].map(([l, v]) => (<span key={l as string} style={{ color: v ? pc : '#ef4444' }}><strong>{l}:</strong> {(v as string) || 'TBD'}</span>))}</div>{d.shabbos && <p className="text-[9px] mt-1" style={{ color: '#92400e' }}>Shabbos: {d.shabbos}</p>}</div>))}</div>}

        {/* Mikvah */}
        {cv.showMikvah && (itin.mikvah || []).length > 0 && <div className="px-8 py-4" style={{ borderTop: '1px solid #e2e8f0' }}><h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: pc }}>Mikvah</h2>{(itin.mikvah || []).map((m, i) => (<div key={i} onClick={() => onEditItem?.('mikvah', m.id)} className={'p-2 rounded bg-white mb-1.5 ' + (canEdit ? 'cursor-pointer hover:bg-blue-50/50' : '')} style={{ border: '1px solid #e2e8f0' }}><p className="font-bold text-[10px]" style={{ color: pc }}>{m.name} <span className="font-normal" style={{ color: '#64748b' }}>| {m.city}</span></p><p className="text-[9px]" style={{ color: '#94a3b8' }}>{m.address} | {m.hours || 'Contact for hours'}</p></div>))}</div>}

        {/* Insurance */}
        {cv.showInsurance && itin.insurance.length > 0 && <div className="px-8 py-4" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}><h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: pc }}>Insurance</h2>{itin.insurance.map((ins, i) => (<p key={i} className="text-[10px] mb-1" style={{ color: '#4b5563' }}><strong style={{ color: pc }}>{ins.provider}</strong> | {ins.coverage} | {ins.policy}</p>))}</div>}

        {/* Notes */}
        {cv.showNotes && itin.notes && <div className="px-8 py-4" style={{ borderTop: '1px solid #e2e8f0' }}><div className="p-3 rounded" style={{ background: '#fefce8', border: '1px solid #fde68a' }}><p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#d97706' }}>Notes</p><p className="text-[10px] leading-relaxed" style={{ color: '#78350f' }}>{itin.notes}</p></div></div>}

        {/* Footer */}
        {cv.showContactInfo && <div className="px-8 py-3 flex items-center justify-between" style={{ background: '#f0f5ff', borderTop: '1px solid #D0E2FA' }}><div className="text-[9px]"><span className="font-semibold" style={{ color: pc }}>{agencyProfile.name}</span> <span style={{ color: '#64748b' }}>{agencyProfile.phone}</span></div><div className="text-[9px]" style={{ color: '#64748b' }}>{itin.agent} | {agencyProfile.email}</div></div>}
        <div className="px-8 py-3 flex items-center justify-between" style={{ background: pc }}>{logo ? <img src={logo} alt="" className="h-5 object-contain brightness-0 invert" /> : <span className="text-[10px] font-bold text-white tracking-wider">{agencyProfile.name.toUpperCase()}</span>}<p className="text-[8px] text-white/30">Prepared for {itin.client}</p></div>
      </div>
    </div>
  );
}
