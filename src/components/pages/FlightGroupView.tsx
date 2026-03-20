'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmt, fmtDate } from '@/lib/utils';
import type { Flight, Row } from '@/lib/types';

interface Props { flights: Flight[]; onEdit: (id: number) => void; onDelete: (id: number) => void; onAdd: () => void; }

const TRIP_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  'Round Trip': { bg: '#dbeafe', color: '#1e40af', label: 'Round Trip' },
  'One Way': { bg: '#fef3c7', color: '#92400e', label: 'One Way' },
  'Multi-City': { bg: '#ede9fe', color: '#5b21b6', label: 'Multi-City' },
  'Connection': { bg: '#fce7f3', color: '#9d174d', label: 'Connection' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Scheduled': { bg: '#f0f4f8', color: '#475569' },
  'Confirmed': { bg: '#ecfdf5', color: '#065f46' },
  'On Time': { bg: '#ecfdf5', color: '#065f46' },
  'Delayed': { bg: '#fef2f2', color: '#991b1b' },
  'Boarding': { bg: '#eff6ff', color: '#1e40af' },
  'In Air': { bg: '#eff6ff', color: '#1e40af' },
  'Landed': { bg: '#ecfdf5', color: '#065f46' },
  'Arrived': { bg: '#ecfdf5', color: '#065f46' },
  'Cancelled': { bg: '#fef2f2', color: '#991b1b' },
  'Diverted': { bg: '#fef3c7', color: '#92400e' },
};

function safeFmtDate(d: string): string {
  if (!d || d === 'undefined' || d.length < 8) return '';
  try { return fmtDate(d.split('T')[0]); } catch { return ''; }
}

function parseTime12(t: string): { h: number; m: number } | null {
  const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1]); const m = parseInt(match[2]);
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return { h, m };
}

function toTime12(h: number, m: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Calculate arrival time and date from departure + duration
function calcArrival(f: Flight): { arrTime: string; arrDate: string; nextDay: boolean } | null {
  const depDate = f.departure?.split('T')[0];
  const depTimeStr = f.scheduledDeparture;
  const durStr = f.duration;
  if (!depDate || !depTimeStr || !durStr) return null;
  
  const parsed = parseTime12(depTimeStr);
  const durMatch = durStr.match(/(\d+)h\s*(\d+)m?/);
  if (!parsed || !durMatch) return null;
  
  const durMin = parseInt(durMatch[1]) * 60 + parseInt(durMatch[2]);
  const depDT = new Date(`${depDate}T${String(parsed.h).padStart(2,'0')}:${String(parsed.m).padStart(2,'0')}:00`);
  if (isNaN(depDT.getTime())) return null;
  
  const arrDT = new Date(depDT.getTime() + durMin * 60000);
  const arrDate = arrDT.toISOString().split('T')[0];
  const nextDay = arrDate !== depDate;
  return { arrTime: toTime12(arrDT.getHours(), arrDT.getMinutes()), arrDate, nextDay };
}

function formatLastSynced(iso?: string): string {
  if (!iso) return '';
  try { const d = new Date(iso); const now = new Date(); const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now'; if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60); if (diffHr < 24) return `${diffHr}h ago`;
    return safeFmtDate(iso); } catch { return ''; }
}

interface FlightGroup { id: string; tripType: string; flights: Flight[]; totalCost: number; totalSell: number; }

export default function FlightGroupView({ flights, onEdit, onDelete, onAdd }: Props) {
  const groups = useMemo(() => {
    const result: FlightGroup[] = [];
    const grouped = new Map<string, Flight[]>();
    const ungrouped: Flight[] = [];
    flights.forEach((f) => {
      if (f.connectionGroup && f.connectionGroup.trim()) { const existing = grouped.get(f.connectionGroup) || []; existing.push(f); grouped.set(f.connectionGroup, existing); }
      else { ungrouped.push(f); }
    });
    grouped.forEach((grpFlights, groupId) => {
      const sorted = [...grpFlights].sort((a, b) => (a.legOrder || 0) - (b.legOrder || 0));
      result.push({ id: `conn-${groupId}`, tripType: sorted[0]?.tripType || 'One Way', flights: sorted, totalCost: sorted.reduce((s, f) => s + (f.cost || 0), 0), totalSell: sorted.reduce((s, f) => s + (f.sell || 0), 0) });
    });
    ungrouped.forEach((f) => { result.push({ id: `single-${f.id}`, tripType: f.tripType || 'One Way', flights: [f], totalCost: f.cost || 0, totalSell: f.sell || 0 }); });
    return result;
  }, [flights]);

  if (flights.length === 0) {
    return (<div className="text-center py-8"><p className="text-gray-400 text-sm mb-3">No flights added yet</p><button onClick={onAdd} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Add Flight</button></div>);
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const typeStyle = TRIP_TYPE_STYLES[group.tripType] || TRIP_TYPE_STYLES['One Way'];
        const isMultiLeg = group.flights.length > 1;
        const profit = group.totalSell - group.totalCost;
        const routeChain = isMultiLeg ? [group.flights[0]?.from || group.flights[0]?.fromCity, ...group.flights.map(f => f.to || f.toCity)].filter(Boolean).join(' > ') : '';

        return (
          <div key={group.id} className="rounded-xl border overflow-hidden" style={{ borderColor: isMultiLeg ? typeStyle.color + '40' : GHL.border }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: typeStyle.bg }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: typeStyle.color + '20', color: typeStyle.color }}>{typeStyle.label}</span>
                {isMultiLeg && <span className="text-[10px] font-medium" style={{ color: typeStyle.color }}>{group.flights.length} legs</span>}
                {group.flights[0]?.pnr && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.6)', color: GHL.text }}>PNR: {group.flights[0].pnr}</span>}
                {routeChain && <span className="text-[10px] font-semibold" style={{ color: typeStyle.color }}>{routeChain}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: GHL.muted }}>Cost: {fmt(group.totalCost)}</span>
                <span style={{ color: GHL.text }} className="font-medium">Sell: {fmt(group.totalSell)}</span>
                <span style={{ color: profit >= 0 ? GHL.success : '#ef4444' }} className="font-semibold">{fmt(profit)}</span>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
              {group.flights.map((f, legIdx) => {
                const statusStyle = STATUS_STYLES[f.status] || STATUS_STYLES['Scheduled'];
                const depDate = safeFmtDate(f.departure || '');
                const isDelayed = f.status === 'Delayed' || f.status === 'Cancelled' || f.status === 'Diverted';
                const lastSynced = formatLastSynced(f.lastSynced);
                const fromDisplay = f.from || f.fromCity || '---';
                const fromCityDisplay = f.from ? (f.fromCity || '') : '';
                const toDisplay = f.to || f.toCity || '---';
                const toCityDisplay = f.to ? (f.toCity || '') : '';
                const arrival = calcArrival(f);
                const arrDate = arrival ? safeFmtDate(arrival.arrDate) : '';

                return (
                  <div key={f.id} className={`px-4 py-3 hover:bg-gray-50/50 transition-colors group ${isDelayed ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-center gap-4">
                      {isMultiLeg && (
                        <div className="flex flex-col items-center">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: typeStyle.bg, color: typeStyle.color, border: `1.5px solid ${typeStyle.color}` }}>{legIdx + 1}</span>
                          {legIdx < group.flights.length - 1 && <div className="w-0.5 h-4 mt-0.5" style={{ background: typeStyle.color + '40' }} />}
                        </div>
                      )}

                      {/* DEPARTURE */}
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-bold" style={{ color: GHL.text }}>{fromDisplay}</p>
                        <p className="text-[10px]" style={{ color: GHL.muted }}>{fromCityDisplay}</p>
                        {f.scheduledDeparture && <p className="text-[11px] font-semibold mt-0.5" style={{ color: GHL.accent }}>{f.scheduledDeparture}</p>}
                        {depDate && <p className="text-[9px]" style={{ color: GHL.muted }}>{depDate}</p>}
                      </div>

                      {/* FLIGHT LINE */}
                      <div className="flex-1 flex flex-col items-center gap-0.5 mx-1">
                        <p className="text-[10px] font-semibold" style={{ color: GHL.text }}>{f.airline} {f.flightNo}</p>
                        <div className="flex items-center gap-1 w-full">
                          <div className="h-px flex-1" style={{ background: GHL.border }} />
                          <Icon n="plane" c="w-3 h-3" />
                          <div className="h-px flex-1" style={{ background: GHL.border }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px]" style={{ color: GHL.muted }}>{f.seatClass || 'Economy'}</span>
                          {f.duration && <span className="text-[9px] font-medium" style={{ color: GHL.muted }}>{f.duration}</span>}
                        </div>
                      </div>

                      {/* ARRIVAL */}
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-bold" style={{ color: GHL.text }}>{toDisplay}</p>
                        <p className="text-[10px]" style={{ color: GHL.muted }}>{toCityDisplay}</p>
                        {arrival ? (
                          <>
                            <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#059669' }}>{arrival.arrTime}</p>
                            <p className="text-[9px]" style={{ color: GHL.muted }}>
                              {arrDate}{arrival.nextDay && <span className="text-[8px] font-bold ml-0.5" style={{ color: '#d97706' }}>+1</span>}
                            </p>
                          </>
                        ) : (
                          f.scheduledArrival && <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#059669' }}>{f.scheduledArrival}</p>
                        )}
                      </div>

                      {/* STATUS & META */}
                      <div className="flex items-center gap-2 ml-2">
                        {f.status && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isDelayed ? 'animate-pulse' : ''}`} style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {f.status}
                          </span>
                        )}
                        {lastSynced && (
                          <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: '#f0f4f8', color: '#94a3b8' }} title="Last synced">
                            {lastSynced}
                          </span>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(f.id)} className="p-1 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500"><Icon n="edit" c="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(f.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {/* Terminal info row */}
                    {(f.depTerminal || f.arrTerminal) && (
                      <div className="flex items-center gap-4 mt-1 pl-2" style={{ marginLeft: isMultiLeg ? 40 : 0 }}>
                        {f.depTerminal && <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#f0f5ff', color: '#3b82f6' }}>T{f.depTerminal}</span>}
                        <span className="flex-1" />
                        {f.arrTerminal && <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#f0fdf4', color: '#059669' }}>T{f.arrTerminal}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <button onClick={onAdd} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}>
        <Icon n="plus" c="w-4 h-4" /> Add Flight
      </button>
    </div>
  );
}
