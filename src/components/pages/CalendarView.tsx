'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { Itinerary } from '@/lib/types';

interface Props { itineraries: Itinerary[]; onSelect: (id: number) => void; }

interface CalEvent { date: string; type: string; label: string; sub: string; color: string; bg: string; itinId: number; itinTitle: string; }

const COLORS: Record<string, { color: string; bg: string }> = {
  flight: { color: '#1e40af', bg: '#dbeafe' },
  checkin: { color: '#b45309', bg: '#fef3c7' },
  checkout: { color: '#92400e', bg: '#fef3c7' },
  transfer: { color: '#7c3aed', bg: '#ede9fe' },
  activity: { color: '#be185d', bg: '#fce7f3' },
  trip: { color: '#093168', bg: '#D0E2FA' },
};

function buildEvents(itins: Itinerary[]): CalEvent[] {
  const ev: CalEvent[] = [];
  itins.forEach((it) => {
    it.flights.forEach((f) => { const d = f.departure.split('T')[0] || f.departure.split(' ')[0]; ev.push({ date: d, type: 'Flight', label: `${f.airline} ${f.flightNo}`, sub: `${f.from}\u2192${f.to}`, ...COLORS.flight, itinId: it.id, itinTitle: it.title }); });
    it.hotels.forEach((h) => { ev.push({ date: h.checkIn, type: 'Check-in', label: h.name, sub: h.city, ...COLORS.checkin, itinId: it.id, itinTitle: it.title }); ev.push({ date: h.checkOut, type: 'Check-out', label: h.name, sub: h.city, ...COLORS.checkout, itinId: it.id, itinTitle: it.title }); });
    it.transport.forEach((t) => { const d = (t.pickupDateTime || '').split('T')[0] || (t.pickupDateTime || '').split(' ')[0] || ''; if (d) ev.push({ date: d, type: 'Transfer', label: t.type, sub: `${t.pickup}\u2192${t.dropoff}`, ...COLORS.transfer, itinId: it.id, itinTitle: it.title }); });
    it.attractions.forEach((a) => { if (a.date) ev.push({ date: a.date, type: 'Activity', label: a.name, sub: a.city, ...COLORS.activity, itinId: it.id, itinTitle: it.title }); });
  });
  return ev;
}

export default function CalendarView({ itineraries, onSelect }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const events = useMemo(() => buildEvents(itineraries), [itineraries]);
  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    events.forEach((e) => { if (!m.has(e.date)) m.set(e.date, []); m.get(e.date)!.push(e); });
    return m;
  }, [events]);

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());
  const todayStr = new Date().toISOString().split('T')[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Calendar</h2>
        <button onClick={today} className="text-sm font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: GHL.border, color: GHL.accent }}>Today</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4" style={{ background: GHL.sidebar }}>
          <button onClick={prev} className="p-2 rounded-lg hover:bg-white/10 text-white"><Icon n="back" c="w-5 h-5" /></button>
          <h3 className="text-lg font-bold text-white">{monthName}</h3>
          <button onClick={next} className="p-2 rounded-lg hover:bg-white/10 text-white"><Icon n="chevronRight" c="w-5 h-5" /></button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: GHL.border }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: GHL.muted }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (day === null) return <div key={`e${idx}`} className="min-h-[100px] border-b border-r" style={{ borderColor: '#f0f0f0', background: '#fafafa' }} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventsByDate.get(dateStr) || [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <div key={dateStr} onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)} className={`min-h-[100px] border-b border-r p-1.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`} style={{ borderColor: '#f0f0f0' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`} style={!isToday ? { color: GHL.text } : {}}>{day}</span>
                  {dayEvents.length > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: GHL.accentLight, color: GHL.accent }}>{dayEvents.length}</span>}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <div key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded truncate" style={{ background: e.bg, color: e.color }}>{e.type}: {e.label}</div>
                  ))}
                  {dayEvents.length > 3 && <p className="text-[9px] px-1.5" style={{ color: GHL.muted }}>+{dayEvents.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
          <h3 className="font-semibold mb-3" style={{ color: GHL.text }}>{new Date(selectedDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
          {selectedEvents.length === 0 ? <p className="text-sm" style={{ color: GHL.muted }}>No events on this day</p> : (
            <div className="space-y-2">
              {selectedEvents.map((e, i) => (
                <div key={i} onClick={() => onSelect(e.itinId)} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ border: `1px solid ${GHL.border}` }}>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ background: e.bg, color: e.color }}>{e.type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: GHL.text }}>{e.label}</p>
                    <p className="text-xs truncate" style={{ color: GHL.muted }}>{e.sub}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: GHL.bg, color: GHL.muted }}>{e.itinTitle}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
