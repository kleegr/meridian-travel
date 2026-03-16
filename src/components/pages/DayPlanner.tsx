'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { Itinerary } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onUpdate: (u: Itinerary) => void;
}

interface DayBlock {
  date: string;
  dayNum: number;
  flights: typeof itin.flights;
  hotels: typeof itin.hotels;
  attractions: typeof itin.attractions;
  transport: typeof itin.transport;
}

var itin: Itinerary;

export default function DayPlanner({ itin: itinProp, onUpdate }: Props) {
  const [dragDay, setDragDay] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Generate days from start to end date
  const days = useMemo(() => {
    if (!itinProp.startDate || !itinProp.endDate) return [];
    const start = new Date(itinProp.startDate);
    const end = new Date(itinProp.endDate);
    const result: DayBlock[] = [];
    let dayNum = 1;
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        dayNum,
        flights: itinProp.flights.filter((f) => f.departure?.startsWith(dateStr) || f.arrival?.startsWith(dateStr)),
        hotels: itinProp.hotels.filter((h) => h.checkIn === dateStr || h.checkOut === dateStr),
        attractions: itinProp.attractions.filter((a) => a.date === dateStr),
        transport: itinProp.transport.filter((t) => t.pickupDateTime?.startsWith(dateStr)),
      });
      dayNum++;
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [itinProp]);

  // Get city for a given day based on what's happening
  const getDayCity = (day: DayBlock): string => {
    if (day.hotels.length > 0) return day.hotels[0].city;
    if (day.flights.length > 0) return day.flights[0].toCity || day.flights[0].to;
    if (day.attractions.length > 0) return day.attractions[0].city;
    return '';
  };

  const getDayItemCount = (day: DayBlock): number => {
    return day.flights.length + day.hotels.length + day.attractions.length + day.transport.length;
  };

  const handleDragStart = (dayNum: number) => setDragDay(dayNum);
  const handleDragOver = (e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    // Visual feedback only — actual reorder of attractions on drop
  };
  const handleDrop = (e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    if (dragDay === null || dragDay === targetDay) { setDragDay(null); return; }
    // Move attractions from dragDay to targetDay
    const sourceDate = days.find((d) => d.dayNum === dragDay)?.date;
    const targetDate = days.find((d) => d.dayNum === targetDay)?.date;
    if (!sourceDate || !targetDate) { setDragDay(null); return; }

    const updatedAttractions = itinProp.attractions.map((a) => {
      if (a.date === sourceDate) return { ...a, date: targetDate };
      return a;
    });

    onUpdate({ ...itinProp, attractions: updatedAttractions });
    setDragDay(null);
  };

  if (days.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: GHL.border }}>
        <Icon n="calendar" c="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="font-semibold" style={{ color: GHL.text }}>No dates set</p>
        <p className="text-sm mt-1" style={{ color: GHL.muted }}>Set departure and return dates to see the day-by-day view</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-sm" style={{ color: GHL.text }}>Day-by-Day Planner</p>
            <p className="text-[10px]" style={{ color: GHL.muted }}>{days.length} days \u00b7 Drag activities between days to reorganize</p>
          </div>
        </div>

        <div className="space-y-2">
          {days.map((day) => {
            const city = getDayCity(day);
            const itemCount = getDayItemCount(day);
            const isExpanded = expandedDay === day.dayNum;
            const isDragTarget = dragDay !== null && dragDay !== day.dayNum;

            return (
              <div
                key={day.dayNum}
                draggable
                onDragStart={() => handleDragStart(day.dayNum)}
                onDragOver={(e) => handleDragOver(e, day.dayNum)}
                onDrop={(e) => handleDrop(e, day.dayNum)}
                className={`rounded-xl border transition-all ${isDragTarget ? 'border-dashed border-blue-300 bg-blue-50/30' : ''}`}
                style={{ borderColor: isDragTarget ? '#93c5fd' : GHL.border, opacity: dragDay === day.dayNum ? 0.5 : 1 }}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50/50 rounded-xl"
                  onClick={() => setExpandedDay(isExpanded ? null : day.dayNum)}
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="cursor-grab" style={{ color: GHL.muted }}><Icon n="grip" c="w-3.5 h-3.5" /></span>
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: itemCount > 0 ? GHL.accentLight : GHL.bg, color: itemCount > 0 ? GHL.accent : GHL.muted }}>
                      {day.dayNum}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: GHL.text }}>Day {day.dayNum}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: GHL.bg, color: GHL.muted }}>{fmtDate(day.date)}</span>
                      {city && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: GHL.accentLight, color: GHL.accent }}>{city}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {day.flights.length > 0 && <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#3b82f6' }}><Icon n="plane" c="w-2.5 h-2.5" /> {day.flights.length}</span>}
                      {day.hotels.length > 0 && <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#f59e0b' }}><Icon n="hotel" c="w-2.5 h-2.5" /> {day.hotels.length}</span>}
                      {day.attractions.length > 0 && <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#ec4899' }}><Icon n="star" c="w-2.5 h-2.5" /> {day.attractions.length}</span>}
                      {day.transport.length > 0 && <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#8b5cf6' }}><Icon n="car" c="w-2.5 h-2.5" /> {day.transport.length}</span>}
                      {itemCount === 0 && <span className="text-[10px]" style={{ color: GHL.muted }}>No activities yet</span>}
                    </div>
                  </div>
                  <Icon n={isExpanded ? 'chevronDown' : 'chevronRight'} c="w-4 h-4" />
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t" style={{ borderColor: GHL.border }}>
                    {day.flights.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: '#eff6ff' }}>
                        <Icon n="plane" c="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                        <span className="text-xs font-medium" style={{ color: GHL.text }}>{f.airline} {f.flightNo}</span>
                        <span className="text-[10px]" style={{ color: GHL.muted }}>{f.from} \u2192 {f.to}</span>
                      </div>
                    ))}
                    {day.hotels.map((h) => (
                      <div key={h.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: '#fffbeb' }}>
                        <Icon n="hotel" c="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                        <span className="text-xs font-medium" style={{ color: GHL.text }}>{h.name}</span>
                        <span className="text-[10px]" style={{ color: GHL.muted }}>{h.checkIn === day.date ? 'Check-in' : 'Check-out'}</span>
                      </div>
                    ))}
                    {day.attractions.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: '#fdf2f8' }}>
                        <Icon n="star" c="w-3.5 h-3.5" style={{ color: '#ec4899' }} />
                        <span className="text-xs font-medium" style={{ color: GHL.text }}>{a.name}</span>
                        {a.time && <span className="text-[10px]" style={{ color: GHL.muted }}>{a.time}</span>}
                      </div>
                    ))}
                    {day.transport.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: '#f5f3ff' }}>
                        <Icon n="car" c="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                        <span className="text-xs font-medium" style={{ color: GHL.text }}>{t.type} - {t.provider}</span>
                        <span className="text-[10px]" style={{ color: GHL.muted }}>{t.pickup} \u2192 {t.dropoff}</span>
                      </div>
                    ))}
                    {itemCount === 0 && (
                      <p className="text-xs text-center py-3" style={{ color: GHL.muted }}>Drop activities here or add from the Bookings tab</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
