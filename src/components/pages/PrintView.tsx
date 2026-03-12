'use client';

import { useMemo } from 'react';
import { fmtDate, fmtTime12, nights } from '@/lib/utils';
import type { Itinerary, AgencyProfile } from '@/lib/types';

interface PrintViewProps { itin: Itinerary; agencyProfile: AgencyProfile; }

interface TimelineEvent { date: string; sortKey: string; type: string; title: string; sub: string; detail?: string; time?: string; city?: string; }

function buildTimeline(itin: Itinerary): TimelineEvent[] {
  const ev: TimelineEvent[] = [];
  itin.flights.forEach((f) => { const d = f.departure.split('T')[0] || f.departure.split(' ')[0]; ev.push({ date: d, sortKey: f.departure, type: 'Flight', title: `${f.airline} ${f.flightNo}`, sub: `${f.fromCity || f.from} to ${f.toCity || f.to}`, detail: [f.depTerminal ? `Terminal ${f.depTerminal}` : '', f.depGate ? `Gate ${f.depGate}` : '', f.duration || '', f.seatClass || ''].filter(Boolean).join(' \u00b7 '), time: f.scheduledDeparture || fmtTime12(f.departure), city: f.toCity || f.to }); });
  itin.hotels.forEach((h) => { ev.push({ date: h.checkIn, sortKey: h.checkIn + ' 14:00', type: 'Hotel Check-in', title: h.name, sub: `${h.city} \u00b7 ${h.roomType} \u00b7 ${h.rooms} room${h.rooms > 1 ? 's' : ''}`, detail: h.ref ? `Confirmation: ${h.ref}` : '', time: '2:00 PM', city: h.city }); ev.push({ date: h.checkOut, sortKey: h.checkOut + ' 11:00', type: 'Hotel Check-out', title: h.name, sub: h.city, time: '11:00 AM', city: h.city }); });
  itin.transport.forEach((t) => { const d = t.pickupDateTime.split('T')[0] || t.pickupDateTime.split(' ')[0]; ev.push({ date: d, sortKey: t.pickupDateTime, type: 'Transfer', title: `${t.type}${t.carType ? ' \u2014 ' + t.carType : ''}`, sub: `${t.pickup} to ${t.dropoff}`, detail: t.provider ? `Provider: ${t.provider}` : '', time: fmtTime12(t.pickupDateTime), city: t.dropoff }); });
  itin.attractions.forEach((a) => { ev.push({ date: a.date, sortKey: a.date + ' ' + (a.time || '09:00'), type: 'Activity', title: a.name, sub: `${a.city} \u00b7 ${a.ticketType}`, time: a.time ? fmtTime12(a.date + 'T' + a.time) : '', city: a.city }); });
  return ev.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function getDayCities(events: TimelineEvent[]): string[] {
  const c: string[] = []; events.forEach((e) => { if (e.city && !c.includes(e.city)) c.push(e.city); }); return c;
}

const TC: Record<string, string> = { Flight: '#1e40af', 'Hotel Check-in': '#b45309', 'Hotel Check-out': '#b45309', Transfer: '#7c3aed', Activity: '#be185d' };

export default function PrintView({ itin, agencyProfile }: PrintViewProps) {
  const timeline = useMemo(() => buildTimeline(itin), [itin]);
  const days = useMemo(() => { const m = new Map<string, TimelineEvent[]>(); timeline.forEach((e) => { if (!m.has(e.date)) m.set(e.date, []); m.get(e.date)!.push(e); }); return Array.from(m.entries()); }, [timeline]);
  const allDests = (itin.destinations?.length > 1) ? itin.destinations.join(', ') : itin.destination;
  const n = nights(itin.startDate, itin.endDate);

  // Unsplash with reliable fallback
  const img = (q: string, w = 1600, h = 600, sig = 0) => `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=${w}&h=${h}&fit=crop&q=80`;
  // Use picsum for reliable images
  const picsum = (seed: string, w = 1600, h = 500) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

  return (
    <div>
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between px-6 py-3 mb-4 bg-white rounded-xl border shadow-sm" style={{ borderColor: '#D0E2FA' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8599B4' }}>Client Itinerary Preview</p>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:opacity-90 shadow-md" style={{ background: '#093168' }}>Print / Export PDF</button>
      </div>

      {/* === PRINTABLE DOCUMENT === */}
      <div className="bg-white rounded-xl overflow-hidden shadow-lg" style={{ fontFamily: "'Georgia', serif" }}>

        {/* ======== COVER ======== */}
        <div className="relative" style={{ height: 480, background: 'linear-gradient(135deg, #093168 0%, #143F77 50%, #1e5aaa 100%)' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>{agencyProfile.name.charAt(0)}</div>
              <p className="text-sm font-semibold tracking-[0.3em] uppercase opacity-80">{agencyProfile.name}</p>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-4" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>{itin.title}</h1>
            <div className="flex items-center gap-4 text-base opacity-80">
              <span>{fmtDate(itin.startDate)} &ndash; {fmtDate(itin.endDate)}</span>
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <span>{allDests}</span>
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <span>{itin.passengers} Traveler{itin.passengers !== 1 ? 's' : ''}</span>
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <span>{n} Night{n !== 1 ? 's' : ''}</span>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-8 right-12 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="absolute top-24 right-32 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>

        {/* ======== PREPARED FOR ======== */}
        <div className="px-12 py-8 flex items-center justify-between" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#8599B4' }}>Prepared for</p>
            <p className="text-2xl font-bold" style={{ color: '#093168' }}>{itin.client}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#8599B4' }}>Travel Advisor</p>
            <p className="text-lg font-semibold" style={{ color: '#093168' }}>{itin.agent}</p>
            <p className="text-sm" style={{ color: '#8599B4' }}>{agencyProfile.email}</p>
          </div>
        </div>

        {/* ======== TRAVELERS ======== */}
        {itin.passengerList.length > 0 && (
          <div className="px-12 py-8" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <h2 className="text-sm font-bold uppercase tracking-[0.25em] mb-5" style={{ color: '#093168' }}>Your Travel Party</h2>
            <div className="flex flex-wrap gap-4">
              {itin.passengerList.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#143F77' }}>{p.name.split(' ').map((n) => n[0]).join('')}</div>
                  <div>
                    <p className="font-semibold" style={{ color: '#093168' }}>{p.name}</p>
                    {p.nationality && <p className="text-xs" style={{ color: '#8599B4' }}>{p.nationality}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======== TRIP AT A GLANCE ======== */}
        <div className="px-12 py-8" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="text-sm font-bold uppercase tracking-[0.25em] mb-5" style={{ color: '#093168' }}>Trip at a Glance</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}>
              <p className="text-3xl font-bold" style={{ color: '#093168' }}>{n}</p>
              <p className="text-xs mt-1" style={{ color: '#8599B4' }}>Nights</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}>
              <p className="text-3xl font-bold" style={{ color: '#093168' }}>{itin.flights.length}</p>
              <p className="text-xs mt-1" style={{ color: '#8599B4' }}>Flights</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}>
              <p className="text-3xl font-bold" style={{ color: '#093168' }}>{itin.hotels.length}</p>
              <p className="text-xs mt-1" style={{ color: '#8599B4' }}>Hotels</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}>
              <p className="text-3xl font-bold" style={{ color: '#093168' }}>{itin.attractions.length + itin.transport.length}</p>
              <p className="text-xs mt-1" style={{ color: '#8599B4' }}>Activities</p>
            </div>
          </div>
        </div>

        {/* ======== DAY BY DAY ======== */}
        {days.map(([date, events], dayIdx) => {
          const cities = getDayCities(events);
          const dayNum = dayIdx + 1;
          const dateObj = new Date(date + 'T12:00');
          const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          const fullDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

          return (
            <div key={date}>
              {/* Day Header */}
              <div className="px-12 py-6 flex items-center gap-5" style={{ background: dayIdx % 2 === 0 ? '#093168' : '#143F77' }}>
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <span className="text-2xl font-bold text-white leading-none">{dayNum}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/60">Day</span>
                </div>
                <div className="text-white">
                  <p className="text-xl font-bold">{weekday}</p>
                  <p className="text-sm opacity-70">{fullDate}{cities.length > 0 ? ` \u2014 ${cities.join(', ')}` : ''}</p>
                </div>
              </div>

              {/* Day Events */}
              <div className="px-12 py-6" style={{ background: '#fafcff' }}>
                <div className="space-y-4">
                  {events.map((ev, i) => {
                    const color = TC[ev.type] || '#143F77';
                    return (
                      <div key={i} className="flex gap-5">
                        {/* Time Column */}
                        <div className="flex-shrink-0 w-24 pt-1 text-right">
                          {ev.time && <p className="text-base font-bold" style={{ color: '#093168' }}>{ev.time}</p>}
                          <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>{ev.type}</p>
                        </div>
                        {/* Connector */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: color, background: 'white' }} />
                          {i < events.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: '#D0E2FA' }} />}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <p className="font-bold text-base" style={{ color: '#093168' }}>{ev.title}</p>
                          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{ev.sub}</p>
                          {ev.detail && <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{ev.detail}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* ======== DAVENING ======== */}
        {(itin.davening || []).length > 0 && (
          <div className="px-12 py-8" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <h2 className="text-sm font-bold uppercase tracking-[0.25em] mb-5" style={{ color: '#093168' }}>Davening / Minyan Information</h2>
            <div className="space-y-4">
              {(itin.davening || []).map((d, i) => (
                <div key={i} className="p-5 rounded-xl bg-white" style={{ border: '1px solid #e2e8f0' }}>
                  <p className="font-bold text-base" style={{ color: '#093168' }}>{d.location}</p>
                  <p className="text-sm" style={{ color: '#64748b' }}>{d.city} &middot; {d.type}</p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {[['Shachris', d.shachris], ['Mincha', d.mincha], ['Maariv', d.mariv]].map(([l, v]) => (
                      <div key={l} className="text-center p-3 rounded-lg" style={{ background: '#f0f5ff' }}>
                        <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#8599B4' }}>{l}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: '#093168' }}>{v || '\u2014'}</p>
                      </div>
                    ))}
                  </div>
                  {d.shabbos && <div className="mt-3 p-3 rounded-lg" style={{ background: '#fefce8', border: '1px solid #fde68a' }}><p className="text-sm"><strong style={{ color: '#92400e' }}>Shabbos:</strong> <span style={{ color: '#78350f' }}>{d.shabbos}</span></p></div>}
                  {d.notes && <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>{d.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======== MIKVAH ======== */}
        {(itin.mikvah || []).length > 0 && (
          <div className="px-12 py-8" style={{ borderTop: '1px solid #e2e8f0' }}>
            <h2 className="text-sm font-bold uppercase tracking-[0.25em] mb-5" style={{ color: '#093168' }}>Mikvah</h2>
            {(itin.mikvah || []).map((m, i) => (
              <div key={i} className="p-5 rounded-xl bg-white mb-3" style={{ border: '1px solid #e2e8f0' }}>
                <p className="font-bold" style={{ color: '#093168' }}>{m.name}</p>
                <p className="text-sm" style={{ color: '#64748b' }}>{m.city} &middot; {m.address} &middot; {m.gender}</p>
                <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Hours: {m.hours || 'Contact for hours'}</p>
              </div>
            ))}
          </div>
        )}

        {/* ======== INSURANCE ======== */}
        {itin.insurance.length > 0 && (
          <div className="px-12 py-8" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <h2 className="text-sm font-bold uppercase tracking-[0.25em] mb-5" style={{ color: '#093168' }}>Travel Insurance</h2>
            {itin.insurance.map((ins, i) => (
              <div key={i} className="p-5 rounded-xl bg-white" style={{ border: '1px solid #e2e8f0' }}>
                <p className="font-bold" style={{ color: '#093168' }}>{ins.provider}</p>
                <p className="text-sm" style={{ color: '#64748b' }}>{ins.coverage} &middot; Policy: {ins.policy}</p>
              </div>
            ))}
          </div>
        )}

        {/* ======== NOTES ======== */}
        {itin.notes && (
          <div className="px-12 py-8" style={{ borderTop: '1px solid #e2e8f0' }}>
            <div className="p-6 rounded-xl" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
              <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#d97706' }}>Important Notes</p>
              <p className="text-base leading-relaxed" style={{ color: '#78350f' }}>{itin.notes}</p>
            </div>
          </div>
        )}

        {/* ======== EMERGENCY ======== */}
        <div className="px-12 py-8" style={{ background: '#f0f5ff', borderTop: '1px solid #D0E2FA' }}>
          <h2 className="text-sm font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#093168' }}>Emergency Contacts</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p style={{ color: '#8599B4' }}>Travel Agency</p><p className="font-semibold" style={{ color: '#093168' }}>{agencyProfile.name}</p><p style={{ color: '#64748b' }}>{agencyProfile.phone}</p></div>
            <div><p style={{ color: '#8599B4' }}>Your Advisor</p><p className="font-semibold" style={{ color: '#093168' }}>{itin.agent}</p><p style={{ color: '#64748b' }}>{agencyProfile.email}</p></div>
          </div>
        </div>

        {/* ======== FOOTER ======== */}
        <div className="px-12 py-10 text-center" style={{ background: '#093168' }}>
          <p className="text-2xl font-bold text-white tracking-wider">{agencyProfile.name.toUpperCase()}</p>
          <p className="text-sm text-white/60 mt-3">{agencyProfile.email} &middot; {agencyProfile.phone}</p>
          {agencyProfile.address && <p className="text-xs text-white/40 mt-1">{agencyProfile.address}</p>}
          <div className="mt-4 w-16 h-px mx-auto" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <p className="text-xs text-white/30 mt-4">This itinerary was prepared exclusively for {itin.client}</p>
        </div>
      </div>
    </div>
  );
}
