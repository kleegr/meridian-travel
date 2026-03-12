'use client';

import { useMemo } from 'react';
import { GHL } from '@/lib/constants';
import { fmtDate, fmtTime12, nights } from '@/lib/utils';
import type { Itinerary, AgencyProfile } from '@/lib/types';

interface PrintViewProps { itin: Itinerary; agencyProfile: AgencyProfile; }

interface TimelineEvent { date: string; sortKey: string; type: string; title: string; subtitle: string; detail?: string; time?: string; city?: string; }

function buildTimeline(itin: Itinerary): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  itin.flights.forEach((f) => { const d = f.departure.split('T')[0] || f.departure.split(' ')[0] || f.departure; events.push({ date: d, sortKey: f.departure, type: 'Flight', title: `${f.airline} ${f.flightNo}`, subtitle: `${f.from} to ${f.to}`, detail: f.depTerminal ? `Terminal ${f.depTerminal}${f.depGate ? ' Gate ' + f.depGate : ''} | ${f.duration || ''}` : f.duration || '', time: f.scheduledDeparture || fmtTime12(f.departure), city: f.toCity || f.to }); });
  itin.hotels.forEach((h) => { events.push({ date: h.checkIn, sortKey: h.checkIn + ' 14:00', type: 'Check-in', title: h.name, subtitle: `${h.roomType} x${h.rooms}`, detail: `Ref: ${h.ref}`, time: '2:00 PM', city: h.city }); events.push({ date: h.checkOut, sortKey: h.checkOut + ' 11:00', type: 'Check-out', title: h.name, subtitle: 'Departure', time: '11:00 AM', city: h.city }); });
  itin.transport.forEach((t) => { const d = t.pickupDateTime.split('T')[0] || t.pickupDateTime.split(' ')[0] || t.pickupDateTime; events.push({ date: d, sortKey: t.pickupDateTime, type: 'Transfer', title: t.type, subtitle: `${t.pickup} to ${t.dropoff}`, detail: t.provider, time: fmtTime12(t.pickupDateTime), city: t.dropoff }); });
  itin.attractions.forEach((a) => { events.push({ date: a.date, sortKey: a.date + ' ' + (a.time || '09:00'), type: 'Activity', title: a.name, subtitle: a.ticketType, time: a.time ? fmtTime12(a.date + 'T' + a.time) : '', city: a.city }); });
  return events.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function getDayCities(events: TimelineEvent[]): string[] {
  const cities: string[] = []; events.forEach((e) => { if (e.city && !cities.includes(e.city)) cities.push(e.city); }); return cities;
}

const typeColors: Record<string, { bg: string; text: string }> = { Flight: { bg: '#dbeafe', text: '#1e40af' }, 'Check-in': { bg: '#fef3c7', text: '#92400e' }, 'Check-out': { bg: '#fef3c7', text: '#92400e' }, Transfer: { bg: '#ede9fe', text: '#5b21b6' }, Activity: { bg: '#fce7f3', text: '#9d174d' } };

export default function PrintView({ itin, agencyProfile }: PrintViewProps) {
  const timeline = useMemo(() => buildTimeline(itin), [itin]);
  const timelineDays = useMemo(() => { const days = new Map<string, TimelineEvent[]>(); timeline.forEach((e) => { if (!days.has(e.date)) days.set(e.date, []); days.get(e.date)!.push(e); }); return Array.from(days.entries()); }, [timeline]);
  const allDests = (itin.destinations && itin.destinations.length > 1) ? itin.destinations.join(', ') : itin.destination;
  const dest = encodeURIComponent((itin.destinations?.[0] || itin.destination) + ' landscape scenic');
  const heroImg = `https://source.unsplash.com/1600x600/?${dest}`;

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
      <div className="no-print flex items-center justify-between px-6 py-3 border-b" style={{ background: GHL.bg, borderColor: GHL.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GHL.muted }}>Client Itinerary Preview</p>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90" style={{ background: GHL.accent }}>Print / Export PDF</button>
      </div>
      <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        {/* Cover */}
        <div className="relative" style={{ height: 420 }}>
          <img src={heroImg} alt={allDests} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(9,49,104,0.15) 0%, rgba(9,49,104,0.85) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
            <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-70 mb-3">{agencyProfile.name}</p>
            <h1 className="text-4xl font-bold leading-tight mb-3">{itin.title}</h1>
            <div className="flex items-center gap-3 text-sm opacity-80 flex-wrap"><span>{fmtDate(itin.startDate)} &ndash; {fmtDate(itin.endDate)}</span><span>&middot;</span><span>{allDests}</span><span>&middot;</span><span>{itin.passengers} Travelers</span><span>&middot;</span><span>{nights(itin.startDate, itin.endDate)} Nights</span></div>
          </div>
        </div>

        {/* Info bar */}
        <div className="px-10 py-6 flex items-center justify-between border-b" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <div><p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: GHL.muted }}>Prepared for</p><p className="text-lg font-bold" style={{ color: GHL.text }}>{itin.client}</p></div>
          <div className="text-right"><p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: GHL.muted }}>Prepared by</p><p className="text-sm font-semibold" style={{ color: GHL.text }}>{itin.agent}</p><p className="text-xs" style={{ color: GHL.muted }}>{fmtDate(new Date().toISOString())}</p></div>
        </div>

        {/* Travelers */}
        {itin.passengerList.length > 0 && <div className="px-10 py-8 border-b" style={{ borderColor: GHL.border }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: GHL.accent }}>Travelers</h2><div className="flex flex-wrap gap-4">{itin.passengerList.map((p, i) => (<div key={i} className="flex items-center gap-3 px-4 py-2 rounded-full" style={{ background: GHL.bg }}><div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: GHL.accent }}>{p.name.split(' ').map((n) => n[0]).join('')}</div><p className="text-sm font-semibold" style={{ color: GHL.text }}>{p.name}</p></div>))}</div></div>}

        {/* Day by Day */}
        {timelineDays.map(([date, events], dayIdx) => {
          const cities = getDayCities(events);
          const cityQuery = encodeURIComponent((cities[0] || itin.destinations?.[0] || itin.destination) + ' travel scenic');
          const dayImg = `https://source.unsplash.com/1600x400/?${cityQuery}&sig=${dayIdx}`;
          return (
            <div key={date} className="relative">
              <div className="relative" style={{ height: 200 }}>
                <img src={dayImg} alt={cities.join(', ')} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(9,49,104,0.9) 0%, rgba(9,49,104,0.4) 60%, transparent 100%)' }} />
                <div className="absolute inset-0 flex items-center px-10"><div className="text-white"><div className="flex items-center gap-3 mb-1"><span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>{dayIdx + 1}</span><div><p className="text-xs font-semibold tracking-wider uppercase opacity-70">Day {dayIdx + 1}</p><p className="text-xl font-bold">{new Date(date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p></div></div>{cities.length > 0 && <p className="text-sm opacity-70 mt-1 ml-[52px]">{cities.join(', ')}</p>}</div></div>
              </div>
              <div className="px-10 py-6" style={{ background: '#FBFBFC' }}><div className="space-y-3">{events.map((ev, i) => {
                const tc = typeColors[ev.type] || { bg: GHL.accentLight, text: GHL.accent };
                return (<div key={i} className="flex gap-4 p-4 rounded-xl bg-white border" style={{ borderColor: GHL.border }}>
                  <div className="flex-shrink-0 w-20 text-center">{ev.time ? <p className="text-sm font-bold" style={{ color: GHL.text }}>{ev.time}</p> : <p className="text-xs" style={{ color: GHL.muted }}>All day</p>}<span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.text }}>{ev.type}</span></div>
                  <div className="flex-1 border-l pl-4" style={{ borderColor: GHL.border }}><p className="font-bold text-sm" style={{ color: GHL.text }}>{ev.title}</p><p className="text-sm mt-0.5" style={{ color: GHL.muted }}>{ev.subtitle}</p>{ev.detail && <p className="text-xs mt-1" style={{ color: GHL.muted }}>{ev.detail}</p>}</div>
                </div>);
              })}</div></div>
            </div>
          );
        })}

        {/* Davening */}
        {(itin.davening || []).length > 0 && <div className="px-10 py-8 border-t" style={{ borderColor: GHL.border, background: GHL.bg }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: GHL.accent }}>Davening / Minyan</h2><div className="space-y-3">{(itin.davening || []).map((d, i) => (<div key={i} className="p-4 rounded-xl bg-white border" style={{ borderColor: GHL.border }}><p className="font-bold text-sm" style={{ color: GHL.text }}>{d.location}</p><p className="text-xs" style={{ color: GHL.muted }}>{d.city} &middot; {d.type}</p><div className="grid grid-cols-3 gap-3 mt-3">{[['Shachris', d.shachris], ['Mincha', d.mincha], ['Maariv', d.mariv]].map(([l, v]) => (<div key={l} className="text-center p-2 rounded-lg" style={{ background: GHL.bg }}><p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: GHL.muted }}>{l}</p><p className="text-sm font-bold mt-0.5" style={{ color: GHL.text }}>{v || '--'}</p></div>))}</div>{d.shabbos && <div className="mt-3 p-2 rounded-lg" style={{ background: '#fefce8', border: '1px solid #fde68a' }}><p className="text-xs"><span className="font-bold" style={{ color: '#92400e' }}>Shabbos:</span> <span style={{ color: '#78350f' }}>{d.shabbos}</span></p></div>}{d.notes && <p className="text-xs mt-2" style={{ color: GHL.muted }}>{d.notes}</p>}</div>))}</div></div>}

        {/* Mikvah */}
        {(itin.mikvah || []).length > 0 && <div className="px-10 py-8 border-t" style={{ borderColor: GHL.border, background: '#FBFBFC' }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: GHL.accent }}>Mikvah</h2>{(itin.mikvah || []).map((m, i) => (<div key={i} className="p-4 rounded-xl bg-white border mb-2" style={{ borderColor: GHL.border }}><p className="font-bold text-sm" style={{ color: GHL.text }}>{m.name}</p><p className="text-xs" style={{ color: GHL.muted }}>{m.city} &middot; {m.address} &middot; {m.gender}</p><p className="text-xs mt-1" style={{ color: GHL.muted }}>Hours: {m.hours || 'Contact'}</p>{m.notes && <p className="text-xs mt-1" style={{ color: GHL.muted }}>{m.notes}</p>}</div>))}</div>}

        {/* Insurance */}
        {itin.insurance.length > 0 && <div className="px-10 py-8 border-t" style={{ borderColor: GHL.border, background: GHL.bg }}><h2 className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: GHL.accent }}>Travel Insurance</h2>{itin.insurance.map((ins, i) => (<div key={i} className="p-4 rounded-xl bg-white border" style={{ borderColor: GHL.border }}><p className="font-bold text-sm" style={{ color: GHL.text }}>{ins.provider}</p><p className="text-xs" style={{ color: GHL.muted }}>{ins.coverage} &middot; Policy: {ins.policy}</p></div>))}</div>}

        {/* Notes */}
        {itin.notes && <div className="px-10 py-6 border-t" style={{ borderColor: GHL.border }}><div className="p-5 rounded-xl" style={{ background: '#fefce8', border: '1px solid #fde68a' }}><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#d97706' }}>Important Notes</p><p className="text-sm leading-relaxed" style={{ color: '#78350f' }}>{itin.notes}</p></div></div>}

        {/* Footer */}
        <div className="relative" style={{ height: 160 }}>
          <img src={heroImg} alt={allDests} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(9,49,104,0.88)' }} />
          <div className="absolute inset-0 flex items-center justify-center text-center text-white"><div><p className="text-xl font-bold tracking-wider">{agencyProfile.name.toUpperCase()}</p><p className="text-sm opacity-70 mt-2">{agencyProfile.email} &middot; {agencyProfile.phone}</p><p className="text-xs opacity-50 mt-1">{agencyProfile.address}</p></div></div>
        </div>
      </div>
    </div>
  );
}
