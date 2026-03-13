'use client';

import { useMemo } from 'react';
import { fmtDate, fmtTime12, nights } from '@/lib/utils';
import type { Itinerary, AgencyProfile } from '@/lib/types';

interface PrintViewProps { itin: Itinerary; agencyProfile: AgencyProfile; }
interface TLEvent { date: string; sortKey: string; type: string; title: string; sub: string; detail?: string; time?: string; city?: string; }

function buildTL(itin: Itinerary): TLEvent[] {
  const ev: TLEvent[] = [];
  itin.flights.forEach((f) => { const d = f.departure.split('T')[0] || f.departure.split(' ')[0]; ev.push({ date: d, sortKey: f.departure, type: 'Flight', title: `${f.airline} ${f.flightNo}`, sub: `${f.fromCity || f.from} \u2192 ${f.toCity || f.to}`, detail: [f.depTerminal ? `Terminal ${f.depTerminal}` : '', f.depGate ? `Gate ${f.depGate}` : '', f.duration, f.seatClass].filter(Boolean).join(' \u00b7 '), time: f.scheduledDeparture || fmtTime12(f.departure), city: f.toCity || f.to }); });
  itin.hotels.forEach((h) => { ev.push({ date: h.checkIn, sortKey: h.checkIn + ' 14:00', type: 'Check-in', title: h.name, sub: `${h.city} \u00b7 ${h.roomType} \u00b7 ${h.rooms} room${h.rooms > 1 ? 's' : ''}`, detail: h.ref ? `Ref: ${h.ref}` : '', time: '2:00 PM', city: h.city }); ev.push({ date: h.checkOut, sortKey: h.checkOut + ' 11:00', type: 'Check-out', title: h.name, sub: h.city, time: '11:00 AM', city: h.city }); });
  itin.transport.forEach((t) => { const d = t.pickupDateTime.split('T')[0] || t.pickupDateTime.split(' ')[0]; ev.push({ date: d, sortKey: t.pickupDateTime, type: 'Transfer', title: `${t.type}${t.carType ? ' \u2014 ' + t.carType : ''}`, sub: `${t.pickup} \u2192 ${t.dropoff}`, detail: t.provider || '', time: fmtTime12(t.pickupDateTime), city: t.dropoff }); });
  itin.attractions.forEach((a) => { ev.push({ date: a.date, sortKey: a.date + ' ' + (a.time || '09:00'), type: 'Activity', title: a.name, sub: `${a.city} \u00b7 ${a.ticketType}`, time: a.time ? fmtTime12(a.date + 'T' + a.time) : '', city: a.city }); });
  return ev.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

const TC: Record<string, string> = { Flight: '#1e40af', 'Check-in': '#b45309', 'Check-out': '#b45309', Transfer: '#7c3aed', Activity: '#be185d' };
const TCbg: Record<string, string> = { Flight: '#dbeafe', 'Check-in': '#fef3c7', 'Check-out': '#fef3c7', Transfer: '#ede9fe', Activity: '#fce7f3' };

export default function PrintView({ itin, agencyProfile }: PrintViewProps) {
  const tl = useMemo(() => buildTL(itin), [itin]);
  const days = useMemo(() => { const m = new Map<string, TLEvent[]>(); tl.forEach((e) => { if (!m.has(e.date)) m.set(e.date, []); m.get(e.date)!.push(e); }); return Array.from(m.entries()); }, [tl]);
  const allDests = (itin.destinations?.length > 1) ? itin.destinations.join(', ') : itin.destination;
  const n = nights(itin.startDate, itin.endDate);
  const vdi = (itin.destinationInfo || []).filter((d) => d.showOnItinerary && d.description);
  const destImg = encodeURIComponent((itin.destinations?.[0] || itin.destination || 'travel') + ' scenic landscape');

  return (
    <div>
      <div className="no-print flex items-center justify-between px-6 py-3 mb-4 bg-white rounded-xl border shadow-sm" style={{ borderColor: '#D0E2FA' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8599B4' }}>Client Itinerary Preview</p>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:opacity-90 shadow-md" style={{ background: '#093168' }}>Print / Export PDF</button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-lg" style={{ fontFamily: "'Georgia', serif" }}>

        {/* ===== PAGE 1: COVER ONLY ===== */}
        <div style={{ pageBreakAfter: 'always' }}>
          {/* Hero Cover with destination background */}
          <div className="relative" style={{ height: 520, background: `linear-gradient(135deg, rgba(9,49,104,0.92) 0%, rgba(20,63,119,0.88) 50%, rgba(30,90,170,0.85) 100%)` }}>
            <div className="absolute inset-0" style={{ backgroundImage: `url(https://picsum.photos/seed/${destImg}/1600/600)`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25, mixBlendMode: 'luminosity' }} />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.12\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
              <div className="flex items-center gap-3 mb-8"><div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>{agencyProfile.name.charAt(0)}</div><p className="text-sm font-semibold tracking-[0.35em] uppercase opacity-80">{agencyProfile.name}</p></div>
              <h1 className="text-5xl font-bold leading-tight mb-5" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>{itin.title}</h1>
              <div className="flex items-center gap-4 text-base opacity-80 flex-wrap"><span>{fmtDate(itin.startDate)} &ndash; {fmtDate(itin.endDate)}</span><span className="w-1.5 h-1.5 rounded-full bg-white/40" /><span>{allDests}</span><span className="w-1.5 h-1.5 rounded-full bg-white/40" /><span>{itin.passengers} Traveler{itin.passengers !== 1 ? 's' : ''}</span><span className="w-1.5 h-1.5 rounded-full bg-white/40" /><span>{n} Night{n !== 1 ? 's' : ''}</span></div>
            </div>
            <div className="absolute top-8 right-12 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="absolute top-28 right-36 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>

          {/* Prepared For bar */}
          <div className="px-12 py-6 flex items-center justify-between" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div><p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#8599B4' }}>Prepared for</p><p className="text-2xl font-bold" style={{ color: '#093168' }}>{itin.client}</p></div>
            <div className="text-right"><p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#8599B4' }}>Travel Advisor</p><p className="text-lg font-semibold" style={{ color: '#093168' }}>{itin.agent}</p><p className="text-xs" style={{ color: '#8599B4' }}>{agencyProfile.phone} &middot; {agencyProfile.email}</p></div>
          </div>

          {/* Travelers on cover if they exist */}
          {itin.passengerList.length > 0 && <div className="px-12 py-5" style={{ borderBottom: '1px solid #e2e8f0' }}><p className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: '#8599B4' }}>Travel Party</p><div className="flex flex-wrap gap-3">{itin.passengerList.map((p, i) => (<div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: '#f0f5ff' }}><span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#143F77' }}>{p.name.split(' ').map((n) => n[0]).join('')}</span><span style={{ color: '#093168' }}>{p.name}</span></div>))}</div></div>}

          {/* Trip at a Glance on cover */}
          <div className="px-12 py-5">
            <div className="grid grid-cols-4 gap-3">{[{ v: n, l: 'Nights' }, { v: itin.flights.length, l: 'Flights' }, { v: itin.hotels.length, l: 'Hotels' }, { v: itin.attractions.length + itin.transport.length, l: 'Activities' }].map((s) => (<div key={s.l} className="text-center p-3 rounded-lg" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}><p className="text-2xl font-bold" style={{ color: '#093168' }}>{s.v}</p><p className="text-[10px] mt-0.5" style={{ color: '#8599B4' }}>{s.l}</p></div>))}</div>
          </div>
        </div>

        {/* ===== PAGE 2+: CONTENT ===== */}

        {/* Destination Descriptions */}
        {vdi.length > 0 && <div className="px-12 py-6" style={{ borderBottom: '1px solid #e2e8f0' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: '#093168' }}>About Your Destinations</h2>{vdi.map((di, i) => (<div key={i} className="mb-4 last:mb-0"><h3 className="text-lg font-bold mb-1" style={{ color: '#093168' }}>{di.name}</h3><div className="w-10 h-0.5 mb-2" style={{ background: '#D0E2FA' }} /><p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>{di.description}</p></div>))}</div>}

        {/* Day by Day */}
        {days.map(([date, events], dayIdx) => {
          const dayNum = dayIdx + 1;
          const dateObj = new Date(date + 'T12:00');
          const cities: string[] = []; events.forEach((e) => { if (e.city && !cities.includes(e.city)) cities.push(e.city); });
          return (
            <div key={date}>
              <div className="px-12 py-4 flex items-center gap-4" style={{ background: dayIdx % 2 === 0 ? '#093168' : '#143F77' }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}><span className="text-xl font-bold text-white leading-none">{dayNum}</span><span className="text-[8px] uppercase tracking-wider text-white/50">Day</span></div>
                <div className="text-white"><p className="text-lg font-bold leading-tight">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}, {dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>{cities.length > 0 && <p className="text-xs opacity-60">{cities.join(', ')}</p>}</div>
              </div>
              <div className="px-12 py-4" style={{ background: '#fafcff' }}>
                {events.map((ev, i) => {
                  const color = TC[ev.type] || '#143F77';
                  const bg = TCbg[ev.type] || '#f0f5ff';
                  return (
                    <div key={i} className="flex gap-4 mb-3 last:mb-0">
                      <div className="flex-shrink-0 w-20 pt-0.5 text-right">{ev.time && <p className="text-sm font-bold" style={{ color: '#093168' }}>{ev.time}</p>}<span className="inline-block mt-0.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: bg, color }}>{ev.type}</span></div>
                      <div className="flex flex-col items-center flex-shrink-0 pt-1"><div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: color, background: 'white' }} />{i < events.length - 1 && <div className="w-px flex-1 mt-0.5" style={{ background: '#D0E2FA' }} />}</div>
                      <div className="flex-1 pb-1"><p className="font-bold text-sm" style={{ color: '#093168' }}>{ev.title}</p><p className="text-xs" style={{ color: '#64748b' }}>{ev.sub}</p>{ev.detail && <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>{ev.detail}</p>}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Davening */}
        {(itin.davening || []).length > 0 && <div className="px-12 py-6" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: '#093168' }}>Davening / Minyan</h2>{(itin.davening || []).map((d, i) => (<div key={i} className="p-4 rounded-lg bg-white mb-2" style={{ border: '1px solid #e2e8f0' }}><p className="font-bold text-sm" style={{ color: '#093168' }}>{d.location} <span className="font-normal text-xs" style={{ color: '#64748b' }}>&middot; {d.city} &middot; {d.type}</span></p><div className="grid grid-cols-3 gap-3 mt-2">{[['Shachris', d.shachris], ['Mincha', d.mincha], ['Maariv', d.mariv]].map(([l, v]) => (<div key={l} className="text-center p-2 rounded" style={{ background: '#f0f5ff' }}><p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: '#8599B4' }}>{l}</p><p className="text-xs font-bold mt-0.5" style={{ color: '#093168' }}>{v || '\u2014'}</p></div>))}</div>{d.shabbos && <p className="text-xs mt-2 p-2 rounded" style={{ background: '#fefce8', color: '#92400e' }}><strong>Shabbos:</strong> {d.shabbos}</p>}</div>))}</div>}

        {/* Mikvah */}
        {(itin.mikvah || []).length > 0 && <div className="px-12 py-6" style={{ borderTop: '1px solid #e2e8f0' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: '#093168' }}>Mikvah</h2>{(itin.mikvah || []).map((m, i) => (<div key={i} className="p-4 rounded-lg bg-white mb-2" style={{ border: '1px solid #e2e8f0' }}><p className="font-bold text-sm" style={{ color: '#093168' }}>{m.name}</p><p className="text-xs" style={{ color: '#64748b' }}>{m.city} &middot; {m.address} &middot; {m.gender} &middot; {m.hours || 'Contact'}</p></div>))}</div>}

        {/* Insurance */}
        {itin.insurance.length > 0 && <div className="px-12 py-6" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: '#093168' }}>Insurance</h2>{itin.insurance.map((ins, i) => (<div key={i} className="p-4 rounded-lg bg-white" style={{ border: '1px solid #e2e8f0' }}><p className="font-bold text-sm" style={{ color: '#093168' }}>{ins.provider}</p><p className="text-xs" style={{ color: '#64748b' }}>{ins.coverage} &middot; Policy: {ins.policy}</p></div>))}</div>}

        {/* Notes */}
        {itin.notes && <div className="px-12 py-6" style={{ borderTop: '1px solid #e2e8f0' }}><div className="p-4 rounded-lg" style={{ background: '#fefce8', border: '1px solid #fde68a' }}><p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#d97706' }}>Important Notes</p><p className="text-sm leading-relaxed" style={{ color: '#78350f' }}>{itin.notes}</p></div></div>}

        {/* Emergency + Footer */}
        <div className="px-12 py-5" style={{ background: '#f0f5ff', borderTop: '1px solid #D0E2FA' }}><div className="grid grid-cols-2 gap-4 text-xs"><div><p style={{ color: '#8599B4' }}>Travel Agency</p><p className="font-semibold" style={{ color: '#093168' }}>{agencyProfile.name}</p><p style={{ color: '#64748b' }}>{agencyProfile.phone}</p></div><div><p style={{ color: '#8599B4' }}>Your Advisor</p><p className="font-semibold" style={{ color: '#093168' }}>{itin.agent}</p><p style={{ color: '#64748b' }}>{agencyProfile.email}</p></div></div></div>

        <div className="px-12 py-8 text-center" style={{ background: '#093168' }}>
          <p className="text-xl font-bold text-white tracking-wider">{agencyProfile.name.toUpperCase()}</p>
          <p className="text-xs text-white/50 mt-2">{agencyProfile.email} &middot; {agencyProfile.phone}{agencyProfile.address ? ` \u00b7 ${agencyProfile.address}` : ''}</p>
          <div className="mt-3 w-12 h-px mx-auto" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <p className="text-[10px] text-white/25 mt-3">Prepared exclusively for {itin.client}</p>
        </div>
      </div>
    </div>
  );
}
