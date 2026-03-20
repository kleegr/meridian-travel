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
  'Scheduled': { bg: '#f0f4f8', color: '#475569' }, 'Confirmed': { bg: '#ecfdf5', color: '#065f46' },
  'On Time': { bg: '#ecfdf5', color: '#065f46' }, 'Delayed': { bg: '#fef2f2', color: '#991b1b' },
  'Boarding': { bg: '#eff6ff', color: '#1e40af' }, 'In Air': { bg: '#eff6ff', color: '#1e40af' },
  'Landed': { bg: '#ecfdf5', color: '#065f46' }, 'Arrived': { bg: '#ecfdf5', color: '#065f46' },
  'Cancelled': { bg: '#fef2f2', color: '#991b1b' }, 'Diverted': { bg: '#fef3c7', color: '#92400e' },
};

function safeFmtDate(d: string): string { if (!d || d === 'undefined' || d.length < 8) return ''; try { return fmtDate(d.split('T')[0]); } catch { return ''; } }
function parseTime12(t: string): { h: number; m: number } | null { const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i); if (!match) return null; let h = parseInt(match[1]); const m = parseInt(match[2]); if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12; if (match[3].toUpperCase() === 'AM' && h === 12) h = 0; return { h, m }; }
function toTime12(h: number, m: number): string { const ampm = h >= 12 ? 'PM' : 'AM'; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h; return `${h12}:${String(m).padStart(2, '0')} ${ampm}`; }

function calcArrival(f: Flight): { arrTime: string; arrDate: string; nextDay: boolean } | null {
  const depDate = f.departure?.split('T')[0]; const depTimeStr = f.scheduledDeparture; const durStr = f.duration;
  if (!depDate || !depTimeStr || !durStr) return null;
  const parsed = parseTime12(depTimeStr); const durMatch = durStr.match(/(\d+)h\s*(\d+)m?/);
  if (!parsed || !durMatch) return null;
  const durMin = parseInt(durMatch[1]) * 60 + parseInt(durMatch[2]);
  const depDT = new Date(`${depDate}T${String(parsed.h).padStart(2,'0')}:${String(parsed.m).padStart(2,'0')}:00`);
  if (isNaN(depDT.getTime())) return null;
  const arrDT = new Date(depDT.getTime() + durMin * 60000);
  const arrDateStr = arrDT.toISOString().split('T')[0];
  return { arrTime: toTime12(arrDT.getHours(), arrDT.getMinutes()), arrDate: arrDateStr, nextDay: arrDateStr !== depDate };
}

interface FlightGroup { id: string; tripType: string; flights: Flight[]; totalCost: number; totalSell: number; }

export default function FlightGroupView({ flights, onEdit, onDelete, onAdd }: Props) {
  const groups = useMemo(() => {
    const result: FlightGroup[] = []; const grouped = new Map<string, Flight[]>(); const ungrouped: Flight[] = [];
    flights.forEach((f) => { if (f.connectionGroup && f.connectionGroup.trim()) { const existing = grouped.get(f.connectionGroup) || []; existing.push(f); grouped.set(f.connectionGroup, existing); } else { ungrouped.push(f); } });
    grouped.forEach((grpFlights, groupId) => { const sorted = [...grpFlights].sort((a, b) => (a.legOrder || 0) - (b.legOrder || 0)); result.push({ id: `conn-${groupId}`, tripType: sorted[0]?.tripType || 'One Way', flights: sorted, totalCost: sorted.reduce((s, f) => s + (f.cost || 0), 0), totalSell: sorted.reduce((s, f) => s + (f.sell || 0), 0) }); });
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
        const routeChain = isMultiLeg ? [group.flights[0]?.from || group.flights[0]?.fromCity, ...group.flights.map(f => f.to || f.toCity)].filter(Boolean).join(' \u203a ') : '';

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
                const fromDisplay = f.from || f.fromCity || '---';
                const fromCityDisplay = f.from ? (f.fromCity || '') : '';
                const toDisplay = f.to || f.toCity || '---';
                const toCityDisplay = f.to ? (f.toCity || '') : '';
                const arrival = calcArrival(f);

                return (
                  <div key={f.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition-colors group ${isDelayed ? 'bg-red-50/30' : ''}`}>
                    {isMultiLeg && (
                      <div className="flex flex-col items-center">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: typeStyle.bg, color: typeStyle.color, border: `1.5px solid ${typeStyle.color}` }}>{legIdx + 1}</span>
                        {legIdx < group.flights.length - 1 && <div className="w-0.5 h-3 mt-0.5" style={{ background: typeStyle.color + '40' }} />}
                      </div>
                    )}

                    {/* Route: FROM ——✈️——> TO */}
                    <div className="flex items-center gap-1.5 min-w-[180px]">
                      <div className="text-center">
                        <p className="text-sm font-bold leading-tight" style={{ color: GHL.text }}>{fromDisplay}</p>
                        <p className="text-[9px] leading-tight" style={{ color: GHL.muted }}>{fromCityDisplay}</p>
                      </div>
                      <div className="flex items-center gap-0.5 mx-1" style={{ minWidth: 50 }}>
                        <div className="h-px flex-1" style={{ background: '#cbd5e1' }} />
                        <span style={{ color: '#64748b', fontSize: 11, transform: 'rotate(-30deg)', display: 'inline-block' }}>✈</span>
                        <div className="h-px flex-1" style={{ background: '#cbd5e1' }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold leading-tight" style={{ color: GHL.text }}>{toDisplay}</p>
                        <p className="text-[9px] leading-tight" style={{ color: GHL.muted }}>{toCityDisplay}</p>
                      </div>
                    </div>

                    {/* Flight details - compact inline */}
                    <div className="flex items-center gap-3 flex-1 text-xs">
                      <p className="font-semibold whitespace-nowrap" style={{ color: GHL.text }}>{f.airline} {f.flightNo}</p>
                      <p className="whitespace-nowrap" style={{ color: GHL.muted }}>{f.seatClass || 'Economy'}</p>

                      {/* Departure → Arrival times */}
                      <div className="whitespace-nowrap">
                        <span className="font-medium" style={{ color: GHL.text }}>{f.scheduledDeparture || ''}</span>
                        {arrival && (
                          <span style={{ color: '#059669' }}>{' '}→{' '}{arrival.arrTime}{arrival.nextDay && <sup style={{ color: '#d97706', fontSize: 7, fontWeight: 800 }}>+1</sup>}</span>
                        )}
                      </div>

                      <p className="whitespace-nowrap" style={{ color: GHL.muted }}>{f.duration || ''}</p>

                      {depDate && <span className="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: GHL.bg, color: GHL.muted }}>{depDate}</span>}

                      {f.status && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap ${isDelayed ? 'animate-pulse' : ''}`} style={{ background: statusStyle.bg, color: statusStyle.color }}>{f.status}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => onEdit(f.id)} className="p-1 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500"><Icon n="edit" c="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDelete(f.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                    </div>
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
