'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmtDate, fmt, nights } from '@/lib/utils';
import type { Itinerary, AgencyProfile } from '@/lib/types';

interface Props { itin: Itinerary; agencyProfile: AgencyProfile; onBack: () => void; }

export default function ShareableTrip({ itin, agencyProfile, onBack }: Props) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const nightCount = nights(itin.startDate, itin.endDate);
  const dests = (itin.destinations?.length > 1) ? itin.destinations.join(' \u2022 ') : itin.destination;

  // Generate day blocks
  const days: { num: number; date: string; items: { type: string; label: string; detail: string; icon: string; color: string }[] }[] = [];
  if (itin.startDate && itin.endDate) {
    const start = new Date(itin.startDate);
    const end = new Date(itin.endDate);
    let dayNum = 1;
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const items: typeof days[0]['items'] = [];
      itin.flights.filter((f) => f.departure?.startsWith(dateStr)).forEach((f) => items.push({ type: 'flight', label: `${f.airline} ${f.flightNo}`, detail: `${f.from} \u2192 ${f.to}`, icon: 'plane', color: '#3b82f6' }));
      itin.hotels.filter((h) => h.checkIn === dateStr).forEach((h) => items.push({ type: 'hotel', label: h.name, detail: `Check-in \u2022 ${h.roomType || 'Room'}`, icon: 'hotel', color: '#f59e0b' }));
      itin.hotels.filter((h) => h.checkOut === dateStr).forEach((h) => items.push({ type: 'hotel', label: h.name, detail: 'Check-out', icon: 'hotel', color: '#f59e0b' }));
      itin.attractions.filter((a) => a.date === dateStr).forEach((a) => items.push({ type: 'activity', label: a.name, detail: `${a.city} \u2022 ${a.time || 'TBD'}`, icon: 'star', color: '#ec4899' }));
      itin.transport.filter((t) => t.pickupDateTime?.startsWith(dateStr)).forEach((t) => items.push({ type: 'transfer', label: `${t.type} - ${t.provider}`, detail: `${t.pickup} \u2192 ${t.dropoff}`, icon: 'car', color: '#8b5cf6' }));
      days.push({ num: dayNum, date: dateStr, items });
      dayNum++;
      current.setDate(current.getDate() + 1);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4"><button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="back" c="w-5 h-5" /></button><div className="flex-1"><h2 className="text-xl font-bold" style={{ color: GHL.text }}>Shareable Trip Page</h2><p className="text-sm" style={{ color: GHL.muted }}>Preview how your client will see this trip</p></div><button onClick={() => setShowShareModal(true)} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: GHL.accent }}><Icon n="globe" c="w-4 h-4" /> Share</button></div>

      {/* Shareable page preview */}
      <div className="bg-white rounded-2xl border shadow-lg overflow-hidden" style={{ borderColor: GHL.border }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #093168, #1a5298)', padding: '40px 32px' }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: 'rgba(255,255,255,0.2)' }}>{agencyProfile.name.charAt(0)}</div>
            <span className="text-sm font-medium text-white/70">{agencyProfile.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{itin.title}</h1>
          <p className="text-white/60 text-sm mb-4">{dests}</p>
          <div className="flex gap-6">
            {[{ l: 'Duration', v: `${nightCount} nights` }, { l: 'Travelers', v: `${itin.passengers} guests` }, { l: 'Departs', v: fmtDate(itin.startDate) }].map((s) => (<div key={s.l}><p className="text-white/40 text-[10px] uppercase tracking-wider">{s.l}</p><p className="text-white font-semibold text-sm">{s.v}</p></div>))}
          </div>
        </div>

        {/* Days */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Your Itinerary</p>
          {days.map((day) => {
            const isOpen = expandedDay === day.num;
            return (
              <div key={day.num} className="rounded-xl border overflow-hidden" style={{ borderColor: isOpen ? GHL.accent + '40' : GHL.border }}>
                <button onClick={() => setExpandedDay(isOpen ? null : day.num)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: day.items.length > 0 ? GHL.accentLight : GHL.bg, color: day.items.length > 0 ? GHL.accent : GHL.muted }}>{day.num}</span>
                  <div className="flex-1"><p className="text-sm font-semibold" style={{ color: GHL.text }}>Day {day.num}</p><p className="text-[10px]" style={{ color: GHL.muted }}>{fmtDate(day.date)} \u2022 {day.items.length} activities</p></div>
                  <Icon n={isOpen ? 'chevronDown' : 'chevronRight'} c="w-4 h-4" />
                </button>
                {isOpen && day.items.length > 0 && (
                  <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: GHL.border }}>
                    {day.items.map((item, idx) => (<div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: '#fafbfc' }}><span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: item.color + '15', color: item.color }}><Icon n={item.icon} c="w-3.5 h-3.5" /></span><div><p className="text-xs font-semibold" style={{ color: GHL.text }}>{item.label}</p><p className="text-[10px]" style={{ color: GHL.muted }}>{item.detail}</p></div></div>))}
                  </div>
                )}
                {isOpen && day.items.length === 0 && <div className="px-4 pb-4 border-t" style={{ borderColor: GHL.border }}><p className="text-xs text-center py-3" style={{ color: GHL.muted }}>Free day \u2014 explore at your own pace</p></div>}
              </div>
            );
          })}
          {days.length === 0 && <p className="text-sm text-center py-6" style={{ color: GHL.muted }}>Set trip dates to generate the day-by-day view</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t text-center" style={{ borderColor: GHL.border, background: GHL.bg }}>
          <p className="text-xs" style={{ color: GHL.muted }}>Prepared by {agencyProfile.name} \u2022 {agencyProfile.email} \u2022 {agencyProfile.phone}</p>
        </div>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: GHL.text }}>Share This Trip</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ background: GHL.bg }}><p className="text-xs font-semibold" style={{ color: GHL.text }}>Share Link</p><p className="text-[10px] mt-1" style={{ color: GHL.muted }}>Shareable links will be available when connected to a backend. For now, use the Client Itinerary print view.</p></div>
              <button onClick={() => { window.print(); setShowShareModal(false); }} className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: GHL.accent }}>Print / Save as PDF</button>
              <button onClick={() => setShowShareModal(false)} className="w-full py-2 text-sm" style={{ color: GHL.muted }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
