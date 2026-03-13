'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { fmtDate, fmtTime12, nights } from '@/lib/utils';
import type { Itinerary, AgencyProfile } from '@/lib/types';

interface Props { itin: Itinerary; agencyProfile: AgencyProfile; onEditItem?: (section: string, id: number) => void; }
interface TLE { date: string; sk: string; type: string; title: string; sub: string; detail?: string; time?: string; city?: string; section?: string; itemId?: number; }

function buildTL(it: Itinerary): TLE[] {
  const e: TLE[] = [];
  it.flights.forEach((f) => { const d = f.departure.split('T')[0] || f.departure.split(' ')[0]; e.push({ date: d, sk: f.departure, type: 'Flight', title: `${f.airline} ${f.flightNo}`, sub: `${f.fromCity || f.from} \u2192 ${f.toCity || f.to}`, detail: [f.depTerminal ? `Terminal ${f.depTerminal}` : '', f.depGate ? `Gate ${f.depGate}` : '', f.duration, f.seatClass].filter(Boolean).join(' \u00b7 '), time: f.scheduledDeparture || fmtTime12(f.departure), city: f.toCity || f.to, section: 'flight', itemId: f.id }); });
  it.hotels.forEach((h) => { e.push({ date: h.checkIn, sk: h.checkIn + ' 14:00', type: 'Check-in', title: h.name, sub: `${h.city} \u00b7 ${h.roomType} \u00b7 ${h.rooms} room${h.rooms > 1 ? 's' : ''}`, detail: h.ref ? `Ref: ${h.ref}` : '', time: '2:00 PM', city: h.city, section: 'hotel', itemId: h.id }); e.push({ date: h.checkOut, sk: h.checkOut + ' 11:00', type: 'Check-out', title: h.name, sub: h.city, time: '11:00 AM', city: h.city, section: 'hotel', itemId: h.id }); });
  it.transport.forEach((t) => { const d = t.pickupDateTime.split('T')[0] || t.pickupDateTime.split(' ')[0]; e.push({ date: d, sk: t.pickupDateTime, type: 'Transfer', title: `${t.type}${t.carType ? ' \u2014 ' + t.carType : ''}`, sub: `${t.pickup} \u2192 ${t.dropoff}`, detail: t.provider || '', time: fmtTime12(t.pickupDateTime), city: t.dropoff, section: 'transport', itemId: t.id }); });
  it.attractions.forEach((a) => { e.push({ date: a.date, sk: a.date + ' ' + (a.time || '09:00'), type: 'Activity', title: a.name, sub: `${a.city} \u00b7 ${a.ticketType}`, time: a.time ? fmtTime12(a.date + 'T' + a.time) : '', city: a.city, section: 'attraction', itemId: a.id }); });
  return e.sort((a, b) => a.sk.localeCompare(b.sk));
}

const TC: Record<string, string> = { Flight: '#1e40af', 'Check-in': '#b45309', 'Check-out': '#92400e', Transfer: '#7c3aed', Activity: '#be185d' };
const TBG: Record<string, string> = { Flight: '#dbeafe', 'Check-in': '#fef3c7', 'Check-out': '#fef3c7', Transfer: '#ede9fe', Activity: '#fce7f3' };

export default function PrintView({ itin, agencyProfile, onEditItem }: Props) {
  const tl = useMemo(() => buildTL(itin), [itin]);
  const days = useMemo(() => { const m = new Map<string, TLE[]>(); tl.forEach((ev) => { if (!m.has(ev.date)) m.set(ev.date, []); m.get(ev.date)!.push(ev); }); return Array.from(m.entries()); }, [tl]);
  const allDests = (itin.destinations?.length > 1) ? itin.destinations.join(' & ') : itin.destination;
  const n = nights(itin.startDate, itin.endDate);
  const vdi = (itin.destinationInfo || []).filter((d) => d.showOnItinerary && d.description);
  const logo = agencyProfile.logo;
  const canEdit = !!onEditItem;

  const handleClick = (ev: TLE) => { if (onEditItem && ev.section && ev.itemId) onEditItem(ev.section, ev.itemId); };

  return (
    <div>
      <div className="no-print flex items-center justify-between px-6 py-3 mb-4 bg-white rounded-xl border shadow-sm" style={{ borderColor: '#D0E2FA' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8599B4' }}>Client Itinerary Preview</p>
        <div className="flex items-center gap-3">
          {canEdit && <p className="text-xs" style={{ color: '#8599B4' }}>Click any item to edit</p>}
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:opacity-90 shadow-md" style={{ background: '#093168' }}>Print / Export PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-lg" style={{ fontFamily: "'Georgia', serif" }}>

        {/* PAGE 1: COVER */}
        <div className="relative flex flex-col" style={{ minHeight: '100vh', pageBreakAfter: 'always', background: 'linear-gradient(160deg, #071e45 0%, #0a3270 35%, #143F77 65%, #1a5298 100%)' }}>
          <div className="absolute inset-0" style={{ opacity: 0.06, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
          <div className="relative px-12 pt-10 pb-4 flex items-center gap-4">{logo ? <img src={logo} alt="" className="h-12 object-contain" style={{ maxWidth: 160 }} /> : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>{agencyProfile.name.charAt(0)}</div>}<div><p className="text-sm font-semibold tracking-[0.3em] uppercase text-white/80">{agencyProfile.name}</p><p className="text-xs text-white/40 mt-0.5">{agencyProfile.address}</p></div></div>
          <div className="relative flex-1 flex items-center px-12"><div className="max-w-2xl"><div className="w-16 h-1 rounded-full mb-8" style={{ background: 'rgba(208,226,250,0.4)' }} /><h1 className="text-6xl font-bold text-white leading-[1.1] mb-6" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>{itin.title}</h1><div className="flex items-center gap-4 text-lg text-white/70 flex-wrap"><span>{allDests}</span><span className="text-white/30">|</span><span>{fmtDate(itin.startDate)} &ndash; {fmtDate(itin.endDate)}</span></div><div className="flex items-center gap-6 mt-6">{[{ v: n, l: 'Nights' }, { v: itin.passengers, l: 'Travelers' }, { v: itin.flights.length, l: 'Flights' }, { v: itin.hotels.length, l: 'Hotels' }].map((s) => (<div key={s.l} className="text-center"><p className="text-3xl font-bold text-white">{s.v}</p><p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">{s.l}</p></div>))}</div></div></div>
          <div className="relative px-12 pb-10 pt-6"><div className="flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">Prepared for</p><p className="text-3xl font-bold text-white">{itin.client}</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">Your Travel Advisor</p><p className="text-xl font-semibold text-white">{itin.agent}</p><p className="text-sm text-white/40 mt-1">{agencyProfile.phone} &middot; {agencyProfile.email}</p></div></div></div>
        </div>

        {/* PAGE 2+: CONTENT */}
        {itin.passengerList.length > 0 && <div className="px-10 py-5" style={{ borderBottom: '1px solid #e2e8f0' }}><p className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: '#8599B4' }}>Travel Party</p><div className="flex flex-wrap gap-2">{itin.passengerList.map((p, i) => (<span key={i} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: '#f0f5ff', color: '#093168' }}>{p.name}</span>))}</div></div>}

        {vdi.length > 0 && <div className="px-10 py-5" style={{ borderBottom: '1px solid #e2e8f0' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: '#093168' }}>About Your Destinations</h2>{vdi.map((di, i) => (<div key={i} className="mb-4 last:mb-0"><h3 className="text-base font-bold mb-1" style={{ color: '#093168' }}>{di.name}</h3><div className="w-8 h-0.5 mb-2" style={{ background: '#D0E2FA' }} /><p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>{di.description}</p></div>))}</div>}

        {/* Day by Day — clickable items */}
        {days.map(([date, events], dayIdx) => {
          const dayNum = dayIdx + 1;
          const dateObj = new Date(date + 'T12:00');
          const cities: string[] = []; events.forEach((ev) => { if (ev.city && !cities.includes(ev.city)) cities.push(ev.city); });
          return (
            <div key={date}>
              <div className="px-10 py-3 flex items-center gap-4" style={{ background: dayIdx % 2 === 0 ? '#093168' : '#143F77' }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}><span className="text-lg font-bold text-white leading-none">{dayNum}</span><span className="text-[7px] uppercase text-white/50">Day</span></div>
                <div className="text-white"><p className="text-base font-bold leading-tight">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}, {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>{cities.length > 0 && <p className="text-[11px] opacity-50">{cities.join(', ')}</p>}</div>
              </div>
              <div className="px-10 py-3">
                {events.map((ev, i) => {
                  const color = TC[ev.type] || '#143F77';
                  const bg = TBG[ev.type] || '#f0f5ff';
                  const clickable = canEdit && ev.section && ev.itemId;
                  return (
                    <div key={i} onClick={() => clickable && handleClick(ev)} className={`flex gap-3 mb-2 last:mb-0 rounded-lg px-2 py-1.5 -mx-2 transition-all ${clickable ? 'cursor-pointer hover:bg-blue-50/50 no-print-hover group' : ''}`}>
                      <div className="flex-shrink-0 w-16 pt-0.5 text-right">{ev.time && <p className="text-xs font-bold" style={{ color: '#093168' }}>{ev.time}</p>}<span className="inline-block mt-0.5 text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded" style={{ background: bg, color }}>{ev.type}</span></div>
                      <div className="flex flex-col items-center flex-shrink-0 pt-1"><div className="w-2 h-2 rounded-full border-[1.5px]" style={{ borderColor: color, background: 'white' }} />{i < events.length - 1 && <div className="w-px flex-1 mt-0.5" style={{ background: '#e2e8f0' }} />}</div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2"><p className="font-bold text-xs" style={{ color: '#093168' }}>{ev.title}</p>{clickable && <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity"><Icon n="edit" c="w-3 h-3" /></span>}</div>
                        <p className="text-[11px]" style={{ color: '#64748b' }}>{ev.sub}</p>{ev.detail && <p className="text-[10px]" style={{ color: '#94a3b8' }}>{ev.detail}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Davening — clickable */}
        {(itin.davening || []).length > 0 && <div className="px-10 py-5" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#093168' }}>Davening / Minyan</h2>{(itin.davening || []).map((d, i) => (<div key={i} onClick={() => onEditItem?.('davening', d.id)} className={`p-3 rounded-lg bg-white mb-2 ${canEdit ? 'cursor-pointer hover:bg-blue-50/50 group' : ''}`} style={{ border: '1px solid #e2e8f0' }}><div className="flex items-center justify-between"><p className="font-bold text-xs" style={{ color: '#093168' }}>{d.location} <span className="font-normal" style={{ color: '#64748b' }}>&middot; {d.city} &middot; {d.type}</span></p>{canEdit && <span className="no-print opacity-0 group-hover:opacity-100"><Icon n="edit" c="w-3 h-3" /></span>}</div><div className="grid grid-cols-3 gap-2 mt-2">{[['Shachris', d.shachris], ['Mincha', d.mincha], ['Maariv', d.mariv]].map(([l, v]) => (<div key={l} className="text-center p-1.5 rounded" style={{ background: '#f0f5ff' }}><p className="text-[8px] uppercase tracking-wider font-bold" style={{ color: '#8599B4' }}>{l}</p><p className="text-[11px] font-bold" style={{ color: '#093168' }}>{v || '\u2014'}</p></div>))}</div>{d.shabbos && <p className="text-[11px] mt-2 p-1.5 rounded" style={{ background: '#fefce8', color: '#92400e' }}><strong>Shabbos:</strong> {d.shabbos}</p>}</div>))}</div>}

        {/* Mikvah — clickable */}
        {(itin.mikvah || []).length > 0 && <div className="px-10 py-5" style={{ borderTop: '1px solid #e2e8f0' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#093168' }}>Mikvah</h2>{(itin.mikvah || []).map((m, i) => (<div key={i} onClick={() => onEditItem?.('mikvah', m.id)} className={`p-3 rounded-lg bg-white mb-2 ${canEdit ? 'cursor-pointer hover:bg-blue-50/50 group' : ''}`} style={{ border: '1px solid #e2e8f0' }}><div className="flex items-center justify-between"><p className="font-bold text-xs" style={{ color: '#093168' }}>{m.name} <span className="font-normal" style={{ color: '#64748b' }}>&middot; {m.city} &middot; {m.gender}</span></p>{canEdit && <span className="no-print opacity-0 group-hover:opacity-100"><Icon n="edit" c="w-3 h-3" /></span>}</div><p className="text-[11px]" style={{ color: '#94a3b8' }}>{m.address} &middot; {m.hours || 'Contact'}</p></div>))}</div>}

        {/* Insurance — clickable */}
        {itin.insurance.length > 0 && <div className="px-10 py-5" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#093168' }}>Insurance</h2>{itin.insurance.map((ins, i) => (<div key={i} onClick={() => onEditItem?.('insurance', ins.id)} className={`p-3 rounded-lg bg-white ${canEdit ? 'cursor-pointer hover:bg-blue-50/50 group' : ''}`} style={{ border: '1px solid #e2e8f0' }}><div className="flex items-center justify-between"><p className="font-bold text-xs" style={{ color: '#093168' }}>{ins.provider} <span className="font-normal" style={{ color: '#64748b' }}>&middot; {ins.coverage} &middot; {ins.policy}</span></p>{canEdit && <span className="no-print opacity-0 group-hover:opacity-100"><Icon n="edit" c="w-3 h-3" /></span>}</div></div>))}</div>}

        {itin.notes && <div className="px-10 py-5" style={{ borderTop: '1px solid #e2e8f0' }}><div className="p-4 rounded-lg" style={{ background: '#fefce8', border: '1px solid #fde68a' }}><p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#d97706' }}>Important Notes</p><p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>{itin.notes}</p></div></div>}

        <div className="px-10 py-4" style={{ background: '#f0f5ff', borderTop: '1px solid #D0E2FA' }}><div className="grid grid-cols-2 gap-4 text-[11px]"><div><p style={{ color: '#8599B4' }}>Travel Agency</p><p className="font-semibold" style={{ color: '#093168' }}>{agencyProfile.name}</p><p style={{ color: '#64748b' }}>{agencyProfile.phone}</p></div><div><p style={{ color: '#8599B4' }}>Your Advisor</p><p className="font-semibold" style={{ color: '#093168' }}>{itin.agent}</p><p style={{ color: '#64748b' }}>{agencyProfile.email}</p></div></div></div>
        <div className="px-10 py-6 flex items-center justify-between" style={{ background: '#093168' }}><div className="flex items-center gap-3">{logo ? <img src={logo} alt="" className="h-8 object-contain brightness-0 invert" style={{ maxWidth: 120 }} /> : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>{agencyProfile.name.charAt(0)}</div>}<p className="text-sm font-bold text-white tracking-wider">{agencyProfile.name.toUpperCase()}</p></div><p className="text-[10px] text-white/30">Prepared for {itin.client}</p></div>
      </div>
    </div>
  );
}
