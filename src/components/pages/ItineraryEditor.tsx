'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmtDate, fmtTime12, nights } from '@/lib/utils';
import { flightIntro, hotelCheckInIntro, hotelCheckOutIntro, transferIntro, activityIntro, dayIntro, destinationIntro, sectionIntro } from '@/lib/hospitality-copy';
import type { Itinerary, AgencyProfile, ClientViewSettings, Flight, Hotel, Transport, Attraction } from '@/lib/types';
import { DEFAULT_CLIENT_VIEW_SETTINGS } from '@/lib/types';

interface Props {
  itin: Itinerary;
  agencyProfile: AgencyProfile;
  onUpdate: (settings: ClientViewSettings) => void;
  onEditItem?: (section: string, id: number) => void;
}

const TEMPLATES: { id: string; name: string; thumb: string; settings: Partial<ClientViewSettings> }[] = [
  { id: 'classic-navy', name: 'Classic Navy', thumb: 'linear-gradient(135deg, #093168, #1a5298)', settings: { primaryColor: '#093168', accentColor: '#1a5298', fontFamily: 'serif', layoutStyle: 'classic' } },
  { id: 'modern-dark', name: 'Modern Dark', thumb: 'linear-gradient(135deg, #111827, #1f2937)', settings: { primaryColor: '#111827', accentColor: '#374151', fontFamily: 'sans-serif', layoutStyle: 'classic' } },
  { id: 'elegant-gold', name: 'Elegant Gold', thumb: 'linear-gradient(135deg, #78350f, #b45309)', settings: { primaryColor: '#78350f', accentColor: '#b45309', fontFamily: 'elegant', layoutStyle: 'classic' } },
  { id: 'ocean-blue', name: 'Ocean Blue', thumb: 'linear-gradient(135deg, #0c4a6e, #0284c7)', settings: { primaryColor: '#0c4a6e', accentColor: '#0284c7', fontFamily: 'clean', layoutStyle: 'classic' } },
  { id: 'forest-green', name: 'Forest Green', thumb: 'linear-gradient(135deg, #14532d, #16a34a)', settings: { primaryColor: '#14532d', accentColor: '#16a34a', fontFamily: 'serif', layoutStyle: 'editorial' } },
  { id: 'sunset-warm', name: 'Sunset Warm', thumb: 'linear-gradient(135deg, #9a3412, #ea580c)', settings: { primaryColor: '#9a3412', accentColor: '#ea580c', fontFamily: 'modern', layoutStyle: 'classic' } },
  { id: 'royal-purple', name: 'Royal Purple', thumb: 'linear-gradient(135deg, #4c1d95, #7c3aed)', settings: { primaryColor: '#4c1d95', accentColor: '#7c3aed', fontFamily: 'elegant', layoutStyle: 'editorial' } },
  { id: 'minimal-gray', name: 'Minimal Clean', thumb: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', settings: { primaryColor: '#1e293b', accentColor: '#475569', fontFamily: 'clean', layoutStyle: 'minimal' } },
  { id: 'rose-blush', name: 'Rose Blush', thumb: 'linear-gradient(135deg, #881337, #e11d48)', settings: { primaryColor: '#881337', accentColor: '#e11d48', fontFamily: 'elegant', layoutStyle: 'classic' } },
  { id: 'slate-modern', name: 'Slate Modern', thumb: 'linear-gradient(135deg, #334155, #64748b)', settings: { primaryColor: '#334155', accentColor: '#64748b', fontFamily: 'modern', layoutStyle: 'minimal' } },
  { id: 'tropical', name: 'Tropical', thumb: 'linear-gradient(135deg, #065f46, #059669)', settings: { primaryColor: '#065f46', accentColor: '#059669', fontFamily: 'clean', layoutStyle: 'classic' } },
  { id: 'midnight', name: 'Midnight', thumb: 'linear-gradient(135deg, #0f172a, #1e40af)', settings: { primaryColor: '#0f172a', accentColor: '#1e40af', fontFamily: 'sans-serif', layoutStyle: 'editorial' } },
  { id: 'terracotta', name: 'Terracotta', thumb: 'linear-gradient(135deg, #7c2d12, #c2410c)', settings: { primaryColor: '#7c2d12', accentColor: '#c2410c', fontFamily: 'serif', layoutStyle: 'classic' } },
  { id: 'arctic', name: 'Arctic', thumb: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', settings: { primaryColor: '#0c4a6e', accentColor: '#0ea5e9', fontFamily: 'clean', layoutStyle: 'minimal' } },
  { id: 'charcoal', name: 'Charcoal', thumb: 'linear-gradient(135deg, #18181b, #3f3f46)', settings: { primaryColor: '#18181b', accentColor: '#52525b', fontFamily: 'mono', layoutStyle: 'editorial' } },
  { id: 'burgundy', name: 'Burgundy', thumb: 'linear-gradient(135deg, #4a0420, #831843)', settings: { primaryColor: '#4a0420', accentColor: '#831843', fontFamily: 'elegant', layoutStyle: 'classic' } },
  { id: 'sage', name: 'Sage', thumb: 'linear-gradient(135deg, #365314, #4d7c0f)', settings: { primaryColor: '#365314', accentColor: '#4d7c0f', fontFamily: 'serif', layoutStyle: 'minimal' } },
  { id: 'coral', name: 'Coral Reef', thumb: 'linear-gradient(135deg, #be123c, #f43f5e)', settings: { primaryColor: '#be123c', accentColor: '#f43f5e', fontFamily: 'modern', layoutStyle: 'classic' } },
  { id: 'denim', name: 'Denim', thumb: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', settings: { primaryColor: '#1e3a5f', accentColor: '#3b82f6', fontFamily: 'clean', layoutStyle: 'editorial' } },
  { id: 'espresso', name: 'Espresso', thumb: 'linear-gradient(135deg, #422006, #713f12)', settings: { primaryColor: '#422006', accentColor: '#713f12', fontFamily: 'serif', layoutStyle: 'classic' } },
];

const FONT_MAP: Record<string, string> = {
  'serif': "'Georgia', 'Times New Roman', serif",
  'sans-serif': "'Helvetica Neue', 'Arial', sans-serif",
  'modern': "'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  'elegant': "'Playfair Display', 'Georgia', serif",
  'clean': "'DM Sans', 'Helvetica', sans-serif",
  'mono': "'JetBrains Mono', 'Fira Code', monospace",
};

interface TLE { date: string; sk: string; type: string; title: string; sub: string; detail?: string; time?: string; city?: string; section?: string; itemId?: number; noTime?: boolean; hospCopy?: string; rawItem?: any; }

function buildTL(it: Itinerary, cv: ClientViewSettings): TLE[] {
  const e: TLE[] = [];
  if (cv.showFlights) it.flights.forEach(f => {
    const d = f.departure.split('T')[0]; const time = f.scheduledDeparture || fmtTime12(f.departure);
    e.push({ date: d, sk: f.departure, type: 'Flight', title: f.airline + ' ' + f.flightNo, sub: (f.fromCity || f.from) + ' > ' + (f.toCity || f.to), detail: [f.depTerminal ? 'T' + f.depTerminal : '', f.duration, f.seatClass].filter(Boolean).join(' | '), time: time || '', noTime: !time, city: f.toCity || f.to, section: 'flight', itemId: f.id, hospCopy: flightIntro(f), rawItem: f });
  });
  if (cv.showHotels) it.hotels.forEach(h => {
    e.push({ date: h.checkIn, sk: h.checkIn + ' 14:00', type: 'Check-in', title: h.name, sub: h.city + ' | ' + h.roomType, time: h.checkInTime || '', noTime: !h.checkInTime, city: h.city, section: 'hotel', itemId: h.id, hospCopy: hotelCheckInIntro(h), rawItem: h });
    e.push({ date: h.checkOut, sk: h.checkOut + ' 11:00', type: 'Check-out', title: h.name, sub: h.city, time: h.checkOutTime || '', noTime: !h.checkOutTime, city: h.city, section: 'hotel', itemId: h.id, hospCopy: hotelCheckOutIntro(h), rawItem: h });
  });
  if (cv.showTransfers) it.transport.forEach(t => {
    const d = (t.pickupDateTime || '').split('T')[0];
    e.push({ date: d, sk: t.pickupDateTime || d, type: 'Transfer', title: t.type + (t.carType ? ' - ' + t.carType : ''), sub: t.pickup + ' > ' + t.dropoff, detail: t.provider || '', time: t.pickupTime || '', noTime: !t.pickupTime, city: t.dropoff, section: 'transport', itemId: t.id, hospCopy: transferIntro(t), rawItem: t });
  });
  if (cv.showActivities) it.attractions.forEach(a => {
    e.push({ date: a.date, sk: a.date + ' ' + (a.time || '09:00'), type: 'Activity', title: a.name, sub: a.city + ' | ' + a.ticketType, time: a.time || '', noTime: !a.time, city: a.city, section: 'attraction', itemId: a.id, hospCopy: activityIntro(a), rawItem: a });
  });
  return e.sort((a, b) => a.sk.localeCompare(b.sk));
}

const TC: Record<string, string> = { Flight: '#1e40af', 'Check-in': '#b45309', 'Check-out': '#92400e', Transfer: '#7c3aed', Activity: '#be185d' };
const TBG: Record<string, string> = { Flight: '#dbeafe', 'Check-in': '#fef3c7', 'Check-out': '#fef3c7', Transfer: '#ede9fe', Activity: '#fce7f3' };

// ---------- LIVE PREVIEW WITH HOSPITALITY COPY ----------
function LivePreview({ itin, agencyProfile, cv }: { itin: Itinerary; agencyProfile: AgencyProfile; cv: ClientViewSettings }) {
  const tl = useMemo(() => buildTL(itin, cv), [itin, cv]);
  const days = useMemo(() => { const m = new Map<string, TLE[]>(); tl.forEach(ev => { if (!m.has(ev.date)) m.set(ev.date, []); m.get(ev.date)!.push(ev); }); return Array.from(m.entries()); }, [tl]);
  const allDests = (itin.destinations?.length > 1) ? itin.destinations.join(' & ') : itin.destination;
  const n = nights(itin.startDate, itin.endDate);
  const pc = cv.primaryColor || '#093168';
  const ac = cv.accentColor || '#1a5298';
  const ff = FONT_MAP[cv.fontFamily] || FONT_MAP['serif'];
  const isMin = cv.layoutStyle === 'minimal';
  const isEdit = cv.layoutStyle === 'editorial';
  const logo = cv.showLogo ? agencyProfile.logo : '';
  const vdi = cv.showDestinationInfo ? (itin.destinationInfo || []).filter(d => d.showOnItinerary && d.description) : [];

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow" style={{ fontFamily: ff, fontSize: '10px' }}>
      {/* Header */}
      {cv.showOverview && (
        <div className="relative" style={{ background: isMin ? '#f8fafc' : `linear-gradient(135deg, ${pc}, ${ac})` }}>
          {cv.coverImage && <div className="absolute inset-0" style={{ backgroundImage: 'url(' + cv.coverImage + ')', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />}
          <div className="relative px-5 py-4">
            {logo && <div className="mb-2" style={{ textAlign: cv.logoPosition === 'top-center' ? 'center' : cv.logoPosition === 'top-right' ? 'right' : 'left' }}><img src={logo} alt="" className="h-5 object-contain inline-block" style={{ filter: isMin ? 'none' : 'brightness(0) invert(1)' }} /></div>}
            <h1 className="text-xl font-bold mb-1" style={{ color: isMin ? pc : 'white' }}>{itin.title}</h1>
            <p className="text-[8px] italic leading-relaxed mb-2" style={{ color: isMin ? '#64748b' : 'rgba(255,255,255,0.7)' }}>{sectionIntro('overview', itin.client)}</p>
            <p className="text-[9px] mb-3" style={{ color: isMin ? '#64748b' : 'rgba(255,255,255,0.5)' }}>{allDests} | {fmtDate(itin.startDate)} - {fmtDate(itin.endDate)}</p>
            <div className="flex gap-4">
              {[{ v: n, l: 'Nights' }, { v: itin.passengers, l: 'Travelers' }, { v: itin.flights.length, l: 'Flights' }].map(s => (
                <div key={s.l}><span className="text-sm font-bold" style={{ color: isMin ? pc : 'white' }}>{s.v}</span><span className="text-[7px] uppercase ml-1" style={{ color: isMin ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>{s.l}</span></div>
              ))}
            </div>
            <div className="flex justify-between items-end mt-3 pt-2" style={{ borderTop: isMin ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)' }}>
              <div><p className="text-[7px] uppercase" style={{ color: isMin ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>Prepared for</p><p className="font-bold" style={{ color: isMin ? pc : 'white' }}>{itin.client}</p></div>
              <div className="text-right"><p className="text-[7px] uppercase" style={{ color: isMin ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>Your Advisor</p><p className="font-semibold" style={{ color: isMin ? pc : 'white' }}>{itin.agent}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Passengers */}
      {cv.showPassengers && itin.passengerList.length > 0 && (
        <div className="px-5 py-2" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <p className="text-[7px] italic mb-1" style={{ color: '#94a3b8' }}>{sectionIntro('passengers')}</p>
          <div className="flex flex-wrap gap-1">{itin.passengerList.map((p, i) => <span key={i} className="px-1.5 py-0.5 rounded text-[8px]" style={{ background: '#f0f5ff', color: pc }}>{p.name}</span>)}</div>
        </div>
      )}

      {/* Destination Info with hospitality intros */}
      {vdi.length > 0 && <div className="px-5 py-2" style={{ borderBottom: '1px solid #e2e8f0' }}>{vdi.map((di, i) => <div key={i} className="mb-1.5"><p className="font-bold text-[9px]" style={{ color: pc }}>{di.name}</p><p className="text-[7px] italic mb-0.5" style={{ color: ac }}>{destinationIntro(di.name)}</p><p className="text-[8px] leading-relaxed" style={{ color: '#64748b' }}>{di.description.substring(0, 120)}...</p></div>)}</div>}

      {/* Day-by-day timeline with hospitality copy */}
      {days.map(([date, events], dayIdx) => {
        const dateObj = new Date(date + 'T12:00');
        const cities: string[] = []; events.forEach(ev => { if (ev.city && !cities.includes(ev.city)) cities.push(ev.city); });
        return (<div key={date}>
          <div className="px-5 py-1.5" style={{ background: isMin ? '#f1f5f9' : (isEdit && dayIdx % 2 !== 0 ? ac : pc) }}>
            <span className="font-bold text-[9px]" style={{ color: isMin ? pc : 'white' }}>Day {dayIdx + 1}</span>
            <span className="text-[8px] ml-1" style={{ color: isMin ? '#64748b' : 'rgba(255,255,255,0.6)' }}>{dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          {/* Day intro copy */}
          <div className="px-5 py-1"><p className="text-[7px] italic leading-relaxed" style={{ color: '#94a3b8' }}>{dayIntro(dayIdx + 1, cities, events.length)}</p></div>
          <div className="px-5 pb-1">{events.map((ev, i) => { const color = TC[ev.type] || pc; const bg = TBG[ev.type] || '#f0f5ff'; return (
            <div key={i} className="mb-1.5">
              {/* Hospitality intro for this item */}
              {ev.hospCopy && <p className="text-[7px] italic leading-relaxed ml-12 mb-0.5" style={{ color: '#94a3b8' }}>{ev.hospCopy}</p>}
              <div className="flex gap-1.5">
                <div className="w-10 text-right flex-shrink-0">{ev.time && <p className="text-[8px] font-bold" style={{ color: pc }}>{ev.time}</p>}<span className="text-[5px] font-bold uppercase px-0.5 rounded" style={{ background: bg, color }}>{ev.type}</span></div>
                <div className="w-1 flex-shrink-0 flex flex-col items-center"><div className="w-1 h-1 rounded-full" style={{ background: color }} />{i < events.length - 1 && <div className="w-px flex-1" style={{ background: '#e2e8f0' }} />}</div>
                <div><p className="font-bold text-[8px]" style={{ color: pc }}>{ev.title}</p><p className="text-[7px]" style={{ color: '#64748b' }}>{ev.sub}</p>{ev.detail && <p className="text-[6px]" style={{ color: '#94a3b8' }}>{ev.detail}</p>}</div>
              </div>
            </div>
          ); })}</div>
        </div>);
      })}

      {/* Contact footer with hospitality copy */}
      <div className="px-5 py-2" style={{ borderTop: '1px solid #e2e8f0' }}>
        <p className="text-[7px] italic mb-1" style={{ color: '#94a3b8' }}>{sectionIntro('contact', itin.client)}</p>
        <p className="text-[8px] font-semibold" style={{ color: pc }}>{agencyProfile.name} | {itin.agent}</p>
      </div>
      <div className="px-5 py-2" style={{ background: pc }}><p className="text-[7px] font-bold text-white">{agencyProfile.name}</p></div>
    </div>
  );
}

// ---------- MAIN EDITOR ----------
export default function ItineraryEditor({ itin, agencyProfile, onUpdate, onEditItem }: Props) {
  const cv = itin.clientViewSettings || DEFAULT_CLIENT_VIEW_SETTINGS;
  const set = (key: keyof ClientViewSettings, val: any) => onUpdate({ ...cv, [key]: val });
  const applyTemplate = (tpl: typeof TEMPLATES[0]) => onUpdate({ ...cv, ...tpl.settings });
  const [tab, setTab] = useState<'templates' | 'design' | 'sections' | 'images'>('templates');
  const [enhancing, setEnhancing] = useState(false);

  const Tog = ({ label, on, flip }: { label: string; on: boolean; flip: () => void }) => (
    <div className="flex items-center justify-between py-1 cursor-pointer" onClick={flip}>
      <span className="text-[10px]" style={{ color: GHL.text }}>{label}</span>
      <div className="w-7 h-4 rounded-full relative flex-shrink-0" style={{ background: on ? GHL.accent : '#d1d5db' }}><div className="w-3 h-3 rounded-full bg-white absolute top-0.5 shadow-sm" style={{ left: on ? '14px' : '2px', transition: 'left 0.15s' }} /></div>
    </div>
  );

  const handleAIEnhance = async () => {
    setEnhancing(true);
    try {
      const res = await fetch('/api/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: { title: itin.title, destination: itin.destination, client: itin.client, destinations: itin.destinations } }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) alert('AI Suggestion: ' + data.suggestion);
      } else {
        alert('AI Enhance is not yet connected. The hospitality copy is generated automatically from your itinerary data.');
      }
    } catch {
      alert('AI Enhance is not yet connected. The hospitality copy is already applied automatically.');
    }
    setEnhancing(false);
  };

  return (
    <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* LEFT: Live Preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8599B4' }}>Live Preview</p>
          <button onClick={() => window.print()} className="text-white rounded-lg px-3 py-1 text-[9px] font-semibold" style={{ background: cv.primaryColor || '#093168' }}>Print / PDF</button>
        </div>
        <div className="overflow-y-auto rounded-xl border" style={{ maxHeight: 'calc(100vh - 240px)', borderColor: '#D0E2FA' }}>
          <LivePreview itin={itin} agencyProfile={agencyProfile} cv={cv} />
        </div>
      </div>

      {/* RIGHT: Design Controls */}
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
          <div className="flex border-b" style={{ borderColor: GHL.border }}>
            {(['templates', 'design', 'sections', 'images'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 text-[9px] font-semibold capitalize" style={tab === t ? { color: GHL.accent, borderBottom: '2px solid ' + GHL.accent } : { color: GHL.muted }}>{t}</button>
            ))}
          </div>
          <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {tab === 'templates' && (
              <div className="space-y-2">
                <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Choose a Design</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.id} onClick={() => applyTemplate(tpl)} className="rounded-lg overflow-hidden border-2 transition-all hover:scale-105" style={{ borderColor: cv.primaryColor === tpl.settings.primaryColor ? GHL.accent : 'transparent' }}>
                      <div className="h-10" style={{ background: tpl.thumb }} />
                      <p className="text-[7px] font-semibold py-0.5 text-center" style={{ color: GHL.text }}>{tpl.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tab === 'design' && (
              <div className="space-y-3">
                <div><p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Layout Style</p><select value={cv.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="classic">Classic</option><option value="editorial">Editorial</option><option value="minimal">Minimal</option><option value="brochure">Brochure</option></select></div>
                <div><p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Font</p><select value={cv.fontFamily} onChange={e => set('fontFamily', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="serif">Serif (Georgia)</option><option value="sans-serif">Sans Serif (Helvetica)</option><option value="modern">Modern (SF Pro)</option><option value="elegant">Elegant (Playfair)</option><option value="clean">Clean (DM Sans)</option><option value="mono">Monospace (JetBrains)</option></select></div>
                <div className="grid grid-cols-2 gap-2"><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Primary</p><input type="color" value={cv.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" style={{ borderColor: GHL.border }} /></div><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Accent</p><input type="color" value={cv.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" style={{ borderColor: GHL.border }} /></div></div>
                <div><Tog label="Show Logo" on={cv.showLogo} flip={() => set('showLogo', !cv.showLogo)} />{cv.showLogo && <select value={cv.logoPosition} onChange={e => set('logoPosition', e.target.value)} className="w-full px-2 py-1 border rounded text-[10px] mt-1" style={{ borderColor: GHL.border }}><option value="top-left">Left</option><option value="top-center">Center</option><option value="top-right">Right</option></select>}</div>
                <button onClick={handleAIEnhance} disabled={enhancing} className="w-full py-2 rounded-lg text-[10px] font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', opacity: enhancing ? 0.5 : 1 }}><Icon n="star" c="w-3 h-3" /> {enhancing ? 'Enhancing...' : 'AI Enhance Copy'}</button>
                <p className="text-[7px]" style={{ color: GHL.muted }}>Hospitality-style wording is automatically generated for every flight, hotel, transfer, and activity in your itinerary.</p>
              </div>
            )}
            {tab === 'sections' && (
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Show / Hide Sections</p>
                <Tog label="Trip Overview" on={cv.showOverview} flip={() => set('showOverview', !cv.showOverview)} />
                <Tog label="Travelers" on={cv.showPassengers} flip={() => set('showPassengers', !cv.showPassengers)} />
                <Tog label="Flights" on={cv.showFlights} flip={() => set('showFlights', !cv.showFlights)} />
                <Tog label="Hotels" on={cv.showHotels} flip={() => set('showHotels', !cv.showHotels)} />
                <Tog label="Transportation" on={cv.showTransfers} flip={() => set('showTransfers', !cv.showTransfers)} />
                <Tog label="Activities" on={cv.showActivities} flip={() => set('showActivities', !cv.showActivities)} />
                <Tog label="Insurance" on={cv.showInsurance} flip={() => set('showInsurance', !cv.showInsurance)} />
                <Tog label="Destination Info" on={cv.showDestinationInfo} flip={() => set('showDestinationInfo', !cv.showDestinationInfo)} />
                <Tog label="Davening" on={cv.showDavening} flip={() => set('showDavening', !cv.showDavening)} />
                <Tog label="Mikvah" on={cv.showMikvah} flip={() => set('showMikvah', !cv.showMikvah)} />
                <Tog label="Notes" on={cv.showNotes} flip={() => set('showNotes', !cv.showNotes)} />
                <Tog label="Contact Info" on={cv.showContactInfo} flip={() => set('showContactInfo', !cv.showContactInfo)} />
              </div>
            )}
            {tab === 'images' && (
              <div className="space-y-3">
                <div><p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Cover / Header Image</p><input value={cv.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="Paste image URL..." className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }} />{cv.coverImage && <img src={cv.coverImage} alt="" className="w-full h-20 object-cover rounded mt-1" />}</div>
                <div><p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Quick Backgrounds</p><div className="grid grid-cols-3 gap-1">{['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600','https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600','https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600','https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600','https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600'].map((url, i) => (<button key={i} onClick={() => set('coverImage', url)} className="h-12 rounded overflow-hidden border-2 hover:border-blue-400" style={{ borderColor: cv.coverImage === url ? GHL.accent : 'transparent' }}><img src={url} alt="" className="w-full h-full object-cover" /></button>))}</div></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
