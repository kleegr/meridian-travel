'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmt } from '@/lib/utils';
import type { Flight, Row } from '@/lib/types';

interface Props {
  flights: Flight[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

const TRIP_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  'Round Trip': { bg: '#dbeafe', color: '#1e40af', label: 'Round Trip' },
  'One Way': { bg: '#fef3c7', color: '#92400e', label: 'One Way' },
  'Multi-City': { bg: '#ede9fe', color: '#5b21b6', label: 'Multi-City' },
  'Connection': { bg: '#fce7f3', color: '#9d174d', label: 'Connection' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Scheduled': { bg: '#f0f4f8', color: '#475569' },
  'On Time': { bg: '#ecfdf5', color: '#065f46' },
  'Delayed': { bg: '#fef2f2', color: '#991b1b' },
  'Boarding': { bg: '#eff6ff', color: '#1e40af' },
  'In Air': { bg: '#eff6ff', color: '#1e40af' },
  'Landed': { bg: '#ecfdf5', color: '#065f46' },
  'Cancelled': { bg: '#fef2f2', color: '#991b1b' },
};

interface FlightGroup {
  id: string;
  tripType: string;
  flights: Flight[];
  totalCost: number;
  totalSell: number;
}

export default function FlightGroupView({ flights, onEdit, onDelete, onAdd }: Props) {
  // Group flights by connectionGroup, then by tripType for ungrouped
  const groups = useMemo(() => {
    const result: FlightGroup[] = [];
    const grouped = new Map<string, Flight[]>();
    const ungrouped: Flight[] = [];

    flights.forEach((f) => {
      if (f.connectionGroup && f.connectionGroup.trim()) {
        const existing = grouped.get(f.connectionGroup) || [];
        existing.push(f);
        grouped.set(f.connectionGroup, existing);
      } else {
        ungrouped.push(f);
      }
    });

    // Add connection groups
    grouped.forEach((grpFlights, groupId) => {
      const sorted = [...grpFlights].sort((a, b) => (a.legOrder || 0) - (b.legOrder || 0));
      result.push({
        id: `conn-${groupId}`,
        tripType: sorted[0]?.tripType || 'Connection',
        flights: sorted,
        totalCost: sorted.reduce((s, f) => s + (f.cost || 0), 0),
        totalSell: sorted.reduce((s, f) => s + (f.sell || 0), 0),
      });
    });

    // Add ungrouped flights as individual groups
    ungrouped.forEach((f) => {
      result.push({
        id: `single-${f.id}`,
        tripType: f.tripType || 'One Way',
        flights: [f],
        totalCost: f.cost || 0,
        totalSell: f.sell || 0,
      });
    });

    return result;
  }, [flights]);

  if (flights.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm mb-3">No flights yet</p>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}>
          <Icon n="plus" c="w-4 h-4" /> Add Flight
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const typeStyle = TRIP_TYPE_STYLES[group.tripType] || TRIP_TYPE_STYLES['One Way'];
        const isMultiLeg = group.flights.length > 1;
        const profit = group.totalSell - group.totalCost;

        return (
          <div key={group.id} className="rounded-xl border overflow-hidden" style={{ borderColor: isMultiLeg ? typeStyle.color + '40' : GHL.border }}>
            {/* Group header */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: typeStyle.bg }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: typeStyle.color + '20', color: typeStyle.color }}>
                  {typeStyle.label}
                </span>
                {isMultiLeg && (
                  <span className="text-[10px] font-medium" style={{ color: typeStyle.color }}>
                    {group.flights.length} legs
                  </span>
                )}
                {group.flights[0]?.pnr && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.6)', color: GHL.text }}>
                    PNR: {group.flights[0].pnr}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: GHL.muted }}>Cost: {fmt(group.totalCost)}</span>
                <span style={{ color: GHL.text }} className="font-medium">Sell: {fmt(group.totalSell)}</span>
                <span style={{ color: profit >= 0 ? GHL.success : '#ef4444' }} className="font-semibold">{fmt(profit)}</span>
              </div>
            </div>

            {/* Flight legs */}
            <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
              {group.flights.map((f, legIdx) => {
                const statusStyle = STATUS_STYLES[f.status] || STATUS_STYLES['Scheduled'];
                return (
                  <div key={f.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors group">
                    {/* Leg indicator for multi-leg */}
                    {isMultiLeg && (
                      <div className="flex flex-col items-center">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: typeStyle.bg, color: typeStyle.color, border: `1.5px solid ${typeStyle.color}` }}>
                          {legIdx + 1}
                        </span>
                        {legIdx < group.flights.length - 1 && (
                          <div className="w-0.5 h-4 mt-0.5" style={{ background: typeStyle.color + '40' }} />
                        )}
                      </div>
                    )}

                    {/* Route */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <div className="text-center">
                        <p className="text-sm font-bold" style={{ color: GHL.text }}>{f.from || '---'}</p>
                        <p className="text-[10px]" style={{ color: GHL.muted }}>{f.fromCity || ''}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-1 mx-2">
                        <div className="h-px flex-1" style={{ background: GHL.border }} />
                        <Icon n="plane" c="w-3.5 h-3.5" />
                        <div className="h-px flex-1" style={{ background: GHL.border }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold" style={{ color: GHL.text }}>{f.to || '---'}</p>
                        <p className="text-[10px]" style={{ color: GHL.muted }}>{f.toCity || ''}</p>
                      </div>
                    </div>

                    {/* Flight info */}
                    <div className="flex-1 flex items-center gap-4 text-xs">
                      <div>
                        <p className="font-semibold" style={{ color: GHL.text }}>{f.airline} {f.flightNo}</p>
                        <p style={{ color: GHL.muted }}>{f.seatClass || 'Economy'}</p>
                      </div>
                      <div>
                        <p style={{ color: GHL.text }}>{f.scheduledDeparture || ''}</p>
                        <p style={{ color: GHL.muted }}>{f.duration || ''}</p>
                      </div>
                      {f.status && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          {f.status}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
